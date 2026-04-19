"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import {
  CalendarCheck, Clock, CheckCircle, DollarSign, Loader2, History, RefreshCw,
  CalendarDays,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useSuperadminCenter } from "@/hooks/use-superadmin-center"
import { SuperadminCenterSelect } from "@/components/superadmin-center-select"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/page-header"
import { StatsCard, StatsGrid } from "@/components/stats-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import type { FilterField } from "@/components/filter-bar"
import { classifyApiError, describeEmbeddedApiError, formatEmbeddedApiError } from "@/lib/api-error"
import { AccessDeniedPlaceholder } from "@/components/access-denied-placeholder"

interface Session {
  id: number
  scheduledAt: string
  duration: number
  price: number
  status: string
  paymentStatus: string
  notes: string | null
  cancelReason: string | null
  createdAt: string
  user: { id: number; firstName: string | null; lastName: string | null; email: string | null }
  psychologist: { id: number; firstName: string; lastName: string; specialization: string | null }
}

interface SessionStats {
  total: number
  pending: number
  accepted: number
  completed: number
  cancelled: number
  rejected: number
  todaySessions: number
  monthSessions: number
  paidCount: number
  totalRevenue: number
}

const statusLabels: Record<string, string> = {
  PENDING: "Kutilmoqda",
  ACCEPTED: "Qabul qilingan",
  COMPLETED: "Yakunlangan",
  CANCELLED: "Bekor qilingan",
  REJECTED: "Rad etilgan",
}

const paymentLabels: Record<string, string> = {
  UNPAID: "To'lanmagan",
  PAID: "To'langan",
  REFUNDED: "Qaytarilgan",
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  ACCEPTED: "default",
  COMPLETED: "default",
  CANCELLED: "destructive",
  REJECTED: "destructive",
}

type Mode = "default" | "history"

export function SessionsList({ mode }: { mode: Mode }) {
  const searchParams = useSearchParams()
  const historyView = mode === "history" || searchParams.get("view") === "history"
  const { user } = useAuth()
  const centerCtx = useSuperadminCenter(user)
  const centerId = centerCtx.effectiveCenterId

  const [data, setData] = useState<Session[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState(() => (mode === "history" ? "COMPLETED" : ""))
  const [filterPayment, setFilterPayment] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [stats, setStats] = useState<SessionStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsPermissionDenied, setStatsPermissionDenied] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Session | null>(null)
  const [actionDialog, setActionDialog] = useState<{ action: string; id: number } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get("view") === "history") {
      setFilterStatus("COMPLETED")
    }
  }, [searchParams])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    setPermissionDenied(false)
    try {
      const params: Record<string, string | number | undefined> = {
        page,
        limit: 20,
        search: search || undefined,
      }
      if (filterStatus) params.status = filterStatus
      if (filterPayment) params.paymentStatus = filterPayment
      if (centerId) params.centerId = centerId
      if (dateFrom) params.dateFrom = dateFrom
      if (dateTo) params.dateTo = dateTo

      const res = await apiClient<PaginatedResponse<Session>>("/sessions", { params })
      setData(res.data)
      setTotal(res.total)
    } catch (e: unknown) {
      const { permissionDenied: denied } = classifyApiError(e)
      setError(formatEmbeddedApiError(e))
      setPermissionDenied(denied)
    } finally {
      setLoading(false)
    }
  }, [centerId, page, search, filterStatus, filterPayment, dateFrom, dateTo])

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    setStatsError(null)
    setStatsPermissionDenied(false)
    try {
      const params: Record<string, number> = {}
      if (centerId) params.centerId = centerId
      const res = await apiClient<SessionStats>("/sessions/stats", { params })
      setStats(res)
    } catch (e: unknown) {
      setStats(null)
      const { permissionDenied: denied } = classifyApiError(e)
      if (denied) {
        setStatsPermissionDenied(true)
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

  const handleAction = async () => {
    if (!actionDialog) return
    setActionLoading(true)
    try {
      const params: Record<string, number> = {}
      if (centerId) params.centerId = centerId
      await apiClient(`/sessions/${actionDialog.id}/${actionDialog.action}`, {
        method: "PATCH",
        params: Object.keys(params).length ? params : undefined,
      })
      toast.success("Amal bajarildi", {
        description:
          actionDialog.action === "accept"
            ? "Seans qabul qilindi"
            : actionDialog.action === "complete"
              ? "Seans yakunlandi"
              : actionDialog.action === "cancel"
                ? "Seans bekor qilindi"
                : "Rad etildi",
      })
      setActionDialog(null)
      setSelected(null)
      fetchData()
      fetchStats()
    } catch (e: unknown) {
      const d = describeEmbeddedApiError(e)
      toast.error(d.title, { description: d.description })
    } finally {
      setActionLoading(false)
    }
  }

  const actionLabels: Record<string, string> = {
    accept: "Qabul qilish",
    reject: "Rad etish",
    cancel: "Bekor qilish",
    complete: "Yakunlash",
  }

  const pageTitle = historyView ? "Seanslar tarixi" : "Seanslar"
  const pageDesc = historyView
    ? "Yakunlangan va o'tgan konsultatsiya yozuvlari (booking_sessions)"
    : "Bron qilingan konsultatsiya seanslari — real baza bo'yicha"

  const statusFilterFields: FilterField[] = useMemo(
    () => [
      {
        id: "status",
        placeholder: "Holat",
        options: [
          { value: "PENDING", label: "Kutilmoqda" },
          { value: "ACCEPTED", label: "Qabul qilingan" },
          { value: "COMPLETED", label: "Yakunlangan" },
          { value: "CANCELLED", label: "Bekor" },
          { value: "REJECTED", label: "Rad" },
        ],
      },
      {
        id: "payment",
        placeholder: "To'lov",
        options: [
          { value: "UNPAID", label: "To'lanmagan" },
          { value: "PAID", label: "To'langan" },
          { value: "REFUNDED", label: "Qaytarilgan" },
        ],
      },
    ],
    [],
  )

  const columns = [
    {
      key: "client",
      title: "Mijoz / Psixolog",
      render: (s: Session) => (
        <button type="button" onClick={() => setSelected(s)} className="text-left hover:underline">
          <span className="font-medium">
            {s.user.firstName
              ? `${s.user.firstName} ${s.user.lastName || ""}`.trim()
              : s.user.email || `#${s.user.id}`}
          </span>
          <div className="text-xs text-muted-foreground">
            {s.psychologist.firstName} {s.psychologist.lastName}
          </div>
        </button>
      ),
    },
    {
      key: "scheduledAt",
      title: "Vaqt",
      render: (s: Session) => (
        <div>
          <p className="text-sm">{new Date(s.scheduledAt).toLocaleDateString("uz-UZ")}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {new Date(s.scheduledAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      ),
    },
    { key: "duration", title: "Daq", render: (s: Session) => `${s.duration} daq` },
    {
      key: "price",
      title: "Narx",
      render: (s: Session) => (s.price ? `${s.price.toLocaleString()} so'm` : "—"),
    },
    {
      key: "status",
      title: "Holat",
      render: (s: Session) => (
        <Badge variant={statusColors[s.status] || "secondary"}>{statusLabels[s.status] || s.status}</Badge>
      ),
    },
    {
      key: "paymentStatus",
      title: "To'lov",
      render: (s: Session) => (
        <Badge variant={s.paymentStatus === "PAID" ? "default" : "outline"}>
          {paymentLabels[s.paymentStatus] || s.paymentStatus}
        </Badge>
      ),
    },
  ]

  if (permissionDenied) {
    return (
      <div className="space-y-6 pb-8">
        <PageHeader
          title={pageTitle}
          description={pageDesc}
          icon={historyView ? History : CalendarCheck}
          badge={historyView ? "Tarix" : undefined}
        />
        <AccessDeniedPlaceholder
          title="Seanslarga ruxsat yo'q"
          description="Seanslar ro'yxati va boshqaruv odatda sessions.read / sessions.manage yoki tegishli ruxsatlarni talab qiladi."
          detail={error}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title={pageTitle}
        description={pageDesc}
        icon={historyView ? History : CalendarCheck}
        badge={historyView ? "Tarix" : undefined}
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
            <Button variant="outline" size="sm" onClick={() => { fetchData(); fetchStats() }}>
              <RefreshCw className="mr-2 size-4" />
              Yangilash
            </Button>
          </div>
        }
      />

      {centerCtx.isSuperadmin && centerId == null && (
        <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Barcha markazlar</span> — ro&apos;yxat filtrlash uchun yuqoridan markazni tanlang (tanlanmasa, barcha markazlar bo&apos;yicha seanslar ko&apos;rinadi).
        </div>
      )}

      {statsLoading ? (
        <StatsGrid columns={4}>
          {Array.from({ length: 4 }).map((_, i) => (
            <StatsCard key={i} title="" value="" icon={CalendarCheck} loading />
          ))}
        </StatsGrid>
      ) : statsPermissionDenied ? (
        <AccessDeniedPlaceholder
          title="Seans statistikalariga ruxsat yo'q"
          description="Asosiy ro'yxat ochilishi mumkin; yuqoridagi yig'ma ko'rsatkichlar uchun alohida ruxsat talab qilinishi mumkin."
        />
      ) : statsError ? (
        <p className="text-sm text-destructive">{statsError}</p>
      ) : stats ? (
        <StatsGrid columns={4}>
          <StatsCard
            title="Jami"
            value={stats.total}
            icon={CalendarCheck}
            iconColor="bg-sky-500/10 text-sky-600"
            description={`Shu oy: ${stats.monthSessions}`}
          />
          <StatsCard title="Kutilayotgan" value={stats.pending} icon={Clock} iconColor="bg-amber-500/10 text-amber-600" />
          <StatsCard title="Yakunlangan" value={stats.completed} icon={CheckCircle} iconColor="bg-emerald-500/10 text-emerald-600" />
          <StatsCard
            title="To'langan tushum"
            value={`${(stats.totalRevenue || 0).toLocaleString()} so'm`}
            icon={DollarSign}
            iconColor="bg-violet-500/10 text-violet-600"
          />
        </StatsGrid>
      ) : null}

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={20}
        loading={loading}
        error={error}
        searchPlaceholder="Mijoz yoki psixolog bo'yicha qidirish..."
        onPageChange={setPage}
        onSearchChange={(q) => {
          setSearch(q)
          setPage(1)
        }}
        filterFields={statusFilterFields}
        activeFilters={{
          status: filterStatus ? filterStatus : "all",
          payment: filterPayment ? filterPayment : "all",
        }}
        onFilterChange={(id, value) => {
          if (id === "status") {
            setFilterStatus(value === "all" ? "" : value)
          }
          if (id === "payment") {
            setFilterPayment(value === "all" ? "" : value)
          }
          setPage(1)
        }}
        onResetFilters={() => {
          setFilterStatus(historyView ? "COMPLETED" : "")
          setFilterPayment("")
          setDateFrom("")
          setDateTo("")
          setSearch("")
          setPage(1)
        }}
        filters={
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Boshlanish sanasi</div>
              <div className="relative">
                <CalendarDays className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-8"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Tugash sanasi</div>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <div className="flex items-end md:col-span-2">
              <p className="text-xs text-muted-foreground">
                Ma&apos;lumotlar <span className="font-medium text-foreground">booking_sessions</span> jadvalidan keladi.
              </p>
            </div>
          </div>
        }
      />

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-md border-l bg-background/95 backdrop-blur">
          <SheetHeader>
            <SheetTitle>Seans #{selected?.id}</SheetTitle>
            <SheetDescription>Bron va to&apos;lov holati</SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Mijoz</p>
                  <p className="font-medium">
                    {selected.user.firstName
                      ? `${selected.user.firstName} ${selected.user.lastName || ""}`.trim()
                      : selected.user.email}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Psixolog</p>
                  <p className="font-medium">
                    {selected.psychologist.firstName} {selected.psychologist.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Sana</p>
                  <p className="font-medium">{new Date(selected.scheduledAt).toLocaleDateString("uz-UZ")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Vaqt</p>
                  <p className="font-medium">
                    {new Date(selected.scheduledAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Davomiyligi</p>
                  <p className="font-medium">{selected.duration} daqiqa</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Narx</p>
                  <p className="font-medium">{selected.price ? `${selected.price.toLocaleString()} so'm` : "—"}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={statusColors[selected.status] || "secondary"}>{statusLabels[selected.status]}</Badge>
                <Badge variant={selected.paymentStatus === "PAID" ? "default" : "outline"}>
                  {paymentLabels[selected.paymentStatus]}
                </Badge>
              </div>
              {selected.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Eslatmalar</p>
                    <p className="text-sm">{selected.notes}</p>
                  </div>
                </>
              )}
              {selected.cancelReason && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bekor qilish sababi</p>
                  <p className="text-sm text-red-600">{selected.cancelReason}</p>
                </div>
              )}
              <Separator />
              <div className="flex flex-wrap gap-2">
                {selected.status === "PENDING" && (
                  <>
                    <Button size="sm" onClick={() => setActionDialog({ action: "accept", id: selected.id })}>
                      Qabul qilish
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setActionDialog({ action: "reject", id: selected.id })}>
                      Rad etish
                    </Button>
                  </>
                )}
                {selected.status === "ACCEPTED" && (
                  <>
                    <Button size="sm" onClick={() => setActionDialog({ action: "complete", id: selected.id })}>
                      Yakunlash
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setActionDialog({ action: "cancel", id: selected.id })}>
                      Bekor qilish
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!actionDialog} onOpenChange={(open) => !open && setActionDialog(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Tasdiqlash</AlertDialogTitle>
            <AlertDialogDescription>
              Seansni {actionDialog ? actionLabels[actionDialog.action] : ""}ni tasdiqlaysizmi?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Bekor</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={actionLoading}>
              {actionLoading && <Loader2 className="size-4 mr-2 animate-spin" />}
              Tasdiqlash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
