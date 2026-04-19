"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/components/auth-provider"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UsersRound, Plus, MoreHorizontal, Edit, Archive, UserPlus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  describeEmbeddedApiError,
  formatEmbeddedApiError,
  isPermissionDeniedError,
  type EmbeddedApiErrorDescription,
} from "@/lib/api-error"
import { EmbeddedApiErrorBanner } from "@/components/embedded-api-error-banner"
import { AccessDeniedPlaceholder } from "@/components/access-denied-placeholder"
import { useRouter } from "next/navigation"
import { useSuperadminCenter } from "@/hooks/use-superadmin-center"
import { SuperadminCenterRequiredScreen, SuperadminCenterSelect } from "@/components/superadmin-center-select"
import { withCenterQuery } from "@/lib/endpoints"

interface Group {
  id: number
  centerId: number
  courseId: number | null
  name: string
  description: string | null
  maxStudents: number | null
  isActive: boolean
  createdAt: string
  course: { id: number; name: string } | null
  _count?: { enrollments: number }
}

interface GroupForm {
  name: string
  description: string
  courseId: string
  maxStudents: string
  isActive: boolean
}

const DEFAULT_FORM: GroupForm = {
  name: "",
  description: "",
  courseId: "",
  maxStudents: "",
  isActive: true,
}

export default function GroupsPage() {
  const { user } = useAuth()
  const centerCtx = useSuperadminCenter(user)
  const centerId = centerCtx.effectiveCenterId
  const router = useRouter()

  const [data, setData] = useState<Group[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [selected, setSelected] = useState<Group | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<GroupForm>(DEFAULT_FORM)
  const [sheetApiError, setSheetApiError] = useState<EmbeddedApiErrorDescription | null>(null)

  const fetchData = useCallback(async () => {
    if (!centerId) return
    setLoading(true)
    setError(null)
    setPermissionDenied(false)
    try {
      const res = await apiClient<PaginatedResponse<Group>>("/groups", {
        params: { centerId, page, limit: 15, search: search || undefined },
      })
      setData(res.data)
      setTotal(res.total)
    } catch (e: unknown) {
      setError(formatEmbeddedApiError(e))
      setPermissionDenied(isPermissionDeniedError(e))
      if (!isPermissionDeniedError(e)) {
        const d = describeEmbeddedApiError(e)
        toast.error(d.title, { description: d.description })
      }
    } finally {
      setLoading(false)
    }
  }, [centerId, page, search])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openCreate = () => {
    setSheetApiError(null)
    setSelected(null)
    setForm(DEFAULT_FORM)
    setSheetOpen(true)
  }

  const openEdit = (group: Group) => {
    setSheetApiError(null)
    setSelected(group)
    setForm({
      name: group.name,
      description: group.description ?? "",
      courseId: group.courseId?.toString() ?? "",
      maxStudents: group.maxStudents?.toString() ?? "",
      isActive: group.isActive,
    })
    setSheetOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!centerId) return
    setSaving(true)
    setSheetApiError(null)
    try {
      const payload: any = {
        name: form.name,
        description: form.description || undefined,
        courseId: form.courseId ? parseInt(form.courseId) : undefined,
        maxStudents: form.maxStudents ? parseInt(form.maxStudents) : undefined,
        isActive: form.isActive,
        centerId,
      }

      if (selected) {
        await apiClient(`/groups/${selected.id}?centerId=${centerId}`, { method: "PATCH", body: payload })
        toast.success("Guruh yangilandi")
      } else {
        await apiClient("/groups", { method: "POST", body: payload })
        toast.success("Guruh yaratildi")
      }

      setSheetOpen(false)
      fetchData()
    } catch (e: unknown) {
      const d = describeEmbeddedApiError(e)
      setSheetApiError(d)
      toast.error(d.title, { description: d.description })
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async (group: Group) => {
    if (!centerId) return
    if (!confirm(`Haqiqatan ham "${group.name}" guruhini arxivlamoqchimisiz?`)) return
    try {
      await apiClient(`/groups/${group.id}/archive?centerId=${centerId}`, { method: "PATCH" })
      toast.success(`"${group.name}" arxivlandi`)
      fetchData()
    } catch (e: unknown) {
      const d = describeEmbeddedApiError(e)
      toast.error(d.title, { description: d.description })
    }
  }

  const columns = [
    {
      key: "name",
      title: "Guruh nomi",
      render: (g: Group) => <span className="font-medium">{g.name}</span>,
    },
    {
      key: "course",
      title: "Kurs",
      render: (g: Group) => g.course?.name || "—",
    },
    {
      key: "description",
      title: "Tavsif",
      render: (g: Group) => (
        <span className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]">
          {g.description || "—"}
        </span>
      ),
    },
    {
      key: "enrollments",
      title: "O'quvchilar",
      render: (g: Group) => (
        <span className="text-sm">
          {g._count?.enrollments ?? 0} {g.maxStudents ? `/ ${g.maxStudents}` : ""}
        </span>
      ),
    },
    {
      key: "isActive",
      title: "Holat",
      render: (g: Group) => (
        <Badge variant={g.isActive ? "default" : "secondary"}>
          {g.isActive ? "Faol" : "Nofaol"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      title: "Yaratilgan",
      render: (g: Group) => (
        <span className="text-[10px] text-muted-foreground font-mono">
          {new Date(g.createdAt).toLocaleDateString("uz-UZ")}
        </span>
      ),
    },
    {
      key: "actions",
      title: "",
      render: (g: Group) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push(withCenterQuery(`/groups/${g.id}`, centerId))}>
                <UserPlus className="mr-2 size-4" /> Yozilishlar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEdit(g)}>
                <Edit className="mr-2 size-4" /> Tahrirlash
              </DropdownMenuItem>
              {g.isActive && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-amber-600 focus:text-amber-600"
                    onClick={() => handleArchive(g)}
                  >
                    <Archive className="mr-2 size-4" /> Arxivlash
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  if (centerCtx.needsCenterSelection) {
    return (
      <SuperadminCenterRequiredScreen
        title="Guruhlar"
        description="Markaz bo'yicha o'quv guruhlarini boshqarish"
        icon={UsersRound}
        centers={centerCtx.centers}
        centersLoading={centerCtx.centersLoading}
        setCenterId={centerCtx.setCenterId}
      />
    )
  }

  if (!centerId) {
    return <div className="p-8 text-center text-muted-foreground">Markaz topilmadi</div>
  }

  if (permissionDenied) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Guruhlar"
          description="O'quv markazining guruhlarini boshqarish"
          icon={UsersRound}
        />
        <AccessDeniedPlaceholder
          title="Guruhlarni boshqarishga ruxsat yo'q"
          description="Guruhlar ro'yxati odatda groups.read / groups.write yoki tegishli ta'lim moduli ruxsatlarini talab qiladi."
          detail={error}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guruhlar"
        description={`${centerCtx.centerDisplayName} — o'quv guruhlari`}
        icon={UsersRound}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {centerCtx.isSuperadmin && (
              <SuperadminCenterSelect
                centers={centerCtx.centers}
                centersLoading={centerCtx.centersLoading}
                value={centerCtx.effectiveCenterId}
                onChange={centerCtx.setCenterId}
              />
            )}
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 size-4" />
              Yangi guruh
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={15}
        loading={loading}
        error={error}
        onPageChange={setPage}
        onSearchChange={(s) => { setSearch(s); setPage(1) }}
        searchPlaceholder="Guruh qidirish..."
      />

      <Sheet
        open={sheetOpen}
        onOpenChange={(o) => {
          setSheetOpen(o)
          if (!o) setSheetApiError(null)
        }}
      >
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{selected ? "Guruhni tahrirlash" : "Yangi guruh yaratish"}</SheetTitle>
            <SheetDescription>Guruh ma'lumotlarini kiritish va saqlash.</SheetDescription>
          </SheetHeader>

          <EmbeddedApiErrorBanner error={sheetApiError} className="mt-4" />

          <form onSubmit={handleSave} className="space-y-5 mt-6">
            <div className="space-y-2">
              <Label>Guruh nomi <span className="text-destructive">*</span></Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ingliz tili - B1"
              />
            </div>

            <div className="space-y-2">
              <Label>Kurs ID (ixtiyoriy)</Label>
              <Input
                type="number"
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                placeholder="Bog'langan kurs raqami"
              />
            </div>

            <div className="space-y-2">
              <Label>Maksimal o'quvchilar sig'imi (ixtiyoriy)</Label>
              <Input
                type="number"
                min={1}
                value={form.maxStudents}
                onChange={(e) => setForm({ ...form, maxStudents: e.target.value })}
                placeholder="15"
              />
            </div>

            <div className="space-y-2">
              <Label>Tavsif (ixtiyoriy)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Guruh uchun qisqacha tavsif..."
              />
            </div>

            <SheetFooter className="mt-8">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} className="flex-1">
                Bekor qilish
              </Button>
              <Button type="submit" disabled={saving} className="flex-1">
                {saving && <Loader2 className="size-4 animate-spin mr-2" />}
                {selected ? "Yangilash" : "Yaratish"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
