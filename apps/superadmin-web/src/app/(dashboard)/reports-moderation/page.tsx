"use client"

import { useEffect, useState, useCallback } from "react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { safeDevError } from "@/lib/safe-log"
import { PageHeader } from "@/components/page-header"
import { StatsCard, StatsGrid } from "@/components/stats-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Flag, CheckCircle2, Search, MoreHorizontal,
  Eye, ChevronLeft, ChevronRight, Loader2, RefreshCw,
  Calendar, Clock, Inbox, ShieldAlert,
} from "lucide-react"

interface Report {
  id: number
  type: string
  targetType: string
  targetId: number
  summary: string
  details: string | null
  severity: string
  status: string
  createdByUserId: number
  assignedToUserId: number | null
  resolutionNote: string | null
  resolvedAt: string | null
  createdAt: string
  createdBy?: { id: number; email: string | null; firstName: string | null; lastName: string | null }
  assignedTo?: { id: number; firstName: string | null; lastName: string | null } | null
}

interface Stats { total: number; new: number; inReview: number; resolved: number; critical: number }

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  NEW: { label: "Yangi", variant: "destructive" },
  IN_REVIEW: { label: "Ko'rib chiqilmoqda", variant: "default" },
  RESOLVED: { label: "Hal qilindi", variant: "secondary" },
  DISMISSED: { label: "Bekor qilindi", variant: "outline" },
}

const severityMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  LOW: { label: "Past", variant: "outline" },
  MEDIUM: { label: "O'rta", variant: "secondary" },
  HIGH: { label: "Yuqori", variant: "default" },
  CRITICAL: { label: "Kritik", variant: "destructive" },
}

export default function ReportsModerationPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [selected, setSelected] = useState<Report | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [resolveOpen, setResolveOpen] = useState(false)
  const [resolutionNote, setResolutionNote] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const limit = 20

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number | undefined> = { page, limit }
      if (search) params.search = search
      if (statusFilter !== "all") params.status = statusFilter
      if (severityFilter !== "all") params.severity = severityFilter
      const [listRes, statsRes] = await Promise.all([
        apiClient<PaginatedResponse<Report>>("/moderation-reports", { params }),
        apiClient<Stats>("/moderation-reports/stats"),
      ])
      setReports(listRes.data)
      setTotal(listRes.total)
      setStats(statsRes)
    } catch (e) {
      safeDevError("reports-moderation/fetch", e)
    }
    setLoading(false)
  }, [page, search, statusFilter, severityFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleViewDetail = async (r: Report) => {
    try {
      const detail = await apiClient<Report>(`/moderation-reports/${r.id}`)
      setSelected(detail)
    } catch { setSelected(r) }
    setSheetOpen(true)
  }

  const handleResolve = async () => {
    if (!selected) return
    setActionLoading(true)
    try {
      await apiClient(`/moderation-reports/${selected.id}/resolve`, { method: "PATCH", body: { resolutionNote } })
      setResolveOpen(false)
      setResolutionNote("")
      setSheetOpen(false)
      fetchData()
    } catch (e) {
      safeDevError("reports-moderation/resolve", e)
    }
    setActionLoading(false)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <PageHeader title="Reportlar" description="Moderatsiya hisobotlarini ko'rish va boshqarish" />

      {stats && (
        <StatsGrid columns={4}>
          <StatsCard title="Jami" value={stats.total} icon={Flag} />
          <StatsCard title="Yangi" value={stats.new} icon={Inbox} />
          <StatsCard title="Ko'rib chiqilmoqda" value={stats.inReview} icon={Clock} />
          <StatsCard title="Kritik" value={stats.critical} icon={ShieldAlert} />
        </StatsGrid>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Qidirish..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Holat" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha holatlar</SelectItem>
                <SelectItem value="NEW">Yangi</SelectItem>
                <SelectItem value="IN_REVIEW">Ko'rib chiqilmoqda</SelectItem>
                <SelectItem value="RESOLVED">Hal qilindi</SelectItem>
                <SelectItem value="DISMISSED">Bekor qilindi</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Jiddiylik" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha</SelectItem>
                <SelectItem value="LOW">Past</SelectItem>
                <SelectItem value="MEDIUM">O'rta</SelectItem>
                <SelectItem value="HIGH">Yuqori</SelectItem>
                <SelectItem value="CRITICAL">Kritik</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Reportlar topilmadi</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Turi</TableHead>
                    <TableHead>Maqsad</TableHead>
                    <TableHead>Xulosa</TableHead>
                    <TableHead>Jiddiylik</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Tayinlangan</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((r) => (
                    <TableRow key={r.id} className="cursor-pointer" onClick={() => handleViewDetail(r)}>
                      <TableCell className="font-medium capitalize">{r.type}</TableCell>
                      <TableCell className="text-sm">{r.targetType} #{r.targetId}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{r.summary}</TableCell>
                      <TableCell>
                        <Badge variant={severityMap[r.severity]?.variant}>{severityMap[r.severity]?.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusMap[r.status]?.variant}>{statusMap[r.status]?.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.assignedTo ? `${r.assignedTo.firstName || ""} ${r.assignedTo.lastName || ""}`.trim() : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("uz-UZ")}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewDetail(r) }}>
                              <Eye className="mr-2 h-4 w-4" />Ko'rish
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelected(r); setResolveOpen(true) }}>
                              <CheckCircle2 className="mr-2 h-4 w-4" />Hal qilish
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">Jami: {total}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="text-sm py-1 px-2">{page} / {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Hisobot tafsilotlari</SheetTitle>
            <SheetDescription>ID: {selected?.id}</SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="space-y-6 mt-6">
              <div className="flex gap-2">
                <Badge variant={statusMap[selected.status]?.variant}>{statusMap[selected.status]?.label}</Badge>
                <Badge variant={severityMap[selected.severity]?.variant}>{severityMap[selected.severity]?.label}</Badge>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Turi</Label>
                <p className="font-medium capitalize">{selected.type}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Xulosa</Label>
                <p className="text-sm">{selected.summary}</p>
              </div>
              {selected.details && (
                <div>
                  <Label className="text-muted-foreground text-xs">Tafsilotlar</Label>
                  <p className="text-sm whitespace-pre-wrap">{selected.details}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Maqsad turi</Label>
                  <p className="text-sm">{selected.targetType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Maqsad ID</Label>
                  <p className="text-sm">#{selected.targetId}</p>
                </div>
              </div>
              {selected.createdBy && (
                <div>
                  <Label className="text-muted-foreground text-xs">Yaratuvchi</Label>
                  <p className="text-sm">{selected.createdBy.firstName} {selected.createdBy.lastName}</p>
                </div>
              )}
              {selected.resolutionNote && (
                <div>
                  <Label className="text-muted-foreground text-xs">Yechim izohi</Label>
                  <p className="text-sm">{selected.resolutionNote}</p>
                </div>
              )}
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(selected.createdAt).toLocaleDateString("uz-UZ")}</span>
              </div>
              {(selected.status === "NEW" || selected.status === "IN_REVIEW") && (
                <Button size="sm" onClick={() => setResolveOpen(true)}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />Hal qilish
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hisobotni hal qilish</AlertDialogTitle>
            <AlertDialogDescription>Bu hisobotni hal qilingan deb belgilaysizmi?</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label>Yechim izohi</Label>
            <Textarea value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)} placeholder="Yechim haqida izoh..." />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResolutionNote("")}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleResolve} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Hal qilish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
