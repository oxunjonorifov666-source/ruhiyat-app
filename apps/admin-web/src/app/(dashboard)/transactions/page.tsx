"use client"

import { useEffect, useState, useCallback } from "react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"

interface Transaction {
  id: number; type: string; amount: number; currency: string; description: string | null; createdAt: string
  user: { id: number; email: string | null; firstName: string | null; lastName: string | null }
}

export default function TransactionsPage() {
  const [data, setData] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await apiClient<PaginatedResponse<Transaction>>("/transactions", { params: { page, limit: 20 } })
      setData(res.data); setTotal(res.total)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [page])

  useEffect(() => { fetchData() }, [fetchData])

  const columns = [
    { key: "user", title: "Foydalanuvchi", render: (t: Transaction) => t.user?.firstName ? `${t.user.firstName} ${t.user.lastName || ""}` : t.user?.email || `#${t.user?.id}` },
    { key: "type", title: "Tur", render: (t: Transaction) => <Badge variant="outline">{t.type}</Badge> },
    { key: "amount", title: "Summa", render: (t: Transaction) => `${t.amount?.toLocaleString()} ${t.currency || "UZS"}` },
    { key: "description", title: "Tavsif", render: (t: Transaction) => <span className="text-sm text-muted-foreground">{t.description || "—"}</span> },
    { key: "createdAt", title: "Sana", render: (t: Transaction) => new Date(t.createdAt).toLocaleDateString("uz-UZ") },
  ]

  return (
    <DataTable
      title="Tranzaksiyalar" description="Moliyaviy tranzaksiyalar"
      columns={columns} data={data} total={total} page={page} limit={20}
      loading={loading} error={error} searchPlaceholder="Qidirish..."
      onPageChange={setPage} onSearch={() => {}}
    />
  )
}
