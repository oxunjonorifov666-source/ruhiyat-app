"use client"

import { useEffect, useState, useCallback } from "react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"

interface Payment {
  id: number; amount: number; currency: string; status: string; paymentMethod: string | null
  description: string | null; createdAt: string
  user: { id: number; email: string | null; firstName: string | null; lastName: string | null }
}

const statusLabels: Record<string, string> = {
  pending: "Kutilmoqda", completed: "Muvaffaqiyatli", failed: "Xatolik", refunded: "Qaytarilgan",
}

export default function PaymentsPage() {
  const [data, setData] = useState<Payment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await apiClient<PaginatedResponse<Payment>>("/payments", { params: { page, limit: 20, search } })
      setData(res.data); setTotal(res.total)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { fetchData() }, [fetchData])

  const columns = [
    { key: "user", title: "Foydalanuvchi", render: (p: Payment) => p.user?.firstName ? `${p.user.firstName} ${p.user.lastName || ""}` : p.user?.email || `#${p.user?.id}` },
    { key: "amount", title: "Summa", render: (p: Payment) => `${p.amount?.toLocaleString()} ${p.currency || "UZS"}` },
    { key: "paymentMethod", title: "Usul", render: (p: Payment) => p.paymentMethod || "—" },
    { key: "description", title: "Tavsif", render: (p: Payment) => <span className="text-sm text-muted-foreground">{p.description || "—"}</span> },
    { key: "status", title: "Holat", render: (p: Payment) => <Badge variant={p.status === "completed" ? "default" : "secondary"}>{statusLabels[p.status] || p.status}</Badge> },
    { key: "createdAt", title: "Sana", render: (p: Payment) => new Date(p.createdAt).toLocaleDateString("uz-UZ") },
  ]

  return (
    <DataTable
      title="To'lovlar" description="To'lovlarni boshqarish va kuzatish"
      columns={columns} data={data} total={total} page={page} limit={20}
      loading={loading} error={error} searchPlaceholder="To'lov qidirish..."
      onPageChange={setPage} onSearch={setSearch}
    />
  )
}
