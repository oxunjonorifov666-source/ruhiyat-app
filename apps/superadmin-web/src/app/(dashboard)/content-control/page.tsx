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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  CheckCircle2, XCircle, EyeOff, Search, MoreHorizontal,
  ChevronLeft, ChevronRight, Loader2, RefreshCw,
  FileText, Clock, Shield, Trash2,
} from "lucide-react"

interface ContentItem {
  id: number
  contentType: string
  contentId: number
  contentTitle: string | null
  status: string
  moderatorId: number | null
  moderatorNote: string | null
  reviewedAt: string | null
  createdAt: string
  moderator?: { id: number; email: string | null; firstName: string | null; lastName: string | null } | null
}

interface Stats { total: number; pending: number; approved: number; rejected: number; hidden: number }

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Kutilmoqda", variant: "outline" },
  APPROVED: { label: "Tasdiqlangan", variant: "secondary" },
  REJECTED: { label: "Rad etilgan", variant: "destructive" },
  HIDDEN: { label: "Yashirilgan", variant: "default" },
}

const contentTypeMap: Record<string, string> = {
  article: "Maqola",
  banner: "Banner",
  notification: "Bildirishnoma",
  video: "Video",
  audio: "Audio",
  affirmation: "Affirmatsiya",
  test: "Test",
  training: "Trening",
}

export default function ContentControlPage() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [actionTarget, setActionTarget] = useState<ContentItem | null>(null)
  const [actionType, setActionType] = useState<"approve" | "reject" | "hide" | "delete" | null>(null)
  const [moderatorNote, setModeratorNote] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const limit = 20

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number | undefined> = { page, limit }
      if (search) params.search = search
      if (statusFilter !== "all") params.status = statusFilter
      if (typeFilter !== "all") params.contentType = typeFilter
      const [listRes, statsRes] = await Promise.all([
        apiClient<PaginatedResponse<ContentItem>>("/content-moderation", { params }),
        apiClient<Stats>("/content-moderation/stats"),
      ])
      setItems(listRes.data)
      setTotal(listRes.total)
      setStats(statsRes)
    } catch (e) {
      safeDevError("content-control/fetch", e)
    }
    setLoading(false)
  }, [page, search, statusFilter, typeFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAction = async () => {
    if (!actionTarget || !actionType) return
    setActionLoading(true)
    try {
      await apiClient(`/content-moderation/${actionTarget.id}/${actionType}`, { method: "PATCH", body: { moderatorNote } })
      setActionTarget(null)
      setActionType(null)
      setModeratorNote("")
      fetchData()
    } catch (e) {
      safeDevError("content-control/action", e)
    }
    setActionLoading(false)
  }

  const totalPages = Math.ceil(total / limit)

  const actionTitle =
    actionType === "approve"
      ? "Kontentni tasdiqlash"
      : actionType === "reject"
        ? "Kontentni rad etish"
        : actionType === "delete"
          ? "Kontentni o'chirish"
          : "Kontentni yashirish"
  const actionDesc =
    actionType === "approve"
      ? "Bu kontentni tasdiqlaysizmi?"
      : actionType === "reject"
        ? "Bu kontentni rad etasizmi?"
        : actionType === "delete"
          ? "Bu kontentni o'chirasizmi? (soft-delete / unpublish)"
          : "Bu kontentni yashirasizmi?"

  return (
    <div className="space-y-6">
      <PageHeader title="Kontent nazorati" description="Platformadagi kontentni moderatsiya qilish" />

      {stats && (
        <StatsGrid columns={4}>
          <StatsCard title="Jami" value={stats.total} icon={FileText} />
          <StatsCard title="Kutilmoqda" value={stats.pending} icon={Clock} />
          <StatsCard title="Tasdiqlangan" value={stats.approved} icon={CheckCircle2} />
          <StatsCard title="Rad etilgan" value={stats.rejected} icon={XCircle} />
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
                <SelectItem value="PENDING">Kutilmoqda</SelectItem>
                <SelectItem value="APPROVED">Tasdiqlangan</SelectItem>
                <SelectItem value="REJECTED">Rad etilgan</SelectItem>
                <SelectItem value="HIDDEN">Yashirilgan</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tur" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha turlar</SelectItem>
                <SelectItem value="article">Maqola</SelectItem>
                <SelectItem value="banner">Banner</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="affirmation">Affirmatsiya</SelectItem>
                <SelectItem value="test">Test</SelectItem>
                <SelectItem value="training">Trening</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Moderatsiya elementlari topilmadi</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kontent nomi</TableHead>
                    <TableHead>Turi</TableHead>
                    <TableHead>Kontent ID</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Moderator</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.contentTitle || `#${item.contentId}`}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{contentTypeMap[item.contentType] || item.contentType}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">#{item.contentId}</TableCell>
                      <TableCell>
                        <Badge variant={statusMap[item.status]?.variant}>{statusMap[item.status]?.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.moderator ? `${item.moderator.firstName || ""} ${item.moderator.lastName || ""}`.trim() : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(item.createdAt).toLocaleDateString("uz-UZ")}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setActionTarget(item); setActionType("approve") }}>
                              <CheckCircle2 className="mr-2 h-4 w-4" />Tasdiqlash
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setActionTarget(item); setActionType("reject") }}>
                              <XCircle className="mr-2 h-4 w-4" />Rad etish
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setActionTarget(item); setActionType("hide") }}>
                              <EyeOff className="mr-2 h-4 w-4" />Yashirish
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setActionTarget(item); setActionType("delete") }} className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />O'chirish
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

      <AlertDialog open={!!actionType && !!actionTarget} onOpenChange={(open) => { if (!open) { setActionType(null); setActionTarget(null); setModeratorNote("") } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{actionTitle}</AlertDialogTitle>
            <AlertDialogDescription>{actionDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label>Moderator izohi</Label>
            <Textarea value={moderatorNote} onChange={(e) => setModeratorNote(e.target.value)} placeholder="Izoh qoldiring..." />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setModeratorNote("")}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={actionLoading}
              className={actionType === "reject" || actionType === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionType === "approve" ? "Tasdiqlash" : actionType === "reject" ? "Rad etish" : actionType === "delete" ? "O'chirish" : "Yashirish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
