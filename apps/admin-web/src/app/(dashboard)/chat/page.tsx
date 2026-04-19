"use client"

import { useEffect, useState, useCallback } from "react"
import { MessageSquare, MessageCircle, Inbox, CalendarDays, BarChart3, Loader2 } from "lucide-react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/page-header"
import { StatsCard, StatsGrid } from "@/components/stats-card"
import { Badge } from "@/components/ui/badge"
import { useApiData } from "@/hooks/use-api-data"
import { useAuth } from "@/components/auth-provider"
import { classifyApiError, formatEmbeddedApiError } from "@/lib/api-error"
import { AccessDeniedPlaceholder } from "@/components/access-denied-placeholder"

interface Chat {
  id: number
  type: string
  title: string | null
  isActive: boolean
  createdAt: string
  createdByUser: { id: number; email: string | null; firstName: string | null; lastName: string | null } | null
  _count: { messages: number; participants: number }
}

/** GET /chat/stats — backend: faqat SUPERADMIN (umumiy tizim) */
interface GlobalChatStats {
  totalChats: number
  activeChats: number
  totalMessages: number
  todayMessages: number
}

const typeLabels: Record<string, string> = {
  DIRECT: "Shaxsiy",
  GROUP: "Guruh",
  CHANNEL: "Kanal",
}

export default function ChatPage() {
  const { user, isLoading: authLoading } = useAuth()
  const isSuperadmin = user?.role === "SUPERADMIN"

  const [data, setData] = useState<Chat[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const {
    data: globalStats,
    loading: statsLoading,
    error: statsError,
    permissionDenied: statsPermissionDenied,
  } = useApiData<GlobalChatStats>({
    path: "/chat/stats",
    enabled: isSuperadmin,
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    setPermissionDenied(false)
    try {
      const res = await apiClient<PaginatedResponse<Chat>>("/chats", {
        params: { page, limit: 20, search },
      })
      setData(res.data)
      setTotal(res.total)
    } catch (e: unknown) {
      const { permissionDenied: denied } = classifyApiError(e)
      setError(formatEmbeddedApiError(e))
      setPermissionDenied(denied)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (authLoading) {
    return (
      <div className="flex h-[min(60vh,420px)] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" aria-label="Yuklanmoqda" />
      </div>
    )
  }

  const columns = [
    {
      key: "title",
      title: "Chat nomi",
      render: (c: Chat) => (
        <div>
          <span className="font-medium">{c.title || `Chat #${c.id}`}</span>
          <div className="text-xs text-muted-foreground">{typeLabels[c.type] || c.type}</div>
        </div>
      ),
    },
    {
      key: "creator",
      title: "Yaratuvchi",
      render: (c: Chat) =>
        c.createdByUser?.firstName
          ? `${c.createdByUser.firstName} ${c.createdByUser.lastName || ""}`
          : c.createdByUser?.email || "—",
    },
    {
      key: "participants",
      title: "Ishtirokchilar",
      render: (c: Chat) => c._count?.participants || 0,
    },
    {
      key: "messages",
      title: "Xabarlar",
      render: (c: Chat) => c._count?.messages || 0,
    },
    {
      key: "isActive",
      title: "Holat",
      render: (c: Chat) => (
        <Badge variant={c.isActive ? "default" : "secondary"}>{c.isActive ? "Faol" : "Nofaol"}</Badge>
      ),
    },
    {
      key: "createdAt",
      title: "Yaratilgan",
      render: (c: Chat) => new Date(c.createdAt).toLocaleDateString("uz-UZ"),
    },
  ]

  if (permissionDenied) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Muloqot (chatlar)"
          description={
            isSuperadmin
              ? "Tizimdagi barcha chatlar va umumiy statistika (superadmin ko'rinishi)"
              : "Faqat siz ishtirokchi bo'lgan chatlar."
          }
          icon={MessageSquare}
        />
        <AccessDeniedPlaceholder
          title="Chatlar ro'yxatiga ruxsat yo'q"
          description="Chatlar moduli chat.read yoki tegishli ruxsatlarni talab qilishi mumkin."
          detail={error}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Muloqot (chatlar)"
        description={
          isSuperadmin
            ? "Tizimdagi barcha chatlar va umumiy statistika (superadmin ko'rinishi)"
            : "Faqat siz ishtirokchi bo'lgan chatlar. Global moderatsiya va umumiy tizim statistikasi — superadmin uchun."
        }
        icon={MessageSquare}
      />

      {!isSuperadmin && (
        <div
          className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm"
          role="status"
        >
          <p className="font-medium text-foreground">Markaz administratori ko&apos;rinishi</p>
          <p className="mt-1.5 text-muted-foreground leading-relaxed">
            Ro&apos;yxat API orqali sizning foydalanuvchi profilingiz bo&apos;yicha filtrlangan: boshqa
            foydalanuvchilarning chatlarini ko&apos;ra olmaysiz. WebSocket kanallari ham faqat siz
            ishtirokchi bo&apos;lgan chatlar uchun ochiladi.
          </p>
        </div>
      )}

      {isSuperadmin && statsError && !statsPermissionDenied && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <p className="font-medium">Statistika yuklanmadi</p>
          <p className="mt-1 opacity-90">{statsError}</p>
        </div>
      )}

      {isSuperadmin && statsPermissionDenied ? (
        <AccessDeniedPlaceholder
          title="Chat statistikalariga ruxsat yo'q"
          description="Umumiy chat statistikasi odatda faqat superadmin yoki maxsus chat moderatsiya ruxsatida."
          detail={statsError}
        />
      ) : isSuperadmin ? (
        <StatsGrid>
          <StatsCard
            title="Jami chatlar (tizim)"
            value={globalStats?.totalChats ?? "—"}
            icon={MessageSquare}
            loading={statsLoading && !globalStats}
            iconColor="bg-blue-500/10 text-blue-600"
          />
          <StatsCard
            title="Faol chatlar"
            value={globalStats?.activeChats ?? "—"}
            icon={MessageCircle}
            loading={statsLoading && !globalStats}
            iconColor="bg-emerald-500/10 text-emerald-600"
          />
          <StatsCard
            title="Jami xabarlar"
            value={globalStats?.totalMessages ?? "—"}
            icon={BarChart3}
            loading={statsLoading && !globalStats}
            iconColor="bg-violet-500/10 text-violet-600"
          />
          <StatsCard
            title="Bugungi xabarlar"
            value={globalStats?.todayMessages ?? "—"}
            icon={CalendarDays}
            loading={statsLoading && !globalStats}
            iconColor="bg-amber-500/10 text-amber-600"
          />
        </StatsGrid>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Umumiy tizim chat statistikasi faqat <strong>superadmin</strong> uchun. Quyida — siz
            ishtirokchi chatlaringiz soni (pagination jami).
          </p>
          <StatsGrid columns={2}>
            <StatsCard
              title="Sizning chatlaringiz (jami)"
              value={loading ? "—" : total}
              icon={Inbox}
              loading={loading}
              iconColor="bg-sky-500/10 text-sky-600"
              description="GET /chats — ishtirokchi sifatida ko'rinadigan chatlar"
            />
          </StatsGrid>
        </div>
      )}

      <DataTable
        title="Chatlar ro'yxati"
        description={
          isSuperadmin
            ? "Barcha chatlar (superadmin: global ro'yxat)"
            : "Faqat siz ishtirokchi bo'lgan chatlar"
        }
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={20}
        loading={loading}
        error={error}
        searchPlaceholder="Chat qidirish..."
        onPageChange={setPage}
        onSearch={setSearch}
      />
    </div>
  )
}
