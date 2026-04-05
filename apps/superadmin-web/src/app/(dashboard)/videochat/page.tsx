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
import { Video, Calendar, Play, CheckCircle, XCircle, Clock, Download, Filter, X, Eye, Users } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

interface VideoSession {
  id: number
  title: string
  description: string | null
  type: string
  status: string
  hostId: number
  scheduledAt: string
  duration: number
  meetingUrl: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  host: {
    id: number
    email: string | null
    firstName: string | null
    lastName: string | null
    role: string
  }
  _count?: { participants: number }
  participants?: Array<{
    id: number
    userId: number
    status: string
    user: {
      id: number
      email: string | null
      firstName: string | null
      lastName: string | null
    }
  }>
}

interface VideoStats {
  totalSessions: number
  scheduledSessions: number
  activeSessions: number
  completedSessions: number
}

const statusLabels: Record<string, string> = {
  SCHEDULED: "Rejalashtirilgan",
  IN_PROGRESS: "Davom etmoqda",
  COMPLETED: "Yakunlangan",
  CANCELLED: "Bekor qilingan",
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  SCHEDULED: "outline",
  IN_PROGRESS: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
}

const typeLabels: Record<string, string> = {
  CONSULTATION: "Konsultatsiya",
  THERAPY: "Terapiya",
  GROUP_SESSION: "Guruh seansi",
  TRAINING: "Trening",
  OTHER: "Boshqa",
}

function getUserName(user: { firstName?: string | null; lastName?: string | null; email?: string | null }) {
  if (user.firstName) return `${user.firstName} ${user.lastName || ""}`.trim()
  return user.email || "Noma'lum"
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("uz-UZ")
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("uz-UZ")
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} daqiqa`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h} soat ${m} daqiqa` : `${h} soat`
}

function exportCSV(data: VideoSession[]) {
  const headers = ["ID", "Sarlavha", "Turi", "Holat", "Boshlovchi", "Sana", "Davomiylik (daq)", "Ishtirokchilar"]
  const rows = data.map(s => [
    s.id,
    s.title,
    typeLabels[s.type] || s.type,
    statusLabels[s.status] || s.status,
    getUserName(s.host),
    formatDateTime(s.scheduledAt),
    s.duration,
    s._count?.participants || 0,
  ])
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n")
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = `video_seanslar_${new Date().toISOString().split("T")[0]}.csv`
  link.click()
}

export default function VideochatPage() {
  const [data, setData] = useState<VideoSession[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<VideoStats | null>(null)

  const [filterStatus, setFilterStatus] = useState("")
  const [filterType, setFilterType] = useState("")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetLoading, setSheetLoading] = useState(false)
  const [selectedSession, setSelectedSession] = useState<VideoSession | null>(null)

  const [actionSession, setActionSession] = useState<{ session: VideoSession; action: string } | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string | number | undefined> = { page, limit: 20 }
      if (search) params.search = search
      if (filterStatus) params.status = filterStatus
      if (filterType) params.type = filterType
      if (filterDateFrom) params.dateFrom = filterDateFrom
      if (filterDateTo) params.dateTo = filterDateTo
      const res = await apiClient<PaginatedResponse<VideoSession>>("/video/sessions", { params })
      setData(res.data)
      setTotal(res.total)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, search, filterStatus, filterType, filterDateFrom, filterDateTo])

  const fetchStats = useCallback(async () => {
    try {
      const s = await apiClient<VideoStats>("/video/stats")
      setStats(s)
    } catch {}
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchStats() }, [fetchStats])

  const openDetail = async (session: VideoSession) => {
    setSheetOpen(true)
    setSheetLoading(true)
    try {
      const detail = await apiClient<VideoSession>(`/video/sessions/${session.id}`)
      setSelectedSession(detail)
    } catch {
      setSelectedSession(session)
    } finally {
      setSheetLoading(false)
    }
  }

  const handleAction = async () => {
    if (!actionSession) return
    const { session, action } = actionSession
    try {
      await apiClient(`/video/${session.id}/${action}`, { method: "PATCH" })
      fetchData()
      fetchStats()
      if (sheetOpen && selectedSession?.id === session.id) {
        const detail = await apiClient<VideoSession>(`/video/sessions/${session.id}`)
        setSelectedSession(detail)
      }
    } catch {}
    setActionSession(null)
  }

  const clearFilters = () => {
    setFilterStatus("")
    setFilterType("")
    setFilterDateFrom("")
    setFilterDateTo("")
    setPage(1)
  }

  const hasFilters = filterStatus || filterType || filterDateFrom || filterDateTo

  const getActionLabel = (action: string) => {
    switch (action) {
      case "start": return "Boshlash"
      case "end": return "Yakunlash"
      case "cancel": return "Bekor qilish"
      default: return action
    }
  }

  const getActionDescription = (action: string) => {
    switch (action) {
      case "start": return "Bu video seansni boshlamoqchimisiz?"
      case "end": return "Bu video seansni yakunlamoqchimisiz?"
      case "cancel": return "Bu video seansni bekor qilmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
      default: return ""
    }
  }

  const columns = [
    {
      key: "title",
      title: "Sarlavha",
      render: (s: VideoSession) => (
        <div>
          <p className="font-medium">{s.title}</p>
          <p className="text-xs text-muted-foreground">{typeLabels[s.type] || s.type}</p>
        </div>
      ),
    },
    {
      key: "host",
      title: "Boshlovchi",
      render: (s: VideoSession) => getUserName(s.host),
    },
    {
      key: "scheduledAt",
      title: "Sana",
      render: (s: VideoSession) => (
        <div>
          <p className="text-sm">{formatDate(s.scheduledAt)}</p>
          <p className="text-xs text-muted-foreground">{new Date(s.scheduledAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      ),
    },
    {
      key: "duration",
      title: "Davomiylik",
      render: (s: VideoSession) => formatDuration(s.duration),
    },
    {
      key: "participants",
      title: "Ishtirokchilar",
      render: (s: VideoSession) => <span className="font-medium">{s._count?.participants || 0}</span>,
    },
    {
      key: "status",
      title: "Holat",
      render: (s: VideoSession) => (
        <Badge variant={statusColors[s.status] || "secondary"}>
          {statusLabels[s.status] || s.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      title: "",
      render: (s: VideoSession) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => openDetail(s)}>
            <Eye className="size-4" />
          </Button>
          {s.status === "SCHEDULED" && (
            <Button variant="ghost" size="sm" onClick={() => setActionSession({ session: s, action: "start" })}>
              <Play className="size-4 text-emerald-600" />
            </Button>
          )}
          {s.status === "IN_PROGRESS" && (
            <Button variant="ghost" size="sm" onClick={() => setActionSession({ session: s, action: "end" })}>
              <CheckCircle className="size-4 text-blue-600" />
            </Button>
          )}
          {(s.status === "SCHEDULED" || s.status === "IN_PROGRESS") && (
            <Button variant="ghost" size="sm" onClick={() => setActionSession({ session: s, action: "cancel" })}>
              <XCircle className="size-4 text-red-600" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Video seanslar"
        description="Video qo'ng'iroqlar va konsultatsiyalarni boshqarish"
        icon={Video}
        actions={[
          { label: "CSV yuklash", icon: Download, variant: "outline" as const, onClick: () => exportCSV(data) },
          { label: showFilters ? "Filtrni yopish" : "Filtr", icon: showFilters ? X : Filter, variant: "outline" as const, onClick: () => setShowFilters(!showFilters) },
        ]}
      />

      {stats && (
        <StatsGrid columns={4}>
          <StatsCard title="Jami seanslar" value={stats.totalSessions} icon={Video} iconColor="bg-blue-500/10 text-blue-600" />
          <StatsCard title="Rejalashtirilgan" value={stats.scheduledSessions} icon={Calendar} iconColor="bg-violet-500/10 text-violet-600" />
          <StatsCard title="Faol seanslar" value={stats.activeSessions} icon={Play} iconColor="bg-emerald-500/10 text-emerald-600" />
          <StatsCard title="Yakunlangan" value={stats.completedSessions} icon={CheckCircle} iconColor="bg-amber-500/10 text-amber-600" />
        </StatsGrid>
      )}

      {stats && stats.totalSessions > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Seanslar holati taqsimoti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Rejalashtirilgan", value: stats.scheduledSessions },
                      { name: "Davom etmoqda", value: stats.activeSessions },
                      { name: "Yakunlangan", value: stats.completedSessions },
                      { name: "Bekor qilingan", value: Math.max(0, stats.totalSessions - stats.scheduledSessions - stats.activeSessions - stats.completedSessions) },
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {[
                      "hsl(262, 83%, 58%)",
                      "hsl(142, 76%, 36%)",
                      "hsl(38, 92%, 50%)",
                      "hsl(0, 84%, 60%)",
                    ].map((color, i) => (
                      <Cell key={i} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [value, name]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Holat</label>
                <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v === "all" ? "" : v); setPage(1) }}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Barchasi" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Turi</label>
                <Select value={filterType} onValueChange={(v) => { setFilterType(v === "all" ? "" : v); setPage(1) }}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Barchasi" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Boshlanish sanasi</label>
                <Input type="date" value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1) }} className="w-[160px]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Tugash sanasi</label>
                <Input type="date" value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); setPage(1) }} className="w-[160px]" />
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="size-4 mr-1" /> Tozalash
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable
        title=""
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={20}
        loading={loading}
        error={error}
        searchPlaceholder="Video seans qidirish..."
        onPageChange={setPage}
        onSearch={(s) => { setSearch(s); setPage(1) }}
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Video seans tafsilotlari</SheetTitle>
            <SheetDescription>Seans #{selectedSession?.id} haqida ma'lumot</SheetDescription>
          </SheetHeader>
          {sheetLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full size-8 border-b-2 border-primary" />
            </div>
          ) : selectedSession && (
            <div className="space-y-6 mt-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Asosiy ma'lumot</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-muted-foreground">ID</p><p className="font-medium">#{selectedSession.id}</p></div>
                  <div><p className="text-xs text-muted-foreground">Holat</p><Badge variant={statusColors[selectedSession.status] || "secondary"}>{statusLabels[selectedSession.status] || selectedSession.status}</Badge></div>
                  <div className="col-span-2"><p className="text-xs text-muted-foreground">Sarlavha</p><p className="font-medium">{selectedSession.title}</p></div>
                  <div><p className="text-xs text-muted-foreground">Turi</p><p className="font-medium">{typeLabels[selectedSession.type] || selectedSession.type}</p></div>
                  <div><p className="text-xs text-muted-foreground">Davomiylik</p><p className="font-medium">{formatDuration(selectedSession.duration)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Rejalashtirilgan sana</p><p className="font-medium">{formatDateTime(selectedSession.scheduledAt)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Yaratilgan</p><p className="font-medium">{formatDateTime(selectedSession.createdAt)}</p></div>
                </div>
              </div>

              {selectedSession.description && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tavsif</h3>
                    <p className="text-sm">{selectedSession.description}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Boshlovchi</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-muted-foreground">Ism</p><p className="font-medium">{getUserName(selectedSession.host)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{selectedSession.host.email || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Rol</p><Badge variant="outline">{selectedSession.host.role}</Badge></div>
                </div>
              </div>

              {selectedSession.participants && selectedSession.participants.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Ishtirokchilar ({selectedSession.participants.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedSession.participants.map((p) => (
                        <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="text-sm font-medium">{getUserName(p.user)}</p>
                            <p className="text-xs text-muted-foreground">{p.user.email}</p>
                          </div>
                          <Badge variant="outline">{p.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {selectedSession.meetingUrl && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Havola</h3>
                    <p className="text-sm break-all text-blue-600">{selectedSession.meetingUrl}</p>
                  </div>
                </>
              )}

              {selectedSession.notes && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Eslatmalar</h3>
                    <p className="text-sm">{selectedSession.notes}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex gap-2">
                {selectedSession.status === "SCHEDULED" && (
                  <Button
                    className="flex-1"
                    onClick={() => setActionSession({ session: selectedSession, action: "start" })}
                  >
                    <Play className="size-4 mr-2" /> Boshlash
                  </Button>
                )}
                {selectedSession.status === "IN_PROGRESS" && (
                  <Button
                    className="flex-1"
                    onClick={() => setActionSession({ session: selectedSession, action: "end" })}
                  >
                    <CheckCircle className="size-4 mr-2" /> Yakunlash
                  </Button>
                )}
                {(selectedSession.status === "SCHEDULED" || selectedSession.status === "IN_PROGRESS") && (
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setActionSession({ session: selectedSession, action: "cancel" })}
                  >
                    <XCircle className="size-4 mr-2" /> Bekor qilish
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!actionSession} onOpenChange={() => setActionSession(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Video seansni {actionSession ? getActionLabel(actionSession.action).toLowerCase() : ""}</AlertDialogTitle>
            <AlertDialogDescription>
              {actionSession ? getActionDescription(actionSession.action) : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>
              {actionSession ? getActionLabel(actionSession.action) : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
