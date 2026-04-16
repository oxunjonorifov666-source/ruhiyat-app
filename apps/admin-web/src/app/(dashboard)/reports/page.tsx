"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { apiClient, type PaginatedResponse } from "@/lib/api-client"
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
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
  Flag, CheckCircle2, Search, MoreHorizontal, Eye, ChevronLeft, ChevronRight,
  Loader2, RefreshCw, Calendar, Clock, Inbox, ShieldAlert, UserRound,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-provider"
import { useDebounce } from "@/hooks/use-debounce"
import type { AuthUser } from "@/lib/auth"

interface ModerationReport {
  id: number
  type: string
  targetType: string
  targetId: number
  summary: string
  details: string | null
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string
  status: "NEW" | "IN_REVIEW" | "RESOLVED" | "DISMISSED" | string
  createdByUserId: number
  assignedToUserId: number | null
  resolutionNote: string | null
  resolvedAt: string | null
  centerId?: number | null
  createdAt: string
  createdBy?: { id: number; email: string | null; firstName: string | null; lastName: string | null }
  assignedTo?: { id: number; firstName: string | null; lastName: string | null } | null
  center?: { id: number; name: string } | null
}

interface Stats {
  total: number
  new: number
  inReview: number
  resolved: number
  critical: number
}

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

function resolveParamsForReport(user: AuthUser | null, report: ModerationReport | null): Record<string, number> | undefined {
  if (!user || !report) return undefined
  if (user.role === "SUPERADMIN") {
    const cid = report.center?.id ?? report.centerId
    if (cid != null && cid !== undefined) return { centerId: cid }
    return undefined
  }
  return undefined
}

export default function ReportsPage() {
  const { user } = useAuth()
  const [reports, setReports] = useState<ModerationReport[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch = useDebounce(searchInput, 400)
  const [statusFilter, setStatusFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selected, setSelected] = useState<ModerationReport | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [resolveOpen, setResolveOpen] = useState(false)
  const [resolutionNote, setResolutionNote] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const limit = 20

  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number | undefined> = { page, limit }
      if (debouncedSearch) params.search = debouncedSearch
      if (statusFilter !== "all") params.status = statusFilter
      if (severityFilter !== "all") params.severity = severityFilter
      if (typeFilter !== "all") params.type = typeFilter

      const [listRes, statsRes] = await Promise.all([
        apiClient<PaginatedResponse<ModerationReport>>("/moderation-reports", { params }),
        apiClient<Stats>("/moderation-reports/stats"),
      ])

      setReports(listRes.data)
      setTotal(listRes.total)
      setStats(statsRes)
    } catch (e: any) {
      toast.error(e?.message || "Hisobotlarni yuklab bo'lmadi")
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, statusFilter, severityFilter, typeFilter])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => { setPage(1) }, [debouncedSearch, statusFilter, severityFilter, typeFilter])

  const handleViewDetail = useCallback(async (r: ModerationReport) => {
    try {
      const detailParams = resolveParamsForReport(user, r)
      const detail = await apiClient<ModerationReport>(`/moderation-reports/${r.id}`, {
        params: detailParams,
      })
      setSelected(detail)
    } catch {
      setSelected(r)
    }
    setSheetOpen(true)
  }, [user])

  const handleResolve = useCallback(async () => {
    if (!selected) return
    setActionLoading(true)
    try {
      const resolveParams = resolveParamsForReport(user, selected)
      await apiClient(`/moderation-reports/${selected.id}/resolve`, {
        method: "PATCH",
        params: resolveParams,
        body: { resolutionNote: resolutionNote || undefined },
      })
      toast.success("Hisobot hal qilindi")
      setResolveOpen(false)
      setResolutionNote("")
      setSheetOpen(false)
      fetchData()
    } catch (e: any) {
      toast.error(e?.message || "Amal bajarilmadi")
    } finally {
      setActionLoading(false)
    }
  }, [selected, resolutionNote, fetchData, user])

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Hisobotlar"
        description="Foydalanuvchilar tomonidan yuborilgan reportlar (moderation_reports) — real baza, markaz bo‘yicha filtr"
        actions={[
          { label: "Yangilash", icon: RefreshCw, variant: "outline", onClick: fetchData },
        ]}
      />

      <StatsGrid columns={5}>
        <StatsCard title="Jami" value={stats?.total ?? "—"} icon={Flag} loading={!stats && loading} />
        <StatsCard title="Yangi" value={stats?.new ?? "—"} icon={Inbox} loading={!stats && loading} />
        <StatsCard title="Ko'rib chiqilmoqda" value={stats?.inReview ?? "—"} icon={Clock} loading={!stats && loading} />
        <StatsCard title="Hal qilingan" value={stats?.resolved ?? "—"} icon={CheckCircle2} loading={!stats && loading} />
        <StatsCard title="Kritik" value={stats?.critical ?? "—"} icon={ShieldAlert} loading={!stats && loading} />
      </StatsGrid>

      <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Qidirish (xulosa yoki tafsilot)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Holat" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha holatlar</SelectItem>
                  <SelectItem value="NEW">Yangi</SelectItem>
                  <SelectItem value="IN_REVIEW">Ko'rib chiqilmoqda</SelectItem>
                  <SelectItem value="RESOLVED">Hal qilindi</SelectItem>
                  <SelectItem value="DISMISSED">Bekor qilindi</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Jiddiylik" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="LOW">Past</SelectItem>
                  <SelectItem value="MEDIUM">O'rta</SelectItem>
                  <SelectItem value="HIGH">Yuqori</SelectItem>
                  <SelectItem value="CRITICAL">Kritik</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Report turi" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha turlar</SelectItem>
                  <SelectItem value="spam">spam</SelectItem>
                  <SelectItem value="abuse">abuse</SelectItem>
                  <SelectItem value="inappropriate">inappropriate</SelectItem>
                  <SelectItem value="copyright">copyright</SelectItem>
                  <SelectItem value="other">other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-14 text-muted-foreground rounded-xl border border-dashed">
              <Flag className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="font-medium">Hozircha reportlar yo‘q</p>
              <p className="text-sm mt-1 max-w-md mx-auto">Mobil yoki boshqa kanallardan kelgan foydalanuvchi reportlari shu yerda ko‘rinadi.</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Turi</TableHead>
                      <TableHead>Maqsad</TableHead>
                      <TableHead className="max-w-[200px]">Xulosa</TableHead>
                      <TableHead>Report qilgan</TableHead>
                      <TableHead>Jiddiylik</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead>Markaz</TableHead>
                      <TableHead>Sana</TableHead>
                      <TableHead className="w-[52px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((r) => (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer"
                        onClick={() => handleViewDetail(r)}
                      >
                        <TableCell className="font-medium capitalize">{r.type}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{r.targetType} #{r.targetId}</TableCell>
                        <TableCell className="max-w-[220px] truncate text-sm">{r.summary}</TableCell>
                        <TableCell className="text-sm">
                          <span className="inline-flex items-center gap-1.5">
                            <UserRound className="size-3.5 text-muted-foreground shrink-0" />
                            {r.createdBy
                              ? `${r.createdBy.firstName || ""} ${r.createdBy.lastName || ""}`.trim() || r.createdBy.email || `#${r.createdBy.id}`
                              : `#${r.createdByUserId}`}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={severityMap[r.severity]?.variant || "outline"}>
                            {severityMap[r.severity]?.label || r.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusMap[r.status]?.variant || "outline"}>
                            {statusMap[r.status]?.label || r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[140px] truncate">
                          {r.center?.name || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(r.createdAt).toLocaleDateString("uz-UZ")}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewDetail(r) }}>
                                <Eye className="mr-2 h-4 w-4" />Ko'rish
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelected(r)
                                  setResolveOpen(true)
                                }}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />Hal qilish
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-2">
                  <p className="text-sm text-muted-foreground">Jami: <span className="font-medium text-foreground">{total}</span></p>
                  <div className="flex gap-2 items-center">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm tabular-nums px-2">{page} / {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
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
            <SheetTitle>Foydalanuvchi reporti</SheetTitle>
            <SheetDescription>ID: {selected?.id} · {selected?.center?.name ? `Markaz: ${selected.center.name}` : ""}</SheetDescription>
          </SheetHeader>

          {selected && (
            <div className="space-y-6 mt-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant={statusMap[selected.status]?.variant || "outline"}>
                  {statusMap[selected.status]?.label || selected.status}
                </Badge>
                <Badge variant={severityMap[selected.severity]?.variant || "outline"}>
                  {severityMap[selected.severity]?.label || selected.severity}
                </Badge>
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">Report turi</Label>
                <p className="font-medium capitalize">{selected.type}</p>
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">Xulosa</Label>
                <p className="text-sm leading-relaxed">{selected.summary}</p>
              </div>

              {selected.details && (
                <div>
                  <Label className="text-muted-foreground text-xs">Tafsilotlar</Label>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{selected.details}</p>
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
                  <Label className="text-muted-foreground text-xs">Report qilgan foydalanuvchi</Label>
                  <p className="text-sm">
                    {`${selected.createdBy.firstName || ""} ${selected.createdBy.lastName || ""}`.trim() || selected.createdBy.email || `#${selected.createdBy.id}`}
                  </p>
                </div>
              )}

              {selected.resolutionNote && (
                <div>
                  <Label className="text-muted-foreground text-xs">Yechim izohi</Label>
                  <p className="text-sm whitespace-pre-wrap">{selected.resolutionNote}</p>
                </div>
              )}

              <div className="flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(selected.createdAt).toLocaleDateString("uz-UZ")}
                </span>
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
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Reportni hal qilish</AlertDialogTitle>
            <AlertDialogDescription>
              Bu foydalanuvchi reportini hal qilingan deb belgilaysizmi?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-2 space-y-2">
            <Label>Yechim izohi (ixtiyoriy)</Label>
            <Textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Masalan: tekshirildi, kerakli chora ko'rildi..."
              className="min-h-[100px]"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResolutionNote("")}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleResolve} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hal qilish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
