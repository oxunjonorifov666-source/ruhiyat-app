"use client"

import { useEffect, useState, useCallback } from "react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"

interface Meeting {
  id: number; title: string; description: string | null; type: string; status: string
  scheduledAt: string; duration: number | null
  host: { id: number; email: string | null; firstName: string | null; lastName: string | null } | null
  _count: { participants: number }
}

const statusLabels: Record<string, string> = {
  scheduled: "Rejalashtirilgan", in_progress: "Jarayonda", completed: "Yakunlangan", cancelled: "Bekor qilingan",
}

export default function MeetingsPage() {
  const [data, setData] = useState<Meeting[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await apiClient<PaginatedResponse<Meeting>>("/meetings", { params: { page, limit: 20, search } })
      setData(res.data); setTotal(res.total)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { fetchData() }, [fetchData])

  const columns = [
    { key: "title", title: "Sarlavha", render: (m: Meeting) => <span className="font-medium">{m.title}</span> },
    { key: "host", title: "Tashkilotchi", render: (m: Meeting) => m.host?.firstName ? `${m.host.firstName} ${m.host.lastName || ""}` : m.host?.email || "—" },
    { key: "scheduledAt", title: "Sana/Vaqt", render: (m: Meeting) => new Date(m.scheduledAt).toLocaleString("uz-UZ") },
    { key: "duration", title: "Davomiyligi", render: (m: Meeting) => m.duration ? `${m.duration} daq.` : "—" },
    { key: "participants", title: "Ishtirokchilar", render: (m: Meeting) => m._count?.participants || 0 },
    { key: "status", title: "Holat", render: (m: Meeting) => <Badge variant={m.status === "completed" ? "secondary" : "default"}>{statusLabels[m.status] || m.status}</Badge> },
  ]

  return (
    <DataTable
      title="Uchrashuvlar" description="Uchrashuvlarni rejalashtirish va kuzatish"
      columns={columns} data={data} total={total} page={page} limit={20}
      loading={loading} error={error} searchPlaceholder="Uchrashuv qidirish..."
      onPageChange={setPage} onSearch={setSearch}
    />
  )
}
