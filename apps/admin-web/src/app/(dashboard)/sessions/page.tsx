"use client"

import { useEffect, useState, useCallback } from "react"
import { CalendarCheck, Clock, CheckCircle, XCircle, DollarSign, Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/page-header"
import { StatsCard, StatsGrid } from "@/components/stats-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

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
  total: number; pending: number; accepted: number; completed: number; cancelled: number; rejected: number
  todaySessions: number; monthSessions: number; paidCount: number; totalRevenue: number
}

const statusLabels: Record<string, string> = {
  PENDING: "Kutilmoqda", ACCEPTED: "Qabul qilingan", COMPLETED: "Yakunlangan",
  CANCELLED: "Bekor qilingan", REJECTED: "Rad etilgan",
}

const paymentLabels: Record<string, string> = {
  UNPAID: "To'lanmagan", PAID: "To'langan", REFUNDED: "Qaytarilgan",
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary", ACCEPTED: "default", COMPLETED: "default",
  CANCELLED: "destructive", REJECTED: "destructive",
}

export default function SessionsPage() {
  const { user } = useAuth()
  const centerId = user?.administrator?.centerId
  const [data, setData] = useState<Session[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterPayment, setFilterPayment] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<SessionStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [selected, setSelected] = useState<Session | null>(null)
  const [actionDialog, setActionDialog] = useState<{ action: string; id: number } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params: Record<string, any> = { page, limit: 20, search }
      if (filterStatus) params.status = filterStatus
      if (filterPayment) params.paymentStatus = filterPayment
      if (centerId) params.centerId = centerId
      const res = await apiClient<PaginatedResponse<Session>>("/sessions", { params })
      setData(res.data); setTotal(res.total)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [centerId, page, search, filterStatus, filterPayment])

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const params: Record<string, any> = {}
      if (centerId) params.centerId = centerId
      const res = await apiClient<SessionStats>("/sessions/stats", { params })
      setStats(res)
    } catch {
      setStats({ total: 0, pending: 0, accepted: 0, completed: 0, cancelled: 0, rejected: 0, todaySessions: 0, monthSessions: 0, paidCount: 0, totalRevenue: 0 })
    } finally {
      setStatsLoading(false)
    }
  }, [centerId])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchStats() }, [fetchStats])

  const handleAction = async () => {
    if (!actionDialog) return
    setActionLoading(true)
    try {
      await apiClient(`/sessions/${actionDialog.id}/${actionDialog.action}`, { method: "PATCH" })
      toast.success("Muvaffaqiyatli", {
        description: `Seans ${actionDialog.action === "accept" ? "qabul qilindi" : actionDialog.action === "complete" ? "yakunlandi" : actionDialog.action === "cancel" ? "bekor qilindi" : "rad etildi"}`,
      })
      setActionDialog(null)
      setSelected(null)
      fetchData()
      fetchStats()
    } catch (e: any) {
      toast.error("Xatolik", { description: e.message })
    } finally {
      setActionLoading(false)
    }
  }

  const actionLabels: Record<string, string> = {
    accept: "Qabul qilish", reject: "Rad etish", cancel: "Bekor qilish", complete: "Yakunlash",
  }

  const columns = [
    {
      key: "client", title: "Mijoz",
      render: (s: Session) => (
        <button onClick={() => setSelected(s)} className="text-left hover:underline">
          <span className="font-medium">
            {s.user.firstName ? `${s.user.firstName} ${s.user.lastName || ""}`.trim() : s.user.email || `#${s.user.id}`}
          </span>
          <div className="text-xs text-muted-foreground">{s.psychologist.firstName} {s.psychologist.lastName}</div>
        </button>
      ),
    },
    {
      key: "scheduledAt", title: "Sana",
      render: (s: Session) => (
        <div>
          <p className="text-sm">{new Date(s.scheduledAt).toLocaleDateString("uz-UZ")}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {new Date(s.scheduledAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      ),
    },
    { key: "duration", title: "Davomiyligi", render: (s: Session) => `${s.duration} daq` },
    { key: "price", title: "Narx", render: (s: Session) => s.price ? `${s.price.toLocaleString()} UZS` : "—" },
    {
      key: "status", title: "Holat",
      render: (s: Session) => <Badge variant={statusColors[s.status] || "secondary"}>{statusLabels[s.status] || s.status}</Badge>,
    },
    {
      key: "paymentStatus", title: "To'lov",
      render: (s: Session) => (
        <Badge variant={s.paymentStatus === "PAID" ? "default" : "outline"}>
          {paymentLabels[s.paymentStatus] || s.paymentStatus}
        </Badge>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Seanslar"
        description="Konsultatsiya seanslarini boshqarish"
        icon={CalendarCheck}
      />

      {statsLoading ? (
        <StatsGrid columns={4}>
          {Array.from({ length: 4 }).map((_, i) => (
            <StatsCard key={i} title="" value="" icon={CalendarCheck} loading />
          ))}
        </StatsGrid>
      ) : stats ? (
        <StatsGrid columns={4}>
          <StatsCard title="Jami seanslar" value={stats.total} icon={CalendarCheck} iconColor="bg-sky-500/10 text-sky-600" />
          <StatsCard title="Kutilayotgan" value={stats.pending} icon={Clock} iconColor="bg-yellow-500/10 text-yellow-600" />
          <StatsCard title="Yakunlangan" value={stats.completed} icon={CheckCircle} iconColor="bg-green-500/10 text-green-600" />
          <StatsCard title="Daromad" value={`${(stats.totalRevenue || 0).toLocaleString()} UZS`} icon={DollarSign} iconColor="bg-emerald-500/10 text-emerald-600" />
        </StatsGrid>
      ) : null}

      <div className="mt-6">
        <DataTable
          columns={columns} data={data} total={total} page={page} limit={20}
          loading={loading} error={error} searchPlaceholder="Seans qidirish..."
          onPageChange={setPage} onSearch={setSearch}
          filters={
            <div className="flex gap-2 flex-wrap">
              <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v === "all" ? "" : v); setPage(1) }}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Holat" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="PENDING">Kutilmoqda</SelectItem>
                  <SelectItem value="ACCEPTED">Qabul qilingan</SelectItem>
                  <SelectItem value="COMPLETED">Yakunlangan</SelectItem>
                  <SelectItem value="CANCELLED">Bekor qilingan</SelectItem>
                  <SelectItem value="REJECTED">Rad etilgan</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPayment} onValueChange={(v) => { setFilterPayment(v === "all" ? "" : v); setPage(1) }}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="To'lov" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="UNPAID">To'lanmagan</SelectItem>
                  <SelectItem value="PAID">To'langan</SelectItem>
                  <SelectItem value="REFUNDED">Qaytarilgan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Seans #{selected?.id}</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Mijoz</p>
                  <p className="font-medium">
                    {selected.user.firstName ? `${selected.user.firstName} ${selected.user.lastName || ""}`.trim() : selected.user.email}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Psixolog</p>
                  <p className="font-medium">{selected.psychologist.firstName} {selected.psychologist.lastName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sana</p>
                  <p className="font-medium">{new Date(selected.scheduledAt).toLocaleDateString("uz-UZ")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Vaqt</p>
                  <p className="font-medium">{new Date(selected.scheduledAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Davomiyligi</p>
                  <p className="font-medium">{selected.duration} daqiqa</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Narx</p>
                  <p className="font-medium">{selected.price ? `${selected.price.toLocaleString()} UZS` : "—"}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant={statusColors[selected.status] || "secondary"}>{statusLabels[selected.status]}</Badge>
                <Badge variant={selected.paymentStatus === "PAID" ? "default" : "outline"}>{paymentLabels[selected.paymentStatus]}</Badge>
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
              <div className="flex gap-2 flex-wrap">
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tasdiqlash</AlertDialogTitle>
            <AlertDialogDescription>
              Seansni {actionDialog ? actionLabels[actionDialog.action] : ""}moqchimisiz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={actionLoading}>
              {actionLoading && <Loader2 className="size-4 mr-2 animate-spin" />}
              Tasdiqlash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
