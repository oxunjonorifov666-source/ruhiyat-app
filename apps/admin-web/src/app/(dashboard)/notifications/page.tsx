"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Bell, Loader2 } from "lucide-react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { useAuth } from "@/components/auth-provider"
import { toast } from "sonner"
import { classifyApiError, describeEmbeddedApiError, formatEmbeddedApiError } from "@/lib/api-error"
import { AccessDeniedPlaceholder } from "@/components/access-denied-placeholder"

interface Notification {
  id: number
  title: string
  body: string | null
  type: string
  isRead: boolean
  createdAt: string
  user: { id: number; email: string | null; firstName: string | null; lastName: string | null }
}

export default function NotificationsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const isSuperAdmin = user?.role === "SUPERADMIN"

  const [data, setData] = useState<Notification[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [markingId, setMarkingId] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    setPermissionDenied(false)
    try {
      const res = await apiClient<PaginatedResponse<Notification>>("/notifications", {
        params: { page, limit: 20 },
      })
      setData(res.data)
      setTotal(res.total)
    } catch (e: unknown) {
      const { permissionDenied: denied } = classifyApiError(e)
      if (denied) setPermissionDenied(true)
      else setError(formatEmbeddedApiError(e))
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const markRead = useCallback(async (id: number) => {
    setMarkingId(id)
    try {
      await apiClient(`/notifications/${id}/read`, { method: "PATCH" })
      toast.success("O'qilgan deb belgilandi")
      await fetchData()
    } catch (e: unknown) {
      const d = describeEmbeddedApiError(e)
      toast.error(d.title, { description: d.description })
    } finally {
      setMarkingId(null)
    }
  }, [fetchData])

  const columns = useMemo(() => {
    const titleCol = {
      key: "title",
      title: "Sarlavha",
      render: (n: Notification) => <span className="font-medium">{n.title}</span>,
    }
    const bodyCol = {
      key: "body",
      title: "Mazmun",
      render: (n: Notification) => (
        <span className="text-sm text-muted-foreground line-clamp-2">{n.body || "—"}</span>
      ),
    }
    const typeCol = {
      key: "type",
      title: "Tur",
      render: (n: Notification) => (
        <span className="text-xs font-mono text-muted-foreground">{n.type}</span>
      ),
    }
    const recipientCol = {
      key: "recipient",
      title: "Qabul qiluvchi",
      render: (n: Notification) =>
        n.user?.firstName || n.user?.lastName
          ? `${n.user.firstName || ""} ${n.user.lastName || ""}`.trim()
          : n.user?.email || `ID ${n.user?.id}`,
    }
    const statusCol = {
      key: "isRead",
      title: "Holat",
      render: (n: Notification) => (
        <Badge variant={n.isRead ? "secondary" : "default"}>{n.isRead ? "O'qilgan" : "Yangi"}</Badge>
      ),
    }
    const dateCol = {
      key: "createdAt",
      title: "Sana",
      render: (n: Notification) => new Date(n.createdAt).toLocaleString("uz-UZ"),
    }
    const actionCol = {
      key: "actions",
      title: "",
      render: (n: Notification) =>
        n.isRead ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={markingId === n.id}
            onClick={() => markRead(n.id)}
          >
            O'qilgan
          </Button>
        ),
    }

    if (isSuperAdmin) {
      return [titleCol, bodyCol, typeCol, recipientCol, statusCol, dateCol, actionCol]
    }
    return [titleCol, bodyCol, typeCol, statusCol, dateCol, actionCol]
  }, [isSuperAdmin, markingId, markRead])

  if (authLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" aria-label="Yuklanmoqda" />
      </div>
    )
  }

  if (permissionDenied) {
    return (
      <div className="space-y-6 pb-8">
        <PageHeader
          title="Bildirishnomalar"
          description="Tizim va shaxsiy bildirishnomalar"
          icon={Bell}
        />
        <AccessDeniedPlaceholder
          title="Bildirishnomalarga ruxsat yo'q"
          description="Bildirishnomalar ro'yxati akkaunt yoki markaz darajasidagi ruxsatga bog'liq bo'lishi mumkin."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Bildirishnomalar"
        description={
          isSuperAdmin
            ? "Tizim bo‘yicha bildirishnomalar. Superadmin: barcha yozuvlar yoki ?userId= bilan filtr (backend)."
            : "Faqat sizning akkauntingizga kelgan bildirishnomalar (boshqa foydalanuvchilar uchun emas)."
        }
        icon={Bell}
      />

      {!isSuperAdmin && (
        <div
          className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
          role="status"
        >
          <p className="font-medium text-foreground">Shaxsiy bildirishnomalar</p>
          <p className="mt-1 leading-relaxed">
            <span className="font-mono text-xs">GET /notifications</span> markaz administratori uchun faqat{" "}
            <strong>joriy login</strong> bo‘yicha filtrlangan natijani qaytaradi. Bu yerda markaz bo‘yicha
            yoki barcha foydalanuvchilar bildirishnomalari ko‘rinmaydi.
          </p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={20}
        loading={loading}
        error={error}
        hideToolbar
        emptySubtext={
          isSuperAdmin
            ? "Hozircha bildirishnoma yo‘q."
            : "Sizga hozircha yuborilgan bildirishnoma yo‘q."
        }
        onPageChange={setPage}
      />
    </div>
  )
}
