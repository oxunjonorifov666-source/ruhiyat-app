"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { EyeOff, Loader2, CheckCircle2, XCircle, ShieldAlert, Trash2, Eye, RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { DataTable } from "@/components/data-table"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { FilterField } from "@/components/filter-bar"
import { StatsCard, StatsGrid } from "@/components/stats-card"
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
import { describeEmbeddedApiError, formatEmbeddedApiError, isPermissionDeniedError } from "@/lib/api-error"
import { AccessDeniedPlaceholder } from "@/components/access-denied-placeholder"

type ModerationStatus = "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN"

interface ModerationRow {
  id: number
  contentType: string | null
  contentId: number
  contentTitle: string | null
  status: ModerationStatus
  moderatorId: number | null
  moderatorNote: string | null
  reviewedAt: string | null
  createdAt: string
  moderator?: { id: number; email: string | null; firstName: string | null; lastName: string | null } | null
}

interface ModerationStats {
  total: number
  pending: number
  approved: number
  rejected: number
  hidden: number
}

const statusBadge: Record<ModerationStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; cls?: string }> = {
  PENDING: { variant: "secondary", label: "Kutilmoqda" },
  APPROVED: { variant: "default", label: "Tasdiqlandi", cls: "bg-emerald-500 hover:bg-emerald-600" },
  REJECTED: { variant: "destructive", label: "Rad etildi" },
  HIDDEN: { variant: "outline", label: "Yashirildi" },
}

export default function ContentModerationPage() {
  const [stats, setStats] = useState<ModerationStats | null>(null)
  const [data, setData] = useState<ModerationRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [statsPermissionDenied, setStatsPermissionDenied] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [filters, setFilters] = useState<{ status: string; contentType: string }>({ status: "all", contentType: "all" })

  const [actionOpen, setActionOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [selected, setSelected] = useState<ModerationRow | null>(null)
  const [action, setAction] = useState<"approve" | "reject" | "hide" | "delete">("approve")
  const [note, setNote] = useState("")

  const filterFields = useMemo(
    () =>
      [
        {
          id: "status",
          placeholder: "Holat",
          options: [
            { value: "PENDING", label: "PENDING" },
            { value: "APPROVED", label: "APPROVED" },
            { value: "REJECTED", label: "REJECTED" },
            { value: "HIDDEN", label: "HIDDEN" },
          ],
        },
        {
          id: "contentType",
          placeholder: "Kontent",
          options: [
            { value: "article", label: "Article" },
            { value: "banner", label: "Banner" },
            { value: "video", label: "Video" },
            { value: "audio", label: "Audio" },
            { value: "affirmation", label: "Affirmation" },
            { value: "test", label: "Test" },
            { value: "training", label: "Training" },
          ],
        },
      ] as FilterField[],
    [],
  )

  const fetchStats = useCallback(async () => {
    try {
      const s = await apiClient<ModerationStats>("/content-moderation/stats")
      setStats(s)
      setStatsPermissionDenied(false)
      setStatsError(null)
    } catch (e: unknown) {
      setStats(null)
      if (isPermissionDeniedError(e)) {
        setStatsPermissionDenied(true)
        setStatsError(null)
      } else {
        setStatsPermissionDenied(false)
        setStatsError(formatEmbeddedApiError(e))
      }
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    setPermissionDenied(false)
    try {
      const res = await apiClient<PaginatedResponse<ModerationRow>>("/content-moderation", {
        params: {
          page,
          limit: 20,
          search,
          status: filters.status === "all" ? undefined : filters.status,
          contentType: filters.contentType === "all" ? undefined : filters.contentType,
        },
      })
      setData(res.data)
      setTotal(res.total)
    } catch (e: unknown) {
      setError(formatEmbeddedApiError(e))
      setPermissionDenied(isPermissionDeniedError(e))
    } finally {
      setLoading(false)
    }
  }, [page, search, filters.status, filters.contentType])

  useEffect(() => {
    fetchStats()
    fetchData()
  }, [fetchStats, fetchData])

  const openAction = (row: ModerationRow, next: typeof action) => {
    setSelected(row)
    setAction(next)
    setNote("")
    setActionOpen(true)
  }

  const submitAction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setActionLoading(true)
    try {
      await apiClient(`/content-moderation/${selected.id}/${action}`, {
        method: "PATCH",
        body: { moderatorNote: note || undefined },
      })
      toast.success("Yangilandi")
      setActionOpen(false)
      fetchStats()
      fetchData()
    } catch (e: unknown) {
      const d = describeEmbeddedApiError(e)
      toast.error(d.title, { description: d.description })
    } finally {
      setActionLoading(false)
    }
  }

  const columns = [
    {
      key: "title",
      title: "Kontent",
      render: (r: ModerationRow) => (
        <div className="flex flex-col">
          <span className="font-medium">{r.contentTitle || `#${r.contentId}`}</span>
          <span className="text-xs text-muted-foreground">{(r.contentType || "unknown").toUpperCase()}</span>
        </div>
      ),
    },
    {
      key: "status",
      title: "Holat",
      render: (r: ModerationRow) => {
        const meta = statusBadge[r.status]
        return (
          <Badge variant={meta.variant} className={meta.cls}>
            {meta.label}
          </Badge>
        )
      },
    },
    {
      key: "review",
      title: "Ko'rib chiqilgan",
      render: (r: ModerationRow) => (r.reviewedAt ? new Date(r.reviewedAt).toLocaleString("uz-UZ") : "—"),
    },
    {
      key: "moderator",
      title: "Moderator",
      render: (r: ModerationRow) => (
        <span className="text-sm text-muted-foreground">
          {r.moderator
            ? (r.moderator.firstName || r.moderator.lastName)
              ? `${r.moderator.firstName || ""} ${r.moderator.lastName || ""}`.trim()
              : (r.moderator.email || `#${r.moderator.id}`)
            : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "",
      render: (r: ModerationRow) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" className="h-8" onClick={() => openAction(r, "approve")}>
            <CheckCircle2 className="size-4 mr-1.5" /> Approve
          </Button>
          <Button size="sm" variant="outline" className="h-8" onClick={() => openAction(r, "reject")}>
            <XCircle className="size-4 mr-1.5" /> Reject
          </Button>
          <Button size="sm" variant="outline" className="h-8" onClick={() => openAction(r, "hide")}>
            <EyeOff className="size-4 mr-1.5" /> Hide
          </Button>
          <Button size="sm" variant="destructive" className="h-8" onClick={() => openAction(r, "delete")}>
            <Trash2 className="size-4 mr-1.5" /> Delete
          </Button>
        </div>
      ),
    },
  ]

  if (permissionDenied) {
    return (
      <div className="space-y-6 pb-10">
        <PageHeader
          title="Kontent nazorati"
          description="Kontent moderatsiyasi (real baza): approve/reject/hide/delete"
          icon={ShieldAlert}
        />
        <AccessDeniedPlaceholder
          title="Kontent moderatsiyasiga ruxsat yo'q"
          description="Moderatsiya odatda content.moderate (yoki platformadagi tegishli) ruxsatini talab qiladi. Bu ruxsat bo'lmasa, ro'yxat va amallar ochilmaydi."
          detail={error}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Kontent nazorati"
        description="Kontent moderatsiyasi (real baza): approve/reject/hide/delete"
        icon={ShieldAlert}
        actions={[
          {
            label: "Yangilash",
            icon: RefreshCw,
            variant: "outline",
            onClick: async () => {
              await fetchStats()
              await fetchData()
            },
          },
        ]}
      />

      {statsPermissionDenied ? (
        <AccessDeniedPlaceholder
          title="Statistikaga ruxsat yo'q"
          description="Asosiy moderatsiya ro'yxati ochilishi mumkin, lekin yuqoridagi statistikani ko'rish uchun alohida ruxsat talab qilinishi mumkin."
        />
      ) : statsError ? (
        <p className="text-sm text-destructive">{statsError}</p>
      ) : (
        <StatsGrid columns={5}>
          <StatsCard title="Jami" value={stats?.total || 0} icon={Eye} loading={!stats} iconColor="bg-slate-500/10 text-slate-700" />
          <StatsCard title="PENDING" value={stats?.pending || 0} icon={Loader2} loading={!stats} iconColor="bg-blue-500/10 text-blue-700" />
          <StatsCard title="APPROVED" value={stats?.approved || 0} icon={CheckCircle2} loading={!stats} iconColor="bg-emerald-500/10 text-emerald-700" />
          <StatsCard title="REJECTED" value={stats?.rejected || 0} icon={XCircle} loading={!stats} iconColor="bg-red-500/10 text-red-700" />
          <StatsCard title="HIDDEN" value={stats?.hidden || 0} icon={EyeOff} loading={!stats} iconColor="bg-amber-500/10 text-amber-700" />
        </StatsGrid>
      )}

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
        searchPlaceholder="Sarlavha bo'yicha qidirish..."
        filterFields={filterFields}
        activeFilters={{ status: filters.status, contentType: filters.contentType }}
        onFilterChange={(id, value) => {
          if (id === "status") setFilters((p) => ({ ...p, status: value }))
          if (id === "contentType") setFilters((p) => ({ ...p, contentType: value }))
          setPage(1)
        }}
        onResetFilters={() => {
          setFilters({ status: "all", contentType: "all" })
          setSearch("")
          setPage(1)
        }}
        filters={
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Moderator izohi (preview)</div>
              <Input value="Har bir amal uchun izoh dialog orqali kiritiladi" readOnly />
            </div>
            <div className="flex items-end justify-end">
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="size-4 mr-1.5" /> Ro'yxatni yangilash
              </Button>
            </div>
          </div>
        }
      />

      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Moderatsiya amali</DialogTitle>
            <DialogDescription>
              {selected ? `#${selected.id} — ${(selected.contentType || "unknown").toUpperCase()} / ${selected.contentTitle || selected.contentId}` : ""}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitAction} className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Amal</Label>
              <Select value={action} onValueChange={(v) => setAction(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                  <SelectItem value="hide">Hide</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Izoh (ixtiyoriy)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Masalan: qoida buzilgan" />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setActionOpen(false)} className="sm:w-32">
                Bekor
              </Button>
              <Button type="submit" disabled={actionLoading} className="sm:w-32">
                {actionLoading && <Loader2 className="size-4 animate-spin mr-2" />}
                Saqlash
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

