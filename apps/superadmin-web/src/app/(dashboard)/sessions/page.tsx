"use client"

import { useEffect, useState, useCallback } from "react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { StatsGrid, StatsCard } from "@/components/stats-card"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  CalendarCheck, Clock, CheckCircle, XCircle, AlertTriangle, Download, Filter, X,
  Eye, DollarSign, Users, TrendingUp,
} from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

interface SessionUser {
  id: number
  email: string | null
  firstName: string | null
  lastName: string | null
  role: string
}

interface SessionPsychologist {
  id: number
  firstName: string
  lastName: string
  specialization: string | null
  hourlyRate: number | null
  avatarUrl?: string | null
  rating?: number | null
  userId?: number
}

interface SessionMeeting {
  id: number
  title: string
  meetingUrl: string | null
  status: string
  scheduledAt: string
  duration: number
  participants?: { user: SessionUser }[]
}

interface SessionChat {
  id: number
  _count: { messages: number }
}

interface BookingSession {
  id: number
  userId: number
  psychologistId: number
  administratorId: number | null
  scheduledAt: string
  duration: number
  price: number
  status: string
  paymentStatus: string
  meetingId: number | null
  chatId: number | null
  notes: string | null
  cancelReason: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  user: SessionUser
  psychologist: SessionPsychologist
  meeting?: SessionMeeting | null
  chat?: SessionChat | null
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
  REJECTED: "Rad etilgan",
  COMPLETED: "Yakunlangan",
  CANCELLED: "Bekor qilingan",
}

const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "outline",
  ACCEPTED: "default",
  REJECTED: "destructive",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
}

const paymentLabels: Record<string, string> = {
  UNPAID: "To'lanmagan",
  PAID: "To'langan",
  REFUNDED: "Qaytarilgan",
}

const paymentColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  UNPAID: "outline",
  PAID: "default",
  REFUNDED: "destructive",
}

const CHART_COLORS = ["#f59e0b", "#3b82f6", "#ef4444", "#10b981", "#8b5cf6"]

function getUserName(user: { firstName?: string | null; lastName?: string | null; email?: string | null }) {
  if (user.firstName) return `${user.firstName} ${user.lastName || ""}`.trim()
  return user.email || "Noma'lum"
}

function getPsychName(p: { firstName: string; lastName: string }) {
  return `${p.firstName} ${p.lastName}`.trim()
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("uz-UZ")
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("uz-UZ")
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("uz-UZ").format(price) + " so'm"
}

function exportCSV(data: BookingSession[]) {
  const headers = ["ID", "Foydalanuvchi", "Psixolog", "Sana", "Davomiyligi", "Narxi", "Holat", "To'lov holati", "Yaratilgan"]
  const rows = data.map(s => [
    s.id,
    getUserName(s.user),
    getPsychName(s.psychologist),
    formatDateTime(s.scheduledAt),
    `${s.duration} min`,
    s.price,
    statusLabels[s.status] || s.status,
    paymentLabels[s.paymentStatus] || s.paymentStatus,
    formatDate(s.createdAt),
  ])
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n")
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = `seanslar_${new Date().toISOString().split("T")[0]}.csv`
  link.click()
}

export default function SessionsPage() {
  const [data, setData] = useState<BookingSession[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<SessionStats | null>(null)

  const [filterStatus, setFilterStatus] = useState("")
  const [filterPayment, setFilterPayment] = useState("")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetLoading, setSheetLoading] = useState(false)
  const [selectedSession, setSelectedSession] = useState<BookingSession | null>(null)

  const [actionSession, setActionSession] = useState<BookingSession | null>(null)
  const [actionType, setActionType] = useState<"accept" | "reject" | "cancel" | "complete" | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string | number | undefined> = { page, limit: 20 }
      if (search) params.search = search
      if (filterStatus) params.status = filterStatus
      if (filterPayment) params.paymentStatus = filterPayment
      if (filterDateFrom) params.dateFrom = filterDateFrom
      if (filterDateTo) params.dateTo = filterDateTo
      const res = await apiClient<PaginatedResponse<BookingSession>>("/sessions", { params })
      setData(res.data)
      setTotal(res.total)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, search, filterStatus, filterPayment, filterDateFrom, filterDateTo])

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient<SessionStats>("/sessions/stats")
      setStats(res)
    } catch {}
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchStats() }, [fetchStats])

  const openDetail = async (session: BookingSession) => {
    setSheetOpen(true)
    setSheetLoading(true)
    try {
      const detail = await apiClient<BookingSession>(`/sessions/${session.id}`)
      setSelectedSession(detail)
    } catch {} finally {
      setSheetLoading(false)
    }
  }

  const handleAction = async () => {
    if (!actionSession || !actionType) return
    setActionLoading(true)
    try {
      await apiClient(`/sessions/${actionSession.id}/${actionType}`, { method: "PATCH" })
      fetchData()
      fetchStats()
      if (sheetOpen && selectedSession?.id === actionSession.id) {
        const updated = await apiClient<BookingSession>(`/sessions/${actionSession.id}`)
        setSelectedSession(updated)
      }
    } catch (e: any) {
      alert(e.message)
    } finally {
      setActionLoading(false)
      setActionSession(null)
      setActionType(null)
    }
  }

  const clearFilters = () => {
    setFilterStatus("")
    setFilterPayment("")
    setFilterDateFrom("")
    setFilterDateTo("")
    setPage(1)
  }

  const hasFilters = filterStatus || filterPayment || filterDateFrom || filterDateTo

  const statusChartData = stats
    ? [
        { name: "Kutilmoqda", value: stats.pending, color: "#f59e0b" },
        { name: "Qabul qilingan", value: stats.accepted, color: "#3b82f6" },
        { name: "Yakunlangan", value: stats.completed, color: "#10b981" },
        { name: "Bekor qilingan", value: stats.cancelled, color: "#ef4444" },
        { name: "Rad etilgan", value: stats.rejected, color: "#8b5cf6" },
      ].filter(d => d.value > 0)
    : []

  const actionLabels: Record<string, { title: string; description: string; buttonLabel: string }> = {
    accept: {
      title: "Seansni qabul qilish",
      description: "Bu seans qabul qilinadi, video uchrashuv va chat yaratiladi. Davom etasizmi?",
      buttonLabel: "Qabul qilish",
    },
    reject: {
      title: "Seansni rad etish",
      description: "Bu seans rad etiladi. Davom etasizmi?",
      buttonLabel: "Rad etish",
    },
    cancel: {
      title: "Seansni bekor qilish",
      description: "Bu seans bekor qilinadi. Agar to'lov qilingan bo'lsa, pul qaytariladi. Davom etasizmi?",
      buttonLabel: "Bekor qilish",
    },
    complete: {
      title: "Seansni yakunlash",
      description: "Bu seans yakunlangan deb belgilanadi. Davom etasizmi?",
      buttonLabel: "Yakunlash",
    },
  }

  const columns = [
    {
      key: "id" as const,
      header: "ID",
      render: (s: BookingSession) => <span className="font-mono text-xs">#{s.id}</span>,
    },
    {
      key: "user" as const,
      header: "Foydalanuvchi",
      render: (s: BookingSession) => (
        <div>
          <div className="font-medium">{getUserName(s.user)}</div>
          <div className="text-xs text-muted-foreground">{s.user.email}</div>
        </div>
      ),
    },
    {
      key: "psychologist" as const,
      header: "Psixolog",
      render: (s: BookingSession) => (
        <div>
          <div className="font-medium">{getPsychName(s.psychologist)}</div>
          <div className="text-xs text-muted-foreground">{s.psychologist.specialization || "—"}</div>
        </div>
      ),
    },
    {
      key: "scheduledAt" as const,
      header: "Sana",
      render: (s: BookingSession) => (
        <div>
          <div>{formatDate(s.scheduledAt)}</div>
          <div className="text-xs text-muted-foreground">{new Date(s.scheduledAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}</div>
        </div>
      ),
    },
    {
      key: "duration" as const,
      header: "Davomiylik",
      render: (s: BookingSession) => <span>{s.duration} min</span>,
    },
    {
      key: "price" as const,
      header: "Narx",
      render: (s: BookingSession) => <span className="font-medium">{formatPrice(s.price)}</span>,
    },
    {
      key: "status" as const,
      header: "Holat",
      render: (s: BookingSession) => (
        <Badge variant={statusColors[s.status] || "outline"}>
          {statusLabels[s.status] || s.status}
        </Badge>
      ),
    },
    {
      key: "paymentStatus" as const,
      header: "To'lov",
      render: (s: BookingSession) => (
        <Badge variant={paymentColors[s.paymentStatus] || "outline"}>
          {paymentLabels[s.paymentStatus] || s.paymentStatus}
        </Badge>
      ),
    },
    {
      key: "actions" as const,
      header: "",
      render: (s: BookingSession) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => openDetail(s)}>
            <Eye className="h-4 w-4" />
          </Button>
          {s.status === "PENDING" && (
            <>
              <Button variant="ghost" size="icon" className="text-green-600" onClick={() => { setActionSession(s); setActionType("accept") }}>
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-red-600" onClick={() => { setActionSession(s); setActionType("reject") }}>
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
          {s.status === "ACCEPTED" && (
            <>
              <Button variant="ghost" size="icon" className="text-green-600" onClick={() => { setActionSession(s); setActionType("complete") }}>
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-red-600" onClick={() => { setActionSession(s); setActionType("cancel") }}>
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
          {s.status === "PENDING" && (
            <Button variant="ghost" size="icon" className="text-orange-600" onClick={() => { setActionSession(s); setActionType("cancel") }}>
              <AlertTriangle className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Seanslar"
        description="Bron qilingan seanslarni boshqarish"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCSV(data)}>
              <Download className="mr-2 h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="mr-2 h-4 w-4" /> Filtr
              {hasFilters && <span className="ml-1 rounded-full bg-primary text-primary-foreground px-1.5 text-xs">!</span>}
            </Button>
          </div>
        }
      />

      {stats && (
        <>
          <StatsGrid>
            <StatsCard title="Jami seanslar" value={stats.total} icon={CalendarCheck}
              trend={stats.monthSessions > 0 ? { value: stats.monthSessions, label: "bu oy" } : undefined} />
            <StatsCard title="Kutilmoqda" value={stats.pending} icon={Clock} />
            <StatsCard title="Qabul qilingan" value={stats.accepted} icon={Users} />
            <StatsCard title="Yakunlangan" value={stats.completed} icon={CheckCircle} />
            <StatsCard title="Bugungi" value={stats.todaySessions} icon={TrendingUp} />
            <StatsCard title="Umumiy daromad" value={formatPrice(stats.totalRevenue)} icon={DollarSign} />
          </StatsGrid>

          {statusChartData.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Holat bo'yicha taqsimot</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {statusChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="w-40">
                <label className="text-sm font-medium mb-1 block">Holat</label>
                <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v === "all" ? "" : v); setPage(1) }}>
                  <SelectTrigger><SelectValue placeholder="Barchasi" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    <SelectItem value="PENDING">Kutilmoqda</SelectItem>
                    <SelectItem value="ACCEPTED">Qabul qilingan</SelectItem>
                    <SelectItem value="COMPLETED">Yakunlangan</SelectItem>
                    <SelectItem value="CANCELLED">Bekor qilingan</SelectItem>
                    <SelectItem value="REJECTED">Rad etilgan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40">
                <label className="text-sm font-medium mb-1 block">To'lov holati</label>
                <Select value={filterPayment} onValueChange={(v) => { setFilterPayment(v === "all" ? "" : v); setPage(1) }}>
                  <SelectTrigger><SelectValue placeholder="Barchasi" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    <SelectItem value="UNPAID">To'lanmagan</SelectItem>
                    <SelectItem value="PAID">To'langan</SelectItem>
                    <SelectItem value="REFUNDED">Qaytarilgan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40">
                <label className="text-sm font-medium mb-1 block">Boshlanish</label>
                <Input type="date" value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1) }} />
              </div>
              <div className="w-40">
                <label className="text-sm font-medium mb-1 block">Tugash</label>
                <Input type="date" value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); setPage(1) }} />
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-1 h-4 w-4" /> Tozalash
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={20}
        loading={loading}
        error={error}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onPageChange={setPage}
        searchPlaceholder="Qidirish..."
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Seans #{selectedSession?.id}</SheetTitle>
            <SheetDescription>Seans tafsilotlari</SheetDescription>
          </SheetHeader>
          {sheetLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : selectedSession && (
            <div className="space-y-6 mt-4">
              <div className="flex gap-2">
                <Badge variant={statusColors[selectedSession.status] || "outline"}>
                  {statusLabels[selectedSession.status] || selectedSession.status}
                </Badge>
                <Badge variant={paymentColors[selectedSession.paymentStatus] || "outline"}>
                  {paymentLabels[selectedSession.paymentStatus] || selectedSession.paymentStatus}
                </Badge>
              </div>

              <Card>
                <CardHeader><CardTitle className="text-sm">Foydalanuvchi</CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div><span className="text-muted-foreground">Ism:</span> {getUserName(selectedSession.user)}</div>
                  <div><span className="text-muted-foreground">Email:</span> {selectedSession.user.email || "—"}</div>
                  <div><span className="text-muted-foreground">Rol:</span> {selectedSession.user.role}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">Psixolog</CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div><span className="text-muted-foreground">Ism:</span> {getPsychName(selectedSession.psychologist)}</div>
                  <div><span className="text-muted-foreground">Mutaxassislik:</span> {selectedSession.psychologist.specialization || "—"}</div>
                  <div><span className="text-muted-foreground">Soatlik narx:</span> {selectedSession.psychologist.hourlyRate ? formatPrice(selectedSession.psychologist.hourlyRate) : "—"}</div>
                  {selectedSession.psychologist.rating && (
                    <div><span className="text-muted-foreground">Reyting:</span> {selectedSession.psychologist.rating.toFixed(1)}</div>
                  )}
                </CardContent>
              </Card>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Sana</div>
                  <div className="font-medium">{formatDateTime(selectedSession.scheduledAt)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Davomiylik</div>
                  <div className="font-medium">{selectedSession.duration} daqiqa</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Narx</div>
                  <div className="font-medium">{formatPrice(selectedSession.price)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Yaratilgan</div>
                  <div className="font-medium">{formatDateTime(selectedSession.createdAt)}</div>
                </div>
                {selectedSession.completedAt && (
                  <div>
                    <div className="text-muted-foreground">Yakunlangan</div>
                    <div className="font-medium">{formatDateTime(selectedSession.completedAt)}</div>
                  </div>
                )}
              </div>

              {selectedSession.notes && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Izoh</div>
                  <div className="text-sm bg-muted p-3 rounded">{selectedSession.notes}</div>
                </div>
              )}

              {selectedSession.cancelReason && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Bekor qilish sababi</div>
                  <div className="text-sm bg-destructive/10 p-3 rounded text-destructive">{selectedSession.cancelReason}</div>
                </div>
              )}

              {selectedSession.meeting && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Video uchrashuv</CardTitle></CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div><span className="text-muted-foreground">Holat:</span> {selectedSession.meeting.status}</div>
                    {selectedSession.meeting.meetingUrl && (
                      <div><span className="text-muted-foreground">Havola:</span> <a href={selectedSession.meeting.meetingUrl} target="_blank" className="text-blue-600 underline">{selectedSession.meeting.meetingUrl}</a></div>
                    )}
                    {selectedSession.meeting.participants && selectedSession.meeting.participants.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Ishtirokchilar:</span>
                        <ul className="mt-1 space-y-0.5">
                          {selectedSession.meeting.participants.map((p, i) => (
                            <li key={i} className="text-xs">{getUserName(p.user)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {selectedSession.chat && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Chat</CardTitle></CardHeader>
                  <CardContent className="text-sm">
                    <div><span className="text-muted-foreground">Xabarlar soni:</span> {selectedSession.chat._count.messages}</div>
                  </CardContent>
                </Card>
              )}

              <Separator />

              <div className="flex gap-2">
                {selectedSession.status === "PENDING" && (
                  <>
                    <Button className="flex-1" onClick={() => { setActionSession(selectedSession); setActionType("accept") }}>
                      <CheckCircle className="mr-2 h-4 w-4" /> Qabul qilish
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => { setActionSession(selectedSession); setActionType("reject") }}>
                      <XCircle className="mr-2 h-4 w-4" /> Rad etish
                    </Button>
                  </>
                )}
                {selectedSession.status === "ACCEPTED" && (
                  <>
                    <Button className="flex-1" onClick={() => { setActionSession(selectedSession); setActionType("complete") }}>
                      <CheckCircle className="mr-2 h-4 w-4" /> Yakunlash
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => { setActionSession(selectedSession); setActionType("cancel") }}>
                      <XCircle className="mr-2 h-4 w-4" /> Bekor qilish
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!actionType && !!actionSession} onOpenChange={(open) => { if (!open) { setActionType(null); setActionSession(null) } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{actionType ? actionLabels[actionType]?.title : ""}</AlertDialogTitle>
            <AlertDialogDescription>{actionType ? actionLabels[actionType]?.description : ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={actionLoading}>
              {actionLoading ? "Yuklanmoqda..." : actionType ? actionLabels[actionType]?.buttonLabel : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
