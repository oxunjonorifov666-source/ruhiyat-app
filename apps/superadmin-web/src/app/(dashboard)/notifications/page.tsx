"use client"

import { useEffect, useState, useCallback } from "react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"

interface Notification {
  id: number; title: string; body: string | null; type: string; isRead: boolean; createdAt: string
  user: { id: number; email: string | null; firstName: string | null; lastName: string | null }
}

export default function NotificationsPage() {
  const [data, setData] = useState<Notification[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await apiClient<PaginatedResponse<Notification>>("/notifications", { params: { page, limit: 20 } })
      setData(res.data); setTotal(res.total)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [page])

  useEffect(() => { fetchData() }, [fetchData])

  const columns = [
    { key: "title", title: "Sarlavha", render: (n: Notification) => <span className="font-medium">{n.title}</span> },
    { key: "body", title: "Mazmun", render: (n: Notification) => <span className="text-sm text-muted-foreground line-clamp-1">{n.body || "—"}</span> },
    { key: "user", title: "Foydalanuvchi", render: (n: Notification) => n.user?.firstName ? `${n.user.firstName} ${n.user.lastName || ""}` : n.user?.email || `#${n.user?.id}` },
    { key: "type", title: "Tur", render: (n: Notification) => <Badge variant="outline">{n.type}</Badge> },
    { key: "isRead", title: "Holat", render: (n: Notification) => <Badge variant={n.isRead ? "secondary" : "default"}>{n.isRead ? "O'qilgan" : "Yangi"}</Badge> },
    { key: "createdAt", title: "Sana", render: (n: Notification) => new Date(n.createdAt).toLocaleDateString("uz-UZ") },
  ]

  return (
    <DataTable
      title="Bildirishnomalar" description="Tizim bildirishnomalarini boshqarish"
      columns={columns} data={data} total={total} page={page} limit={20}
      loading={loading} error={error} searchPlaceholder="Qidirish..."
      onPageChange={setPage} onSearch={() => {}}
    />
  )
}
