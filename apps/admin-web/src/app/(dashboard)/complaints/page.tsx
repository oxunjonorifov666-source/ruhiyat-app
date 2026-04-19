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
  MessageSquareWarning, Search, MoreHorizontal, Eye, ChevronLeft, ChevronRight,
  Loader2, RefreshCw, Calendar, Clock, CheckCircle2, XCircle, UserRound, Inbox, Flame,
} from "lucide-react"
import { toast } from "sonner"
import { describeEmbeddedApiError, isPermissionDeniedError, type EmbeddedApiErrorDescription } from "@/lib/api-error"
import { EmbeddedApiErrorBanner } from "@/components/embedded-api-error-banner"
import { AccessDeniedPlaceholder } from "@/components/access-denied-placeholder"
import { useAuth } from "@/components/auth-provider"
import { useDebounce } from "@/hooks/use-debounce"
import type { AuthUser } from "@/lib/auth"

interface Complaint {
  id: number
  reporterId: number
  targetType: string
  targetId: number
  subject: string
  description: string | null
  status: string
  priority: string
  resolutionNote: string | null
  resolvedAt: string | null
  centerId?: number | null
  createdAt: string
  reporter?: { id: number; email: string | null; phone: string | null; firstName: string | null; lastName: string | null }
  center?: { id: number; name: string } | null
  assignedTo?: { id: number; firstName: string | null; lastName: string | null } | null
  resolver?: { id: number; firstName: string | null; lastName: string | null } | null
}

interface ComplaintDetail extends Complaint {
  reporter?: Complaint["reporter"] & { role?: string }
  moderationActions?: Array<{
    id: number
    action: string
    reason: string | null
    createdAt: string
    moderator?: { id: number; email: string | null; firstName: string | null; lastName: string | null }
  }>
}

interface Stats {
  total: number
  new: number
  inReview: number
  resolved: number
  rejected: number
  urgent: number
}

const statusStyle: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  NEW: { label: "Yangi", variant: "destructive" },
  IN_REVIEW: { label: "Ko'rib chiqilmoqda", variant: "default" },
  RESOLVED: { label: "Hal qilindi", variant: "secondary" },
  REJECTED: { label: "Rad etildi", variant: "outline" },
}

const priorityStyle: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  LOW: { label: "Past", variant: "outline" },
  MEDIUM: { label: "O'rta", variant: "secondary" },
  HIGH: { label: "Yuqori", variant: "default" },
  URGENT: { label: "Shoshilinch", variant: "destructive" },
}

function centerParams(user: AuthUser | null, row: Complaint | ComplaintDetail | null): Record<string, number> | undefined {
  if (!user || !row) return undefined
  if (user.role === "SUPERADMIN") {
    const cid = row.center?.id ?? row.centerId
    if (cid != null && cid !== undefined) return { centerId: cid }
  }
  return undefined
}

export default function ComplaintsPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<Complaint[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch = useDebounce(searchInput, 400)
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [targetFilter, setTargetFilter] = useState("all")

  const [selected, setSelected] = useState<ComplaintDetail | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [responseOpen, setResponseOpen] = useState(false)
  const [responseKind, setResponseKind] = useState<"resolve" | "reject">("resolve")
  const [responseNote, setResponseNote] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [detailFetchError, setDetailFetchError] = useState<EmbeddedApiErrorDescription | null>(null)

  const limit = 20
  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setPermissionDenied(false)
    try {
      const params: Record<string, string | number | undefined> = { page, limit }
      if (debouncedSearch) params.search = debouncedSearch
      if (statusFilter !== "all") params.status = statusFilter
      if (priorityFilter !== "all") params.priority = priorityFilter
      if (targetFilter !== "all") params.targetType = targetFilter

      const [listRes, statsRes] = await Promise.all([
        apiClient<PaginatedResponse<Complaint>>("/complaints", { params }),
        apiClient<Stats>("/complaints/stats"),
      ])
      setRows(listRes.data)
      setTotal(listRes.total)
      setStats(statsRes)
    } catch (e: unknown) {
      if (isPermissionDeniedError(e)) {
        setPermissionDenied(true)
      } else {
        const d = describeEmbeddedApiError(e)
        toast.error(d.title, { description: d.description })
      }
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, statusFilter, priorityFilter, targetFilter])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { setPage(1) }, [debouncedSearch, statusFilter, priorityFilter, targetFilter])

  const openDetail = useCallback(async (c: Complaint) => {
    setDetailFetchError(null)
    setSheetOpen(true)
    try {
      const detail = await apiClient<ComplaintDetail>(`/complaints/${c.id}`, {
        params: centerParams(user, c),
      })
      setSelected(detail)
    } catch (e: unknown) {
      const d = describeEmbeddedApiError(e)
      setDetailFetchError(d)
      setSelected(c as ComplaintDetail)
      toast.error(d.title, { description: d.description })
    }
  }, [user])

  const patchStatus = async (c: Complaint, status: "IN_REVIEW") => {
    setActionLoading(true)
    try {
      await apiClient(`/complaints/${c.id}`, {
        method: "PATCH",
        params: centerParams(user, c),
        body: { status },
      })
      toast.success("Holat yangilandi")
      setSheetOpen(false)
      fetchData()
    } catch (e: unknown) {
      const d = describeEmbeddedApiError(e)
      toast.error(d.title, { description: d.description })
    } finally {
      setActionLoading(false)
    }
  }

  const submitResponse = async () => {
    if (!selected) return
    const path = responseKind === "resolve" ? "resolve" : "reject"
    setActionLoading(true)
    try {
      await apiClient(`/complaints/${selected.id}/${path}`, {
        method: "PATCH",
        params: centerParams(user, selected),
        body: { resolutionNote: responseNote || undefined },
      })
      toast.success(responseKind === "resolve" ? "Hal qilindi" : "Rad etildi")
      setResponseOpen(false)
      setResponseNote("")
      setSheetOpen(false)
      fetchData()
    } catch (e: unknown) {
      const d = describeEmbeddedApiError(e)
      toast.error(d.title, { description: d.description })
    } finally {
      setActionLoading(false)
    }
  }

  if (permissionDenied) {
    return (
      <div className="space-y-6 pb-10">
        <PageHeader
          title="Shikoyatlar"
          description="Foydalanuvchilar yuborgan shikoyatlar (complaints jadvali) — ko'rib chiqish va javob berish"
          icon={MessageSquareWarning}
        />
        <AccessDeniedPlaceholder
          title="Shikoyatlarni ko'rishga ruxsat yo'q"
          description="Shikoyatlar moduli markaz yoki platforma darajasidagi maxsus ruxsatni talab qilishi mumkin. Bu ruxsat bo'lmasa, ro'yxat ochilmaydi."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Shikoyatlar"
        description="Foydalanuvchilar yuborgan shikoyatlar (complaints jadvali) — ko'rib chiqish va javob berish"
        icon={MessageSquareWarning}
        actions={[{ label: "Yangilash", icon: RefreshCw, variant: "outline", onClick: fetchData }]}
      />

      <StatsGrid columns={3}>
        <StatsCard title="Jami" value={stats?.total ?? "—"} icon={Inbox} loading={!stats && loading} />
        <StatsCard title="Yangi" value={stats?.new ?? "—"} icon={MessageSquareWarning} loading={!stats && loading} />
        <StatsCard title="Ko'rib chiqilmoqda" value={stats?.inReview ?? "—"} icon={Clock} loading={!stats && loading} />
      </StatsGrid>
      <StatsGrid columns={3}>
        <StatsCard title="Hal qilingan" value={stats?.resolved ?? "—"} icon={CheckCircle2} loading={!stats && loading} />
        <StatsCard title="Rad etilgan" value={stats?.rejected ?? "—"} icon={XCircle} loading={!stats && loading} />
        <StatsCard title="Shoshilinch" value={stats?.urgent ?? "—"} icon={Flame} loading={!stats && loading} />
      </StatsGrid>

      <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Mavzu yoki matn bo'yicha qidirish..."
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
                  <SelectItem value="RESOLVED">Hal qilingan</SelectItem>
                  <SelectItem value="REJECTED">Rad etilgan</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Muhimlik" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="LOW">Past</SelectItem>
                  <SelectItem value="MEDIUM">O'rta</SelectItem>
                  <SelectItem value="HIGH">Yuqori</SelectItem>
                  <SelectItem value="URGENT">Shoshilinch</SelectItem>
                </SelectContent>
              </Select>
              <Select value={targetFilter} onValueChange={setTargetFilter}>
                <SelectTrigger className="w-[170px]"><SelectValue placeholder="Ob'ekt" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha turlar</SelectItem>
                  <SelectItem value="psychologist">psychologist</SelectItem>
                  <SelectItem value="administrator">administrator</SelectItem>
                  <SelectItem value="content">content</SelectItem>
                  <SelectItem value="session">session</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-14 text-muted-foreground rounded-xl border border-dashed">
              <MessageSquareWarning className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="font-medium">Shikoyatlar yo'q</p>
              <p className="text-sm mt-1 max-w-md mx-auto">Mobil ilova yoki boshqa kanallardan kelgan shikoyatlar shu yerda ko'rinadi.</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Mavzu</TableHead>
                      <TableHead>Shikoyat qilgan</TableHead>
                      <TableHead>Ob'ekt</TableHead>
                      <TableHead>Muhimlik</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead>Markaz</TableHead>
                      <TableHead>Sana</TableHead>
                      <TableHead className="w-[52px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id} className="cursor-pointer" onClick={() => openDetail(r)}>
                        <TableCell className="font-medium max-w-[220px] truncate">{r.subject}</TableCell>
                        <TableCell className="text-sm">
                          <span className="inline-flex items-center gap-1.5">
                            <UserRound className="size-3.5 text-muted-foreground shrink-0" />
                            {r.reporter
                              ? `${r.reporter.firstName || ""} ${r.reporter.lastName || ""}`.trim() || r.reporter.email || `#${r.reporter.id}`
                              : `#${r.reporterId}`}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{r.targetType} #{r.targetId}</TableCell>
                        <TableCell>
                          <Badge variant={priorityStyle[r.priority]?.variant || "outline"}>
                            {priorityStyle[r.priority]?.label || r.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusStyle[r.status]?.variant || "outline"}>
                            {statusStyle[r.status]?.label || r.status}
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
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDetail(r) }}>
                                <Eye className="mr-2 h-4 w-4" />Ochish
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {(r.status === "NEW" || r.status === "IN_REVIEW") && (
                                <>
                                  {r.status === "NEW" && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      patchStatus(r, "IN_REVIEW")
                                    }}
                                  >
                                    <Clock className="mr-2 h-4 w-4" />Ko'rib chiqish
                                  </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelected(r as ComplaintDetail)
                                      setResponseKind("resolve")
                                      setResponseNote("")
                                      setResponseOpen(true)
                                    }}
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />Hal qilish
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelected(r as ComplaintDetail)
                                      setResponseKind("reject")
                                      setResponseNote("")
                                      setResponseOpen(true)
                                    }}
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />Rad etish
                                  </DropdownMenuItem>
                                </>
                              )}
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

      <Sheet
        open={sheetOpen}
        onOpenChange={(o) => {
          setSheetOpen(o)
          if (!o) setDetailFetchError(null)
        }}
      >
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Shikoyat</SheetTitle>
            <SheetDescription>
              #{selected?.id}
              {selected?.center?.name ? ` · ${selected.center.name}` : ""}
            </SheetDescription>
          </SheetHeader>

          <EmbeddedApiErrorBanner error={detailFetchError} className="mt-4" />

          {selected && (
            <div className="space-y-5 mt-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant={statusStyle[selected.status]?.variant || "outline"}>{statusStyle[selected.status]?.label || selected.status}</Badge>
                <Badge variant={priorityStyle[selected.priority]?.variant || "outline"}>{priorityStyle[selected.priority]?.label || selected.priority}</Badge>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Mavzu</Label>
                <p className="font-medium leading-snug">{selected.subject}</p>
              </div>

              {selected.description && (
                <div>
                  <Label className="text-xs text-muted-foreground">Matn</Label>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{selected.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Ob'ekt</Label>
                  <p>{selected.targetType} · #{selected.targetId}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Sana</Label>
                  <p className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {new Date(selected.createdAt).toLocaleString("uz-UZ")}
                  </p>
                </div>
              </div>

              {selected.reporter && (
                <div className="rounded-xl border bg-muted/30 p-4 space-y-1">
                  <Label className="text-xs text-muted-foreground">Shikoyat qilgan foydalanuvchi</Label>
                  <p className="font-medium">
                    {`${selected.reporter.firstName || ""} ${selected.reporter.lastName || ""}`.trim() || selected.reporter.email || `#${selected.reporter.id}`}
                  </p>
                  <p className="text-xs text-muted-foreground">{selected.reporter.phone || selected.reporter.email || ""}</p>
                </div>
              )}

              {selected.resolutionNote && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <Label className="text-xs text-muted-foreground">Javob / yechim</Label>
                  <p className="text-sm whitespace-pre-wrap mt-1">{selected.resolutionNote}</p>
                </div>
              )}

              {selected.moderationActions && selected.moderationActions.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Moderatsiya tarixlari</Label>
                  <ul className="text-xs space-y-2 border rounded-lg p-3 max-h-40 overflow-y-auto">
                    {selected.moderationActions.map((a) => (
                      <li key={a.id} className="border-b border-border/50 pb-2 last:border-0">
                        <span className="font-medium">{a.action}</span>
                        {a.reason ? <span className="text-muted-foreground"> — {a.reason}</span> : null}
                        <div className="text-muted-foreground mt-0.5">
                          {new Date(a.createdAt).toLocaleString("uz-UZ")}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(selected.status === "NEW" || selected.status === "IN_REVIEW") && (
                <div className="flex flex-col gap-2 pt-2">
                  {selected.status === "NEW" && (
                    <Button
                      variant="outline"
                      disabled={actionLoading}
                      onClick={() => patchStatus(selected, "IN_REVIEW")}
                    >
                      <Clock className="mr-2 size-4" />
                      Ko'rib chiqish (status)
                    </Button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700"
                      disabled={actionLoading}
                      onClick={() => {
                        setResponseKind("resolve")
                        setResponseNote("")
                        setResponseOpen(true)
                      }}
                    >
                      <CheckCircle2 className="mr-2 size-4" />
                      Hal qilish
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={actionLoading}
                      onClick={() => {
                        setResponseKind("reject")
                        setResponseNote("")
                        setResponseOpen(true)
                      }}
                    >
                      <XCircle className="mr-2 size-4" />
                      Rad etish
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={responseOpen} onOpenChange={setResponseOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{responseKind === "resolve" ? "Shikoyatni hal qilish" : "Shikoyatni rad etish"}</AlertDialogTitle>
            <AlertDialogDescription>
              Foydalanuvchiga ko'rinadigan javob matnini yozishingiz mumkin (ixtiyoriy).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label>Javob matni</Label>
            <Textarea
              value={responseNote}
              onChange={(e) => setResponseNote(e.target.value)}
              placeholder="Masalan: tekshiruv o'tkazildi, chora ko'rildi..."
              className="min-h-[100px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResponseNote("")}>Bekor</AlertDialogCancel>
            <AlertDialogAction onClick={submitResponse} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Yuborish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
