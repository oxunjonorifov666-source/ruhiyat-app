"use client"

import { useEffect, useState, useCallback } from "react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { StatsGrid, StatsCard } from "@/components/stats-card"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  CalendarCheck,
  Clock,
  CheckCircle,
  Download,
  Filter,
  X,
  Eye,
  DollarSign,
  Users,
  TrendingUp,
  History,
} from "lucide-react"
import {
  type BookingSession,
  type SessionStats,
  statusLabels,
  statusColors,
  paymentLabels,
  paymentColors,
  getUserName,
  getPsychName,
  formatDate,
  formatDateTime,
  formatPrice,
  exportSessionsCSV,
} from "@/lib/booking-session-helpers"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

const DEFAULT_HISTORY_STATUS = "COMPLETED"

export default function SessionsHistoryPage() {
  const [data, setData] = useState<BookingSession[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<SessionStats | null>(null)

  const [filterStatus, setFilterStatus] = useState(DEFAULT_HISTORY_STATUS)
  const [filterPayment, setFilterPayment] = useState("")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [showFilters, setShowFilters] = useState(true)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetLoading, setSheetLoading] = useState(false)
  const [selectedSession, setSelectedSession] = useState<BookingSession | null>(null)

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

  const [statsLoading, setStatsLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await apiClient<SessionStats>("/sessions/stats")
      setStats(res)
    } catch {
      setStats({
        total: 0,
        pending: 0,
        accepted: 0,
        completed: 0,
        cancelled: 0,
        rejected: 0,
        todaySessions: 0,
        monthSessions: 0,
        paidCount: 0,
        totalRevenue: 0,
      })
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const openDetail = async (session: BookingSession) => {
    setSheetOpen(true)
    setSheetLoading(true)
    try {
      const detail = await apiClient<BookingSession>(`/sessions/${session.id}`)
      setSelectedSession(detail)
    } catch {
      /* ignore */
    } finally {
      setSheetLoading(false)
    }
  }

  const clearFilters = () => {
    setFilterStatus(DEFAULT_HISTORY_STATUS)
    setFilterPayment("")
    setFilterDateFrom("")
    setFilterDateTo("")
    setPage(1)
  }

  const hasFilters =
    filterStatus !== DEFAULT_HISTORY_STATUS || filterPayment || filterDateFrom || filterDateTo

  const statusChartData = stats
    ? [
        { name: "Kutilmoqda", value: stats.pending, color: "#f59e0b" },
        { name: "Qabul qilingan", value: stats.accepted, color: "#3b82f6" },
        { name: "Yakunlangan", value: stats.completed, color: "#10b981" },
        { name: "Bekor qilingan", value: stats.cancelled, color: "#ef4444" },
        { name: "Rad etilgan", value: stats.rejected, color: "#8b5cf6" },
      ].filter((d) => d.value > 0)
    : []

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
          <div className="text-xs text-muted-foreground">
            {new Date(s.scheduledAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
          </div>
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
        <Badge variant={statusColors[s.status] || "outline"}>{statusLabels[s.status] || s.status}</Badge>
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
        <Button variant="ghost" size="icon" onClick={() => openDetail(s)} aria-label="Tafsilotlar">
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Seanslar tarixi"
        description="Yakunlangan va o'tgan seanslar arxivi — bazadan to'g'ridan-to'g'ri"
        icon={History}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportSessionsCSV(data, "seanslar_tarixi")}>
              <Download className="mr-2 h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="mr-2 h-4 w-4" /> Filtr
              {hasFilters && (
                <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">!</span>
              )}
            </Button>
          </div>
        }
      />

      {statsLoading ? (
        <StatsGrid columns={3}>
          {Array.from({ length: 6 }).map((_, i) => (
            <StatsCard key={i} title="" value="" icon={CalendarCheck} loading />
          ))}
        </StatsGrid>
      ) : stats ? (
        <>
          <StatsGrid columns={3}>
            <StatsCard
              title="Jami seanslar"
              value={stats.total}
              icon={CalendarCheck}
              iconColor="bg-sky-500/10 text-sky-600"
              trend={stats.monthSessions > 0 ? { value: stats.monthSessions, label: "bu oy" } : undefined}
            />
            <StatsCard title="Kutilmoqda" value={stats.pending} icon={Clock} iconColor="bg-orange-500/10 text-orange-600" />
            <StatsCard title="Qabul qilingan" value={stats.accepted} icon={Users} iconColor="bg-blue-500/10 text-blue-600" />
            <StatsCard
              title="Yakunlangan"
              value={stats.completed}
              icon={CheckCircle}
              iconColor="bg-green-500/10 text-green-600"
            />
            <StatsCard title="Bugungi" value={stats.todaySessions} icon={TrendingUp} iconColor="bg-violet-500/10 text-violet-600" />
            <StatsCard
              title="Umumiy daromad"
              value={formatPrice(stats.totalRevenue)}
              icon={DollarSign}
              iconColor="bg-emerald-500/10 text-emerald-600"
            />
          </StatsGrid>

          {statusChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Holat bo'yicha taqsimot</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        dataKey="value"
                        paddingAngle={2}
                        animationBegin={0}
                        animationDuration={800}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {statusChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid hsl(var(--border))",
                          backgroundColor: "hsl(var(--card))",
                          color: "hsl(var(--card-foreground))",
                          fontSize: "12px",
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}

      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="w-44 min-w-[10rem]">
                <label className="mb-1 block text-sm font-medium">Holat</label>
                <Select
                  value={filterStatus || "all"}
                  onValueChange={(v) => {
                    setFilterStatus(v === "all" ? "" : v)
                    setPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Holat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMPLETED">Yakunlangan</SelectItem>
                    <SelectItem value="CANCELLED">Bekor qilingan</SelectItem>
                    <SelectItem value="REJECTED">Rad etilgan</SelectItem>
                    <SelectItem value="PENDING">Kutilmoqda</SelectItem>
                    <SelectItem value="ACCEPTED">Qabul qilingan</SelectItem>
                    <SelectItem value="all">Barcha holatlar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-44 min-w-[10rem]">
                <label className="mb-1 block text-sm font-medium">To'lov holati</label>
                <Select value={filterPayment} onValueChange={(v) => { setFilterPayment(v === "all" ? "" : v); setPage(1) }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Barchasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    <SelectItem value="UNPAID">To'lanmagan</SelectItem>
                    <SelectItem value="PAID">To'langan</SelectItem>
                    <SelectItem value="REFUNDED">Qaytarilgan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40 min-w-[9rem]">
                <label className="mb-1 block text-sm font-medium">Boshlanish</label>
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => {
                    setFilterDateFrom(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
              <div className="w-40 min-w-[9rem]">
                <label className="mb-1 block text-sm font-medium">Tugash</label>
                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => {
                    setFilterDateTo(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-1 h-4 w-4" /> Standartga qaytarish
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
        onSearchChange={(v) => {
          setSearch(v)
          setPage(1)
        }}
        onPageChange={setPage}
        searchPlaceholder="Foydalanuvchi yoki psixolog bo'yicha qidirish..."
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Seans #{selectedSession?.id}</SheetTitle>
            <SheetDescription>Tarixiy yozuv (faqat ko'rish)</SheetDescription>
          </SheetHeader>
          {sheetLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : (
            selectedSession && (
              <div className="mt-4 space-y-6">
                <div className="flex gap-2">
                  <Badge variant={statusColors[selectedSession.status] || "outline"}>
                    {statusLabels[selectedSession.status] || selectedSession.status}
                  </Badge>
                  <Badge variant={paymentColors[selectedSession.paymentStatus] || "outline"}>
                    {paymentLabels[selectedSession.paymentStatus] || selectedSession.paymentStatus}
                  </Badge>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Foydalanuvchi</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">Ism:</span> {getUserName(selectedSession.user)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span> {selectedSession.user.email || "—"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rol:</span> {selectedSession.user.role}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Psixolog</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">Ism:</span> {getPsychName(selectedSession.psychologist)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mutaxassislik:</span>{" "}
                      {selectedSession.psychologist.specialization || "—"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Soatlik narx:</span>{" "}
                      {selectedSession.psychologist.hourlyRate ? formatPrice(selectedSession.psychologist.hourlyRate) : "—"}
                    </div>
                    {selectedSession.psychologist.rating && (
                      <div>
                        <span className="text-muted-foreground">Reyting:</span> {selectedSession.psychologist.rating.toFixed(1)}
                      </div>
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
                    <div className="mb-1 text-sm text-muted-foreground">Izoh</div>
                    <div className="rounded bg-muted p-3 text-sm">{selectedSession.notes}</div>
                  </div>
                )}

                {selectedSession.cancelReason && (
                  <div>
                    <div className="mb-1 text-sm text-muted-foreground">Bekor qilish sababi</div>
                    <div className="rounded bg-destructive/10 p-3 text-sm text-destructive">{selectedSession.cancelReason}</div>
                  </div>
                )}

                {selectedSession.meeting && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Video uchrashuv</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      <div>
                        <span className="text-muted-foreground">Holat:</span> {selectedSession.meeting.status}
                      </div>
                      {selectedSession.meeting.meetingUrl && (
                        <div>
                          <span className="text-muted-foreground">Havola:</span>{" "}
                          <a href={selectedSession.meeting.meetingUrl} target="_blank" className="text-blue-600 underline" rel="noreferrer">
                            {selectedSession.meeting.meetingUrl}
                          </a>
                        </div>
                      )}
                      {selectedSession.meeting.participants && selectedSession.meeting.participants.length > 0 && (
                        <div>
                          <span className="text-muted-foreground">Ishtirokchilar:</span>
                          <ul className="mt-1 space-y-0.5">
                            {selectedSession.meeting.participants.map((p, i) => (
                              <li key={i} className="text-xs">
                                {getUserName(p.user)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {selectedSession.chat && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Chat</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <div>
                        <span className="text-muted-foreground">Xabarlar soni:</span> {selectedSession.chat._count.messages}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
