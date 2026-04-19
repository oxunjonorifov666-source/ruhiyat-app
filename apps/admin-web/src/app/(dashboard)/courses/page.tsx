"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/components/auth-provider"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/page-header"
import { StatsCard, StatsGrid } from "@/components/stats-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  BookOpen,
  Plus,
  MoreHorizontal,
  Edit,
  Archive,
  Eye,
  Loader2,
  PlayCircle,
  FileText,
  FolderArchive,
  BarChart2,
} from "lucide-react"
import { toast } from "sonner"
import {
  describeEmbeddedApiError,
  formatEmbeddedApiError,
  isPermissionDeniedError,
  type EmbeddedApiErrorDescription,
} from "@/lib/api-error"
import { EmbeddedApiErrorBanner } from "@/components/embedded-api-error-banner"
import { AccessDeniedPlaceholder } from "@/components/access-denied-placeholder"
import { useSuperadminCenter } from "@/hooks/use-superadmin-center"
import { SuperadminCenterRequiredScreen, SuperadminCenterSelect } from "@/components/superadmin-center-select"
import { withCenterQuery } from "@/lib/endpoints"

// ─── Types ─────────────────────────────────────────────────────────────────

type CourseStatus = "DRAFT" | "ACTIVE" | "ARCHIVED"

interface Course {
  id: number
  centerId: number
  name: string
  code: string | null
  description: string | null
  status: CourseStatus
  durationWeeks: number | null
  createdAt: string
  updatedAt: string
  _count?: { groups: number; enrollments: number }
}

interface CourseStats {
  total: number
  active: number
  draft: number
  archived: number
}

interface CourseForm {
  name: string
  code: string
  description: string
  status: CourseStatus
  durationWeeks: string
}

const DEFAULT_FORM: CourseForm = {
  name: "",
  code: "",
  description: "",
  status: "DRAFT",
  durationWeeks: "",
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  CourseStatus,
  { label: string; variant: "default" | "secondary" | "outline"; className: string }
> = {
  ACTIVE: {
    label: "Faol",
    variant: "default",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  DRAFT: {
    label: "Qoralama",
    variant: "outline",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  ARCHIVED: {
    label: "Arxivlangan",
    variant: "secondary",
    className: "bg-slate-100 text-slate-600",
  },
}

function StatusBadge({ status }: { status: CourseStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <Badge variant={cfg.variant} className={`text-[10px] h-5 ${cfg.className}`}>
      {cfg.label}
    </Badge>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CoursesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const centerCtx = useSuperadminCenter(user)
  const centerId = centerCtx.effectiveCenterId

  // List state
  const [data, setData] = useState<Course[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  // Stats state
  const [stats, setStats] = useState<CourseStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsAccessDenied, setStatsAccessDenied] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selected, setSelected] = useState<Course | null>(null)
  const [saving, setSaving] = useState(false)
  const [sheetApiError, setSheetApiError] = useState<EmbeddedApiErrorDescription | null>(null)
  const [form, setForm] = useState<CourseForm>(DEFAULT_FORM)

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!centerId) return
    setLoading(true)
    setError(null)
    setPermissionDenied(false)
    try {
      const res = await apiClient<PaginatedResponse<Course>>("/courses", {
        params: {
          centerId,
          page,
          limit: 15,
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
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
  }, [centerId, page, search, statusFilter])

  const fetchStats = useCallback(async () => {
    if (!centerId) return
    setStatsLoading(true)
    setStatsAccessDenied(false)
    setStatsError(null)
    try {
      const res = await apiClient<CourseStats>(`/courses/stats?centerId=${centerId}`)
      setStats(res)
    } catch (e: unknown) {
      setStats(null)
      if (isPermissionDeniedError(e)) {
        setStatsAccessDenied(true)
      } else {
        setStatsError(formatEmbeddedApiError(e))
      }
    } finally {
      setStatsLoading(false)
    }
  }, [centerId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // ── Form helpers ──────────────────────────────────────────────────────────

  const openCreate = () => {
    setSheetApiError(null)
    setSelected(null)
    setForm(DEFAULT_FORM)
    setSheetOpen(true)
  }

  const openEdit = (course: Course) => {
    setSheetApiError(null)
    setSelected(course)
    setForm({
      name: course.name,
      code: course.code ?? "",
      description: course.description ?? "",
      status: course.status,
      durationWeeks: course.durationWeeks?.toString() ?? "",
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
        code: form.code || undefined,
        description: form.description || undefined,
        status: form.status,
        durationWeeks: form.durationWeeks ? parseInt(form.durationWeeks) : undefined,
        centerId,
      }

      if (selected) {
        await apiClient(`/courses/${selected.id}`, { method: "PATCH", body: payload })
        toast.success("Kurs yangilandi")
      } else {
        await apiClient("/courses", { method: "POST", body: payload })
        toast.success("Kurs yaratildi")
      }

      setSheetOpen(false)
      fetchData()
      fetchStats()
    } catch (e: unknown) {
      const d = describeEmbeddedApiError(e)
      setSheetApiError(d)
      toast.error(d.title, { description: d.description })
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async (course: Course) => {
    if (!centerId) return
    try {
      await apiClient(`/courses/${course.id}/archive?centerId=${centerId}`, { method: "PATCH" })
      toast.success(`"${course.name}" arxivlandi`)
      fetchData()
      fetchStats()
    } catch (e: unknown) {
      const d = describeEmbeddedApiError(e)
      toast.error(d.title, { description: d.description })
    }
  }

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns = [
    {
      key: "name",
      title: "Kurs nomi",
      render: (c: Course) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{c.name}</span>
          {c.code && (
            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded mt-0.5 w-fit">
              {c.code}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "description",
      title: "Tavsif",
      render: (c: Course) => (
        <span className="text-xs text-muted-foreground line-clamp-2 max-w-[220px]">
          {c.description || "—"}
        </span>
      ),
    },
    {
      key: "status",
      title: "Holat",
      render: (c: Course) => <StatusBadge status={c.status} />,
    },
    {
      key: "durationWeeks",
      title: "Davomiyligi",
      render: (c: Course) =>
        c.durationWeeks ? (
          <span className="text-xs">{c.durationWeeks} hafta</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: "groups",
      title: "Guruhlar",
      render: (c: Course) => (
        <span className="text-xs font-medium">{c._count?.groups ?? 0}</span>
      ),
    },
    {
      key: "enrollments",
      title: "O'quvchilar",
      render: (c: Course) => (
        <span className="text-xs font-medium">{c._count?.enrollments ?? 0}</span>
      ),
    },
    {
      key: "createdAt",
      title: "Yaratilgan",
      render: (c: Course) => (
        <span className="text-[10px] text-muted-foreground font-mono">
          {new Date(c.createdAt).toLocaleDateString("uz-UZ")}
        </span>
      ),
    },
    {
      key: "actions",
      title: "",
      render: (c: Course) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => router.push(withCenterQuery(`/courses/${c.id}`, centerId))}>
                <BarChart2 className="mr-2 size-4" /> Tahlillar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEdit(c)}>
                <Edit className="mr-2 size-4" /> Tahrirlash
              </DropdownMenuItem>
              {c.status !== "ARCHIVED" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-amber-600 focus:text-amber-600"
                    onClick={() => handleArchive(c)}
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
        title="Kurslar"
        description="Markaz bo'yicha ta'lim kurslarini boshqarish"
        icon={BookOpen}
        centers={centerCtx.centers}
        centersLoading={centerCtx.centersLoading}
        setCenterId={centerCtx.setCenterId}
      />
    )
  }

  if (!centerId) {
    return (
      <div className="p-8 text-center text-muted-foreground">Markaz topilmadi</div>
    )
  }

  if (permissionDenied) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Kurslar"
          description="Markaz ta'lim kurslarini boshqarish"
          icon={BookOpen}
        />
        <AccessDeniedPlaceholder
          title="Kurslarni boshqarishga ruxsat yo'q"
          description="Kurslar ro'yxati odatda courses.read / courses.write yoki tegishli ta'lim moduli ruxsatlarini talab qiladi."
          detail={error}
        />
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kurslar"
        description={`${centerCtx.centerDisplayName} — ta'lim kurslari`}
        icon={BookOpen}
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
              Yangi kurs
            </Button>
          </div>
        }
      />

      {/* Stats */}
      {statsAccessDenied ? (
        <AccessDeniedPlaceholder
          title="Kurs statistikalariga ruxsat yo'q"
          description="Asosiy kurslar ro'yxati ochilishi mumkin, lekin yuqoridagi statistikani ko'rish uchun alohida ruxsat talab qilinishi mumkin."
        />
      ) : statsError ? (
        <p className="text-sm text-destructive">{statsError}</p>
      ) : (
        <StatsGrid columns={4}>
          <StatsCard
            title="Jami kurslar"
            value={stats?.total ?? "—"}
            icon={BookOpen}
            loading={statsLoading}
            iconColor="bg-blue-500/10 text-blue-600"
          />
          <StatsCard
            title="Faol kurslar"
            value={stats?.active ?? "—"}
            icon={PlayCircle}
            loading={statsLoading}
            iconColor="bg-emerald-500/10 text-emerald-600"
          />
          <StatsCard
            title="Qolamalar"
            value={stats?.draft ?? "—"}
            icon={FileText}
            loading={statsLoading}
            iconColor="bg-amber-500/10 text-amber-600"
          />
          <StatsCard
            title="Arxivlangan"
            value={stats?.archived ?? "—"}
            icon={FolderArchive}
            loading={statsLoading}
            iconColor="bg-slate-500/10 text-slate-600"
          />
        </StatsGrid>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue placeholder="Holat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha holatlar</SelectItem>
            <SelectItem value="ACTIVE">Faol</SelectItem>
            <SelectItem value="DRAFT">Qoralama</SelectItem>
            <SelectItem value="ARCHIVED">Arxivlangan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
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
        searchPlaceholder="Kurs nomi yoki kodi bo'yicha qidirish..."
      />

      {/* Create / Edit Sheet */}
      <Sheet
        open={sheetOpen}
        onOpenChange={(o) => {
          setSheetOpen(o)
          if (!o) setSheetApiError(null)
        }}
      >
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {selected ? "Kursni tahrirlash" : "Yangi kurs yaratish"}
            </SheetTitle>
            <SheetDescription>
              {selected
                ? "Kurs ma'lumotlarini yangilang."
                : "Yangi ta'lim kursini qo'shing."}
            </SheetDescription>
          </SheetHeader>

          <EmbeddedApiErrorBanner error={sheetApiError} className="mt-4" />

          <form onSubmit={handleSave} className="space-y-5 mt-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Kurs nomi <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Masalan: Python asoslari"
                required
              />
            </div>

            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="code">
                Kurs kodi{" "}
                <span className="text-muted-foreground text-[10px] font-normal">(ixtiyoriy)</span>
              </Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="Masalan: PY-101"
                className="font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                Har bir markaz ichida yagona kod. Faqat harf, raqam, _ yoki -.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Tavsif{" "}
                <span className="text-muted-foreground text-[10px] font-normal">(ixtiyoriy)</span>
              </Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Kurs haqida qisqacha ma'lumot..."
                rows={3}
              />
            </div>

            {/* Status & Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Holat</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as CourseStatus })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Qoralama</SelectItem>
                    <SelectItem value="ACTIVE">Faol</SelectItem>
                    <SelectItem value="ARCHIVED">Arxivlangan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="durationWeeks">Davomiyligi (hafta)</Label>
                <Input
                  id="durationWeeks"
                  type="number"
                  min={1}
                  value={form.durationWeeks}
                  onChange={(e) => setForm({ ...form, durationWeeks: e.target.value })}
                  placeholder="12"
                />
              </div>
            </div>

            <SheetFooter className="mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSheetOpen(false)}
                className="flex-1"
              >
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
