"use client"

import { useEffect, useState, useCallback } from "react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { safeDevError } from "@/lib/safe-log"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Ban, Search, ChevronLeft, ChevronRight, Loader2, RefreshCw,
  Unlock, History, Shield,
} from "lucide-react"

interface BlockedUser {
  id: number
  email: string | null
  phone: string | null
  firstName: string | null
  lastName: string | null
  role: string
  isBlocked: boolean
  blockedAt: string | null
  blockedReason: string | null
  psychologist?: { id: number; specialization: string | null } | null
}

interface BlockHistoryItem {
  id: number
  targetType: string
  targetId: number
  action: string
  reason: string | null
  performedBy: number
  createdAt: string
  performer?: { id: number; email: string | null; firstName: string | null; lastName: string | null }
}

export default function BlockingPage() {
  const [blocked, setBlocked] = useState<BlockedUser[]>([])
  const [history, setHistory] = useState<BlockHistoryItem[]>([])
  const [loadingBlocked, setLoadingBlocked] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [blockedPage, setBlockedPage] = useState(1)
  const [blockedTotal, setBlockedTotal] = useState(0)
  const [historyPage, setHistoryPage] = useState(1)
  const [historyTotal, setHistoryTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [unblockTarget, setUnblockTarget] = useState<BlockedUser | null>(null)
  const [unblockOpen, setUnblockOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const limit = 20

  const fetchBlocked = useCallback(async () => {
    setLoadingBlocked(true)
    try {
      const params: Record<string, string | number | undefined> = { page: blockedPage, limit }
      if (search) params.search = search
      const res = await apiClient<PaginatedResponse<BlockedUser>>("/blocks", { params })
      setBlocked(res.data)
      setBlockedTotal(res.total)
    } catch (e) {
      safeDevError("blocking/list", e)
    }
    setLoadingBlocked(false)
  }, [blockedPage, search])

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const params: Record<string, string | number | undefined> = { page: historyPage, limit }
      const res = await apiClient<PaginatedResponse<BlockHistoryItem>>("/blocks/history", { params })
      setHistory(res.data)
      setHistoryTotal(res.total)
    } catch (e) {
      safeDevError("blocking/history", e)
    }
    setLoadingHistory(false)
  }, [historyPage])

  useEffect(() => { fetchBlocked() }, [fetchBlocked])
  useEffect(() => { fetchHistory() }, [fetchHistory])

  const handleUnblock = async () => {
    if (!unblockTarget) return
    setActionLoading(true)
    try {
      if (unblockTarget.psychologist) {
        await apiClient(`/blocks/psychologists/${unblockTarget.psychologist.id}/unblock`, { method: "PATCH" })
      } else {
        await apiClient(`/blocks/users/${unblockTarget.id}/unblock`, { method: "PATCH" })
      }
      setUnblockOpen(false)
      setUnblockTarget(null)
      fetchBlocked()
      fetchHistory()
    } catch (e) {
      safeDevError("blocking/unblock", e)
    }
    setActionLoading(false)
  }

  const blockedPages = Math.ceil(blockedTotal / limit)
  const historyPages = Math.ceil(historyTotal / limit)

  return (
    <div className="space-y-6">
      <PageHeader title="Bloklash" description="Bloklangan foydalanuvchilar va bloklash tarixini boshqarish" />

      <Tabs defaultValue="blocked">
        <TabsList>
          <TabsTrigger value="blocked" className="gap-2"><Ban className="h-4 w-4" />Bloklangan ({blockedTotal})</TabsTrigger>
          <TabsTrigger value="history" className="gap-2"><History className="h-4 w-4" />Tarix ({historyTotal})</TabsTrigger>
        </TabsList>

        <TabsContent value="blocked">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Qidirish..." value={search} onChange={(e) => { setSearch(e.target.value); setBlockedPage(1) }} className="pl-9" />
                </div>
                <Button variant="outline" size="icon" onClick={fetchBlocked}><RefreshCw className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingBlocked ? (
                <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : blocked.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Bloklangan foydalanuvchilar yo'q</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Foydalanuvchi</TableHead>
                        <TableHead>Email / Telefon</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Sabab</TableHead>
                        <TableHead>Bloklangan sana</TableHead>
                        <TableHead className="w-[100px]">Amal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blocked.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.firstName || ""} {u.lastName || ""}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{u.email || u.phone || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={u.psychologist ? "default" : "secondary"}>
                              {u.psychologist ? "Psixolog" : u.role === "MOBILE_USER" ? "Foydalanuvchi" : u.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm">{u.blockedReason || "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {u.blockedAt ? new Date(u.blockedAt).toLocaleDateString("uz-UZ") : "—"}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => { setUnblockTarget(u); setUnblockOpen(true) }}>
                              <Unlock className="mr-1 h-3.5 w-3.5" />Ochish
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {blockedPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">Jami: {blockedTotal}</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={blockedPage <= 1} onClick={() => setBlockedPage(blockedPage - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                        <span className="text-sm py-1 px-2">{blockedPage} / {blockedPages}</span>
                        <Button variant="outline" size="sm" disabled={blockedPage >= blockedPages} onClick={() => setBlockedPage(blockedPage + 1)}><ChevronRight className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Bloklash tarixi</CardTitle>
                <Button variant="outline" size="icon" onClick={fetchHistory}><RefreshCw className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Tarix bo'sh</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Turi</TableHead>
                        <TableHead>Maqsad ID</TableHead>
                        <TableHead>Amal</TableHead>
                        <TableHead>Sabab</TableHead>
                        <TableHead>Bajaruvchi</TableHead>
                        <TableHead>Sana</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((h) => (
                        <TableRow key={h.id}>
                          <TableCell className="capitalize">{h.targetType === "user" ? "Foydalanuvchi" : "Psixolog"}</TableCell>
                          <TableCell>#{h.targetId}</TableCell>
                          <TableCell>
                            <Badge variant={h.action === "block" ? "destructive" : "secondary"}>
                              {h.action === "block" ? "Bloklandi" : "Blok ochildi"}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm">{h.reason || "—"}</TableCell>
                          <TableCell className="text-sm">
                            {h.performer ? `${h.performer.firstName || ""} ${h.performer.lastName || ""}`.trim() : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(h.createdAt).toLocaleDateString("uz-UZ")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {historyPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">Jami: {historyTotal}</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={historyPage <= 1} onClick={() => setHistoryPage(historyPage - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                        <span className="text-sm py-1 px-2">{historyPage} / {historyPages}</span>
                        <Button variant="outline" size="sm" disabled={historyPage >= historyPages} onClick={() => setHistoryPage(historyPage + 1)}><ChevronRight className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={unblockOpen} onOpenChange={setUnblockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Blokni olib tashlash</AlertDialogTitle>
            <AlertDialogDescription>
              {unblockTarget?.firstName} {unblockTarget?.lastName} foydalanuvchisining blokini olib tashlaysizmi?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnblock} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Blokni ochish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
