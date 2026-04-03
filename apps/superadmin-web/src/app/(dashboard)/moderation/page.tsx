"use client"

import { useEffect, useState, useCallback } from "react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"

interface Complaint {
  id: number; targetType: string; targetId: number; reason: string; description: string | null
  status: string; createdAt: string
  reporter: { id: number; email: string | null; firstName: string | null; lastName: string | null }
  resolver: { firstName: string | null; lastName: string | null } | null
}

const statusLabels: Record<string, string> = {
  PENDING: "Kutilmoqda", REVIEWING: "Ko'rib chiqilmoqda", RESOLVED: "Hal qilingan", DISMISSED: "Rad etilgan",
}
const statusColors: Record<string, string> = {
  PENDING: "destructive", REVIEWING: "default", RESOLVED: "secondary", DISMISSED: "outline",
}

export default function ModerationPage() {
  const [data, setData] = useState<Complaint[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await apiClient<PaginatedResponse<Complaint>>("/complaints", { params: { page, limit: 20 } })
      setData(res.data); setTotal(res.total)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [page])

  useEffect(() => { fetchData() }, [fetchData])

  const columns = [
    { key: "reason", title: "Sabab", render: (c: Complaint) => <span className="font-medium">{c.reason}</span> },
    { key: "description", title: "Tavsif", render: (c: Complaint) => <span className="text-sm text-muted-foreground line-clamp-1">{c.description || "—"}</span> },
    { key: "targetType", title: "Ob'ekt turi", render: (c: Complaint) => <Badge variant="outline">{c.targetType}</Badge> },
    { key: "reporter", title: "Shikoyatchi", render: (c: Complaint) => c.reporter?.firstName ? `${c.reporter.firstName} ${c.reporter.lastName || ""}` : c.reporter?.email || `#${c.reporter?.id}` },
    { key: "status", title: "Holat", render: (c: Complaint) => <Badge variant={statusColors[c.status] as any || "default"}>{statusLabels[c.status] || c.status}</Badge> },
    { key: "createdAt", title: "Sana", render: (c: Complaint) => new Date(c.createdAt).toLocaleDateString("uz-UZ") },
  ]

  return (
    <DataTable
      title="Moderatsiya markazi" description="Shikoyatlar va kontent moderatsiyasi"
      columns={columns} data={data} total={total} page={page} limit={20}
      loading={loading} error={error} searchPlaceholder="Qidirish..."
      onPageChange={setPage} onSearch={() => {}}
    />
  )
}
