"use client"

import { useEffect, useState, useCallback } from "react"
import { MessageSquare, Users, MessageCircle, Lock } from "lucide-react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/page-header"
import { StatsCard, StatsGrid } from "@/components/stats-card"
import { Badge } from "@/components/ui/badge"
import { useApiData } from "@/hooks/use-api-data"

interface Chat {
  id: number
  type: string
  title: string | null
  isActive: boolean
  createdAt: string
  createdByUser: { id: number; email: string | null; firstName: string | null; lastName: string | null } | null
  _count: { messages: number; participants: number }
}

interface ChatStats {
  totalChats: number
  activeChats: number
  totalMessages: number
  directChats: number
  groupChats: number
}

const typeLabels: Record<string, string> = {
  DIRECT: "Shaxsiy", GROUP: "Guruh", CHANNEL: "Kanal",
}

export default function ChatPage() {
  const [data, setData] = useState<Chat[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { data: stats } = useApiData<ChatStats>("/chat/stats")

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await apiClient<PaginatedResponse<Chat>>("/chats", {
        params: { page, limit: 20, search },
      })
      setData(res.data); setTotal(res.total)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { fetchData() }, [fetchData])

  const columns = [
    {
      key: "title", title: "Chat nomi",
      render: (c: Chat) => (
        <div>
          <span className="font-medium">{c.title || `Chat #${c.id}`}</span>
          <div className="text-xs text-muted-foreground">{typeLabels[c.type] || c.type}</div>
        </div>
      ),
    },
    { key: "creator", title: "Yaratuvchi", render: (c: Chat) => c.createdByUser?.firstName ? `${c.createdByUser.firstName} ${c.createdByUser.lastName || ""}` : c.createdByUser?.email || "—" },
    { key: "participants", title: "Ishtirokchilar", render: (c: Chat) => c._count?.participants || 0 },
    { key: "messages", title: "Xabarlar", render: (c: Chat) => c._count?.messages || 0 },
    { key: "isActive", title: "Holat", render: (c: Chat) => (
      <Badge variant={c.isActive ? "default" : "secondary"}>{c.isActive ? "Faol" : "Nofaol"}</Badge>
    )},
    { key: "createdAt", title: "Yaratilgan", render: (c: Chat) => new Date(c.createdAt).toLocaleDateString("uz-UZ") },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Chat" subtitle="Xabarlar va chatlarni monitoring qilish" icon={MessageSquare} />

      <StatsGrid>
        <StatsCard title="Jami chatlar" value={stats?.totalChats || 0} icon={MessageSquare} loading={!stats} iconColor="text-blue-600" />
        <StatsCard title="Faol chatlar" value={stats?.activeChats || 0} icon={MessageCircle} loading={!stats} iconColor="text-green-600" />
        <StatsCard title="Jami xabarlar" value={stats?.totalMessages || 0} icon={Users} loading={!stats} iconColor="text-purple-600" />
        <StatsCard title="Guruh chatlar" value={stats?.groupChats || 0} icon={Lock} loading={!stats} iconColor="text-orange-600" />
      </StatsGrid>

      <DataTable
        title="Chatlar ro'yxati" description="Barcha chatlarni ko'rish"
        columns={columns} data={data} total={total} page={page} limit={20}
        loading={loading} error={error} searchPlaceholder="Chat qidirish..."
        onPageChange={setPage} onSearch={setSearch}
      />
    </div>
  )
}
