"use client"

import { useEffect, useState, useCallback } from "react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
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
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertTriangle, MessageSquare, CheckCircle2, XCircle, Search, MoreHorizontal,
  Eye, UserCheck, ChevronLeft, ChevronRight, Loader2, RefreshCw,
  Calendar, Clock, Inbox,
} from "lucide-react"

interface Complaint {
  id: number
  reporterId: number
  targetType: string
  targetId: number
  subject: string
  description: string | null
  status: string
  priority: string
  assignedToUserId: number | null
  resolutionNote: string | null
  resolvedBy: number | null
  resolvedAt: string | null
  createdAt: string
  reporter?: { id: number; email: string | null; firstName: string | null; lastName: string | null }
  assignedTo?: { id: number; email: string | null; firstName: string | null; lastName: string | null } | null
  resolver?: { id: number; firstName: string | null; lastName: string | null } | null
}

interface Stats {
  total: number; new: number; inReview: number; resolved: number; rejected: number; urgent: number
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  NEW: { label: "Yangi", variant: "destructive" },
  IN_REVIEW: { label: "Ko'rib chiqilmoqda", variant: "default" },
  RESOLVED: { label: "Hal qilindi", variant: "secondary" },
  REJECTED: { label: "Rad etildi", variant: "outline" },
}

const priorityMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  LOW: { label: "Past", variant: "outline" },
  MEDIUM: { label: "O'rta", variant: "secondary" },
  HIGH: { label: "Yuqori", variant: "default" },
  URGENT: { label: "Shoshilinch", variant: "destructive" },
}

const targetTypeMap: Record<string, string> = {
  psychologist: "Psixolog",
  administrator: "Administrator",
  content: "Kontent",
  session: "Sessiya",
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selected, setSelected] = useState<Complaint | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [resolveOpen, setResolveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [assignUserId, setAssignUserId] = useState("")
  const [resolutionNote, setResolutionNote] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const limit = 20

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number | undefined> = { page, limit }
      if (search) params.search = search
      if (statusFilter !== "all") params.status = statusFilter
      if (priorityFilter !== "all") params.priority = priorityFilter
      const [listRes, statsRes] = await Promise.all([
        apiClient<PaginatedResponse<Complaint>>("/complaints", { params }),
        apiClient<Stats>("/complaints/stats"),
      ])
      setComplaints(listRes.data)
      setTotal(listRes.total)
      setStats(statsRes)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [page, search, statusFilter, priorityFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleViewDetail = async (c: Complaint) => {
    try {
      const detail = await apiClient<Complaint>(`/complaints/${c.id}`)
      setSelected(detail)
      setSheetOpen(true)
    } catch { setSelected(c); setSheetOpen(true) }
  }

  const handleAssign = async () => {
    if (!selected) return
    setActionLoading(true)
    try {
      await apiClient(`/complaints/${selected.id}/assign`, { method: "PATCH", body: { assignedToUserId: assignUserId ? parseInt(assignUserId) : null } })
      setAssignOpen(false)
      setAssignUserId("")
      fetchData()
    } catch (e) { console.error(e) }
    setActionLoading(false)
  }

  const handleResolve = async () => {
    if (!selected) return
    setActionLoading(true)
    try {
      await apiClient(`/complaints/${selected.id}/resolve`, { method: "PATCH", body: { resolutionNote } })
      setResolveOpen(false)
      setResolutionNote("")
      setSheetOpen(false)
      fetchData()
    } catch (e) { console.error(e) }
    setActionLoading(false)
  }

  const handleReject = async () => {
    if (!selected) return
    setActionLoading(true)
    try {
      await apiClient(`/complaints/${selected.id}/reject`, { method: "PATCH", body: { resolutionNote } })
      setRejectOpen(false)
      setResolutionNote("")
      setSheetOpen(false)
      fetchData()
    } catch (e) { console.error(e) }
    setActionLoading(false)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <PageHeader title="Shikoyatlar" description="Foydalanuvchilar shikoyatlarini ko'rish va boshqarish" />

      {stats && (
        <StatsGrid columns={4}>
          <StatsCard title="Jami" value={stats.total} icon={MessageSquare} />
          <StatsCard title="Yangi" value={stats.new} icon={Inbox} />
          <StatsCard title="Ko'rib chiqilmoqda" value={stats.inReview} icon={Clock} />
          <StatsCard title="Hal qilindi" value={stats.resolved} icon={CheckCircle2} />
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
                <SelectItem value="REJECTED">Rad etildi</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Muhimlik" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha</SelectItem>
                <SelectItem value="LOW">Past</SelectItem>
                <SelectItem value="MEDIUM">O'rta</SelectItem>
                <SelectItem value="HIGH">Yuqori</SelectItem>
                <SelectItem value="URGENT">Shoshilinch</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Shikoyatlar topilmadi</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mavzu</TableHead>
                    <TableHead>Maqsad turi</TableHead>
                    <TableHead>Muhimlik</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Tayinlangan</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((c) => (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => handleViewDetail(c)}>
                      <TableCell className="font-medium">{c.subject}</TableCell>
                      <TableCell>{targetTypeMap[c.targetType] || c.targetType}</TableCell>
                      <TableCell>
                        <Badge variant={priorityMap[c.priority]?.variant || "outline"}>{priorityMap[c.priority]?.label || c.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusMap[c.status]?.variant || "outline"}>{statusMap[c.status]?.label || c.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {c.assignedTo ? `${c.assignedTo.firstName || ""} ${c.assignedTo.lastName || ""}`.trim() : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(c.createdAt).toLocaleDateString("uz-UZ")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewDetail(c) }}>
                              <Eye className="mr-2 h-4 w-4" />Ko'rish
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelected(c); setAssignOpen(true) }}>
                              <UserCheck className="mr-2 h-4 w-4" />Tayinlash
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelected(c); setResolveOpen(true) }}>
                              <CheckCircle2 className="mr-2 h-4 w-4" />Hal qilish
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setSelected(c); setRejectOpen(true) }}>
                              <XCircle className="mr-2 h-4 w-4" />Rad etish
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
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm py-1 px-2">{page} / {totalPages}</span>
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
            <SheetTitle>Shikoyat tafsilotlari</SheetTitle>
            <SheetDescription>ID: {selected?.id}</SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="space-y-6 mt-6">
              <div className="flex gap-2">
                <Badge variant={statusMap[selected.status]?.variant}>{statusMap[selected.status]?.label}</Badge>
                <Badge variant={priorityMap[selected.priority]?.variant}>{priorityMap[selected.priority]?.label}</Badge>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Mavzu</Label>
                <p className="font-medium">{selected.subject}</p>
              </div>
              {selected.description && (
                <div>
                  <Label className="text-muted-foreground text-xs">Tavsif</Label>
                  <p className="text-sm">{selected.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Maqsad turi</Label>
                  <p className="text-sm">{targetTypeMap[selected.targetType] || selected.targetType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Maqsad ID</Label>
                  <p className="text-sm">#{selected.targetId}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Shikoyatchi</Label>
                <p className="text-sm">{selected.reporter?.firstName} {selected.reporter?.lastName} ({selected.reporter?.email})</p>
              </div>
              {selected.assignedTo && (
                <div>
                  <Label className="text-muted-foreground text-xs">Tayinlangan</Label>
                  <p className="text-sm">{selected.assignedTo.firstName} {selected.assignedTo.lastName}</p>
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
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => { setResolveOpen(true) }}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />Hal qilish
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => { setRejectOpen(true) }}>
                    <XCircle className="mr-2 h-4 w-4" />Rad etish
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setAssignOpen(true) }}>
                    <UserCheck className="mr-2 h-4 w-4" />Tayinlash
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shikoyatni tayinlash</DialogTitle>
            <DialogDescription>Shikoyatni ko'rib chiqish uchun foydalanuvchini tayinlang</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Foydalanuvchi ID</Label>
              <Input type="number" value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} placeholder="Foydalanuvchi ID kiriting" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleAssign} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Tayinlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Shikoyatni hal qilish</AlertDialogTitle>
            <AlertDialogDescription>Bu shikoyatni hal qilingan deb belgilaysizmi?</AlertDialogDescription>
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

      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Shikoyatni rad etish</AlertDialogTitle>
            <AlertDialogDescription>Bu shikoyatni rad etasizmi?</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label>Rad etish sababi</Label>
            <Textarea value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)} placeholder="Rad etish sababi..." />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResolutionNote("")}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} disabled={actionLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Rad etish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
