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
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { MessageSquare, Users, Mail, Clock, Download, Filter, X, Eye, ToggleLeft, ToggleRight } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

interface ChatParticipant {
  id: number
  userId: number
  user: {
    id: number
    email: string | null
    firstName: string | null
    lastName: string | null
    role: string
  }
}

interface ChatMessage {
  id: number
  content: string | null
  type: string
  senderId: number
  isRead: boolean
  createdAt: string
  sender: {
    id: number
    firstName: string | null
    lastName: string | null
  }
}

interface Chat {
  id: number
  type: string
  title: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  participants: ChatParticipant[]
  lastMessage: ChatMessage | null
  messageCount: number
}

interface ChatDetail {
  id: number
  type: string
  title: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  participants: ChatParticipant[]
  _count: { messages: number }
}

interface ChatStats {
  totalChats: number
  activeChats: number
  totalMessages: number
  todayMessages: number
}

interface MessageItem {
  id: number
  content: string | null
  type: string
  senderId: number
  isRead: boolean
  isDeleted: boolean
  createdAt: string
  sender: {
    id: number
    email: string | null
    firstName: string | null
    lastName: string | null
    role: string
  }
}

const typeLabels: Record<string, string> = {
  DIRECT: "Shaxsiy",
  GROUP: "Guruh",
  SUPPORT: "Qo'llab-quvvatlash",
}

const typeColors: Record<string, "default" | "secondary" | "outline"> = {
  DIRECT: "default",
  GROUP: "secondary",
  SUPPORT: "outline",
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

function exportCSV(data: Chat[]) {
  const headers = ["ID", "Turi", "Sarlavha", "Ishtirokchilar", "Xabarlar soni", "Holat", "Yaratilgan"]
  const rows = data.map(c => [
    c.id,
    typeLabels[c.type] || c.type,
    c.title || "—",
    c.participants.map(p => getUserName(p.user)).join("; "),
    c.messageCount,
    c.isActive ? "Faol" : "Nofaol",
    formatDate(c.createdAt),
  ])
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n")
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = `chatlar_${new Date().toISOString().split("T")[0]}.csv`
  link.click()
}

export default function ChatPage() {
  const [data, setData] = useState<Chat[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<ChatStats | null>(null)

  const [filterType, setFilterType] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetLoading, setSheetLoading] = useState(false)
  const [selectedChat, setSelectedChat] = useState<ChatDetail | null>(null)
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)

  const [toggleChat, setToggleChat] = useState<Chat | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string | number | undefined> = { page, limit: 20 }
      if (search) params.search = search
      if (filterType) params.type = filterType
      if (filterStatus) params.status = filterStatus
      const res = await apiClient<PaginatedResponse<Chat>>("/chats", { params })
      setData(res.data)
      setTotal(res.total)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, search, filterType, filterStatus])

  const fetchStats = useCallback(async () => {
    try {
      const s = await apiClient<ChatStats>("/chat/stats")
      setStats(s)
    } catch {}
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchStats() }, [fetchStats])

  const openDetail = async (chat: Chat) => {
    setSheetOpen(true)
    setSheetLoading(true)
    setMessages([])
    try {
      const detail = await apiClient<ChatDetail>(`/chats/${chat.id}`)
      setSelectedChat(detail)
      setMessagesLoading(true)
      const msgRes = await apiClient<PaginatedResponse<MessageItem>>(`/chats/${chat.id}/messages`, { params: { limit: 50 } })
      setMessages(msgRes.data)
    } catch {
      setSelectedChat(null)
    } finally {
      setSheetLoading(false)
      setMessagesLoading(false)
    }
  }

  const handleToggle = async () => {
    if (!toggleChat) return
    try {
      await apiClient(`/chats/${toggleChat.id}/toggle`, { method: "PATCH" })
      fetchData()
      fetchStats()
    } catch {}
    setToggleChat(null)
  }

  const clearFilters = () => {
    setFilterType("")
    setFilterStatus("")
    setPage(1)
  }

  const hasFilters = filterType || filterStatus

  const columns = [
    {
      key: "title",
      title: "Chat",
      render: (c: Chat) => (
        <div>
          <p className="font-medium">{c.title || c.participants.map(p => getUserName(p.user)).join(", ")}</p>
          <p className="text-xs text-muted-foreground">
            {c.participants.length} ishtirokchi
          </p>
        </div>
      ),
    },
    {
      key: "type",
      title: "Turi",
      render: (c: Chat) => <Badge variant={typeColors[c.type] || "secondary"}>{typeLabels[c.type] || c.type}</Badge>,
    },
    {
      key: "lastMessage",
      title: "Oxirgi xabar",
      render: (c: Chat) => (
        <div className="max-w-[200px]">
          {c.lastMessage ? (
            <>
              <p className="text-sm truncate">{c.lastMessage.content || "(media)"}</p>
              <p className="text-xs text-muted-foreground">
                {getUserName(c.lastMessage.sender)} · {formatDate(c.lastMessage.createdAt)}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Xabar yo'q</p>
          )}
        </div>
      ),
    },
    {
      key: "messageCount",
      title: "Xabarlar",
      render: (c: Chat) => <span className="font-medium">{c.messageCount}</span>,
    },
    {
      key: "isActive",
      title: "Holat",
      render: (c: Chat) => (
        <Badge variant={c.isActive ? "default" : "secondary"}>
          {c.isActive ? "Faol" : "Nofaol"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      title: "Yaratilgan",
      render: (c: Chat) => formatDate(c.createdAt),
    },
    {
      key: "actions",
      title: "",
      render: (c: Chat) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => openDetail(c)}>
            <Eye className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setToggleChat(c)}>
            {c.isActive ? <ToggleRight className="size-4 text-emerald-600" /> : <ToggleLeft className="size-4 text-muted-foreground" />}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chat"
        description="Platformadagi chatlarni kuzatish va boshqarish"
        icon={MessageSquare}
        actions={[
          { label: "CSV yuklash", icon: Download, variant: "outline" as const, onClick: () => exportCSV(data) },
          { label: showFilters ? "Filtrni yopish" : "Filtr", icon: showFilters ? X : Filter, variant: "outline" as const, onClick: () => setShowFilters(!showFilters) },
        ]}
      />

      {stats && (
        <StatsGrid columns={4}>
          <StatsCard title="Jami chatlar" value={stats.totalChats} icon={MessageSquare} iconColor="bg-blue-500/10 text-blue-600" />
          <StatsCard title="Faol chatlar" value={stats.activeChats} icon={Users} iconColor="bg-emerald-500/10 text-emerald-600" />
          <StatsCard title="Jami xabarlar" value={stats.totalMessages} icon={Mail} iconColor="bg-violet-500/10 text-violet-600" />
          <StatsCard title="Bugungi xabarlar" value={stats.todayMessages} icon={Clock} iconColor="bg-amber-500/10 text-amber-600" />
        </StatsGrid>
      )}

      {stats && (stats.totalChats > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Chat holatlari</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Faol", value: stats.activeChats },
                      { name: "Nofaol", value: stats.totalChats - stats.activeChats },
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    <Cell fill="hsl(142, 76%, 36%)" />
                    <Cell fill="hsl(221, 83%, 53%)" />
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
                <label className="text-xs font-medium text-muted-foreground">Holat</label>
                <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v === "all" ? "" : v); setPage(1) }}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Barchasi" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    <SelectItem value="active">Faol</SelectItem>
                    <SelectItem value="inactive">Nofaol</SelectItem>
                  </SelectContent>
                </Select>
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
        searchPlaceholder="Chat qidirish..."
        onPageChange={setPage}
        onSearch={(s) => { setSearch(s); setPage(1) }}
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Chat tafsilotlari</SheetTitle>
            <SheetDescription>Chat #{selectedChat?.id} haqida ma'lumot</SheetDescription>
          </SheetHeader>
          {sheetLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full size-8 border-b-2 border-primary" />
            </div>
          ) : selectedChat && (
            <div className="space-y-6 mt-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Asosiy ma'lumot</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-muted-foreground">ID</p><p className="font-medium">#{selectedChat.id}</p></div>
                  <div><p className="text-xs text-muted-foreground">Turi</p><Badge variant={typeColors[selectedChat.type] || "secondary"}>{typeLabels[selectedChat.type] || selectedChat.type}</Badge></div>
                  <div><p className="text-xs text-muted-foreground">Sarlavha</p><p className="font-medium">{selectedChat.title || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Holat</p><Badge variant={selectedChat.isActive ? "default" : "secondary"}>{selectedChat.isActive ? "Faol" : "Nofaol"}</Badge></div>
                  <div><p className="text-xs text-muted-foreground">Xabarlar soni</p><p className="font-medium">{selectedChat._count?.messages || 0}</p></div>
                  <div><p className="text-xs text-muted-foreground">Yaratilgan</p><p className="font-medium">{formatDateTime(selectedChat.createdAt)}</p></div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Ishtirokchilar ({selectedChat.participants.length})
                </h3>
                <div className="space-y-2">
                  {selectedChat.participants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">{getUserName(p.user)}</p>
                        <p className="text-xs text-muted-foreground">{p.user.email}</p>
                      </div>
                      <Badge variant="outline">{p.user.role}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Oxirgi xabarlar
                </h3>
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full size-6 border-b-2 border-primary" />
                  </div>
                ) : messages.length > 0 ? (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3 pr-4">
                      {messages.map((msg) => (
                        <div key={msg.id} className="rounded-lg border p-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium">{getUserName(msg.sender)}</p>
                            <p className="text-xs text-muted-foreground">{formatDateTime(msg.createdAt)}</p>
                          </div>
                          <p className="text-sm">{msg.content || "(media)"}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px]">{msg.type}</Badge>
                            {msg.isRead && <span className="text-[10px] text-muted-foreground">✓ O'qilgan</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">Xabarlar yo'q</p>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!toggleChat} onOpenChange={() => setToggleChat(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Chat holatini o'zgartirish</AlertDialogTitle>
            <AlertDialogDescription>
              {toggleChat?.isActive
                ? "Bu chatni nofaol holatga o'tkazmoqchimisiz? Ishtirokchilar xabar yoza olmaydi."
                : "Bu chatni faol holatga o'tkazmoqchimisiz?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggle}>
              {toggleChat?.isActive ? "Nofaol qilish" : "Faol qilish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
