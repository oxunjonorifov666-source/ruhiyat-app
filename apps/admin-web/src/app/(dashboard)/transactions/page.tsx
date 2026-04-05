"use client"

import { useEffect, useState, useCallback } from "react"
import { ArrowLeftRight } from "lucide-react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"

interface Transaction {
  id: number
  type: string
  amount: number
  currency: string
  status: string | null
  description: string | null
  createdAt: string
  user: { id: number; email: string | null; firstName: string | null; lastName: string | null }
}

const typeLabels: Record<string, string> = {
  PAYMENT: "To'lov",
  REFUND: "Qaytarish",
  WITHDRAWAL: "Yechish",
  DEPOSIT: "Kiritish",
  TRANSFER: "O'tkazma",
}

export default function TransactionsPage() {
  const [data, setData] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await apiClient<PaginatedResponse<Transaction>>("/transactions", { params: { page, limit: 20, search } })
      setData(res.data); setTotal(res.total)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { fetchData() }, [fetchData])

  const columns = [
    {
      key: "user", title: "Foydalanuvchi",
      render: (t: Transaction) => (
        <span className="font-medium">
          {t.user?.firstName ? `${t.user.firstName} ${t.user.lastName || ""}` : t.user?.email || `#${t.user?.id}`}
        </span>
      ),
    },
    {
      key: "type", title: "Tur",
      render: (t: Transaction) => <Badge variant="outline">{typeLabels[t.type] || t.type}</Badge>,
    },
    {
      key: "amount", title: "Summa",
      render: (t: Transaction) => <span className="font-mono font-medium">{t.amount?.toLocaleString()} {t.currency || "UZS"}</span>,
    },
    { key: "description", title: "Tavsif", render: (t: Transaction) => <span className="text-sm text-muted-foreground">{t.description || "—"}</span> },
    { key: "createdAt", title: "Sana", render: (t: Transaction) => new Date(t.createdAt).toLocaleDateString("uz-UZ") },
  ]

  return (
    <>
      <PageHeader
        title="Tranzaksiyalar"
        description="Moliyaviy tranzaksiyalar tarixi"
        icon={ArrowLeftRight}
      />

      <DataTable
        columns={columns} data={data} total={total} page={page} limit={20}
        loading={loading} error={error} searchPlaceholder="Tranzaksiya qidirish..."
        onPageChange={setPage} onSearch={setSearch}
      />
    </>
  )
}
