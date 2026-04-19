"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Ban, Loader2, ShieldAlert, UserX } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { DataTable } from "@/components/data-table"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { FilterField } from "@/components/filter-bar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  classifyApiError,
  describeEmbeddedApiError,
  formatEmbeddedApiError,
  isUserCancelledStepUp,
} from "@/lib/api-error"
import { useStepUp } from "@/components/step-up/step-up-provider"
import { AccessDeniedPlaceholder } from "@/components/access-denied-placeholder"
import { SuperadminRouteGate } from "@/components/superadmin-route-gate"

type TargetType = "user" | "psychologist"

interface BlockedUserRow {
  id: number
  email: string | null
  phone: string | null
  firstName: string | null
  lastName: string | null
  role: string
  isBlocked: boolean
  blockedAt: string | null
  blockedReason: string | null
  psychologist: { id: number; specialization: string | null } | null
}

function BlockingPageContent() {
  const { runWithStepUp } = useStepUp()
  const [data, setData] = useState<BlockedUserRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const [filters, setFilters] = useState<{ targetType: string }>({ targetType: "all" })

  const [actionOpen, setActionOpen] = useState(false)
  const [actionType, setActionType] = useState<TargetType>("user")
  const [targetId, setTargetId] = useState("")
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)

  const filterFields = useMemo(
    () =>
      [
        {
          id: "targetType",
          placeholder: "Turi",
          options: [
            { value: "user", label: "Foydalanuvchi" },
            { value: "psychologist", label: "Psixolog" },
          ],
        },
      ] as FilterField[],
    [],
  )

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    setPermissionDenied(false)
    try {
      const res = await apiClient<PaginatedResponse<BlockedUserRow>>("/blocks", {
        params: {
          page,
          limit: 20,
          search,
          targetType: filters.targetType === "all" ? undefined : filters.targetType,
        },
      })
      setData(res.data)
      setTotal(res.total)
    } catch (e: unknown) {
      const { permissionDenied: denied } = classifyApiError(e)
      if (denied) setPermissionDenied(true)
      else setError(formatEmbeddedApiError(e))
    } finally {
      setLoading(false)
    }
  }, [page, search, filters.targetType])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openBlockDialog = () => {
    setActionType("user")
    setTargetId("")
    setReason("")
    setActionOpen(true)
  }

  const doBlock = async (e: React.FormEvent) => {
    e.preventDefault()
    const id = parseInt(targetId)
    if (!id) return
    setSaving(true)
    try {
      await runWithStepUp(
        async () => {
          if (actionType === "user") {
            await apiClient(`/blocks/users/${id}/block`, { method: "PATCH", body: { reason } })
          } else {
            await apiClient(`/blocks/psychologists/${id}/block`, { method: "PATCH", body: { reason } })
          }
        },
        {
          title: "Bloklashni tasdiqlang",
          description: "Global bloklash uchun akkaunt parolingizni kiriting.",
        },
      )
      toast.success("Bloklandi")
      setActionOpen(false)
      fetchData()
    } catch (e: unknown) {
      if (isUserCancelledStepUp(e)) return
      const d = describeEmbeddedApiError(e)
      toast.error(d.title, { description: d.description })
    } finally {
      setSaving(false)
    }
  }

  const doUnblock = async (row: BlockedUserRow) => {
    setSaving(true)
    try {
      await runWithStepUp(
        async () => {
          if (row.psychologist) {
            await apiClient(`/blocks/psychologists/${row.psychologist.id}/unblock`, { method: "PATCH" })
          } else {
            await apiClient(`/blocks/users/${row.id}/unblock`, { method: "PATCH" })
          }
        },
        {
          title: "Blokdan chiqarishni tasdiqlang",
          description: "Bu foydalanuvchini qayta faollashtirish uchun parolingizni kiriting.",
        },
      )
      toast.success("Blokdan chiqarildi")
      fetchData()
    } catch (e: unknown) {
      if (isUserCancelledStepUp(e)) return
      const d = describeEmbeddedApiError(e)
      toast.error(d.title, { description: d.description })
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      key: "person",
      title: "Shaxs",
      render: (u: BlockedUserRow) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {(u.firstName || u.lastName) ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : (u.email || `#${u.id}`)}
          </span>
          <span className="text-xs text-muted-foreground">{u.phone || u.email || "—"}</span>
        </div>
      ),
    },
    {
      key: "type",
      title: "Turi",
      render: (u: BlockedUserRow) =>
        u.psychologist ? (
          <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-100">Psixolog</Badge>
        ) : (
          <Badge variant="outline">Foydalanuvchi</Badge>
        ),
    },
    {
      key: "reason",
      title: "Sabab",
      render: (u: BlockedUserRow) => <span className="text-sm text-muted-foreground">{u.blockedReason || "—"}</span>,
    },
    {
      key: "blockedAt",
      title: "Sana",
      render: (u: BlockedUserRow) => (u.blockedAt ? new Date(u.blockedAt).toLocaleString("uz-UZ") : "—"),
    },
    {
      key: "actions",
      title: "",
      render: (u: BlockedUserRow) => (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            disabled={saving}
            onClick={() => doUnblock(u)}
            className="h-8"
          >
            <UserX className="size-4 mr-1.5" />
            Unblock
          </Button>
        </div>
      ),
    },
  ]

  if (permissionDenied) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Bloklash"
          description="Bloklangan foydalanuvchi va psixologlarni real bazadan boshqarish"
          icon={ShieldAlert}
        />
        <AccessDeniedPlaceholder
          title="Bloklash moduliga ruxsat yo'q"
          description="Bloklar ro'yxati va boshqaruv odatda moderatsiya yoki maxsus admin ruxsatini talab qiladi."
          detail={error}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bloklash"
        description="Bloklangan foydalanuvchi va psixologlarni real bazadan boshqarish"
        icon={ShieldAlert}
        actions={[{ label: "Bloklash", icon: Ban, onClick: openBlockDialog }]}
      />

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={20}
        loading={loading}
        error={error}
        onPageChange={setPage}
        onSearchChange={(q) => {
          setSearch(q)
          setPage(1)
        }}
        searchPlaceholder="Ism, email yoki telefon bo'yicha qidirish..."
        filterFields={filterFields}
        activeFilters={{ targetType: filters.targetType }}
        onFilterChange={(id, value) => {
          if (id === "targetType") setFilters((p) => ({ ...p, targetType: value }))
          setPage(1)
        }}
        onResetFilters={() => {
          setFilters({ targetType: "all" })
          setSearch("")
          setPage(1)
        }}
      />

      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Bloklash</DialogTitle>
            <DialogDescription>Foydalanuvchi yoki psixologni ID orqali bloklang.</DialogDescription>
          </DialogHeader>

          <form onSubmit={doBlock} className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Turi</Label>
              <Select value={actionType} onValueChange={(v) => setActionType(v as TargetType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Foydalanuvchi</SelectItem>
                  <SelectItem value="psychologist">Psixolog</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">ID</Label>
              <Input
                type="number"
                required
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="Masalan: 123"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Sabab (ixtiyoriy)</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Masalan: qoidabuzarlik"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setActionOpen(false)} className="sm:w-32">
                Bekor
              </Button>
              <Button type="submit" disabled={saving} className="sm:w-32">
                {saving && <Loader2 className="size-4 animate-spin mr-2" />}
                Saqlash
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function BlockingPage() {
  return (
    <SuperadminRouteGate title="Bloklash">
      <BlockingPageContent />
    </SuperadminRouteGate>
  )
}
