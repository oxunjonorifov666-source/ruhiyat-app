"use client"

import { useEffect, useState, useCallback } from "react"
import { CreditCard, DollarSign, ArrowLeftRight, TrendingUp } from "lucide-react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/page-header"
import { StatsCard, StatsGrid } from "@/components/stats-card"
import { Badge } from "@/components/ui/badge"
import { useApiData } from "@/hooks/use-api-data"

interface Payment {
  id: number
  amount: number
  currency: string
  status: string
  paymentMethod: string | null
  description: string | null
  createdAt: string
  user: { id: number; email: string | null; firstName: string | null; lastName: string | null }
}

interface FinanceStats {
  totalRevenue: number
  totalTransactions: number
  completedPayments: number
  pendingPayments: number
}

const statusLabels: Record<string, string> = {
  pending: "Kutilmoqda",
  completed: "Muvaffaqiyatli",
  PENDING: "Kutilmoqda",
  COMPLETED: "Muvaffaqiyatli",
  failed: "Xatolik",
  FAILED: "Xatolik",
  refunded: "Qaytarilgan",
  REFUNDED: "Qaytarilgan",
}

export default function PaymentsPage() {
  const [data, setData] = useState<Payment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { data: stats, loading: statsLoading } = useApiData<FinanceStats>({
    path: "/finance/stats",
  })

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
    {
      key: "user", title: "Foydalanuvchi",
      render: (p: Payment) => (
        <div>
          <span className="font-medium">
            {p.user?.firstName ? `${p.user.firstName} ${p.user.lastName || ""}` : p.user?.email || `#${p.user?.id}`}
          </span>
        </div>
      ),
    },
    { key: "amount", title: "Summa", render: (p: Payment) => <span className="font-mono font-medium">{p.amount?.toLocaleString()} {p.currency || "UZS"}</span> },
    { key: "paymentMethod", title: "Usul", render: (p: Payment) => p.paymentMethod || "—" },
    { key: "description", title: "Tavsif", render: (p: Payment) => <span className="text-sm text-muted-foreground">{p.description || "—"}</span> },
    {
      key: "status", title: "Holat",
      render: (p: Payment) => {
        const s = p.status?.toUpperCase()
        return (
          <Badge variant={s === "COMPLETED" ? "default" : s === "FAILED" ? "destructive" : "secondary"}>
            {statusLabels[p.status] || p.status}
          </Badge>
        )
      },
    },
    { key: "createdAt", title: "Sana", render: (p: Payment) => new Date(p.createdAt).toLocaleDateString("uz-UZ") },
  ]

  return (
    <>
      <PageHeader
        title="To'lovlar"
        description="To'lovlarni kuzatish va boshqarish"
        icon={CreditCard}
      />

      {statsLoading ? (
        <StatsGrid columns={4}>
          {Array.from({ length: 4 }).map((_, i) => (
            <StatsCard key={i} title="" value="" icon={CreditCard} loading />
          ))}
        </StatsGrid>
      ) : stats ? (
        <StatsGrid columns={4}>
          <StatsCard title="Jami daromad" value={`${(stats.totalRevenue || 0).toLocaleString()} UZS`} icon={DollarSign} iconColor="bg-emerald-500/10 text-emerald-600" />
          <StatsCard title="Jami tranzaksiyalar" value={stats.totalTransactions || 0} icon={ArrowLeftRight} iconColor="bg-blue-500/10 text-blue-600" />
          <StatsCard title="Muvaffaqiyatli" value={stats.completedPayments || 0} icon={TrendingUp} iconColor="bg-green-500/10 text-green-600" />
          <StatsCard title="Kutilayotgan" value={stats.pendingPayments || 0} icon={CreditCard} iconColor="bg-yellow-500/10 text-yellow-600" />
        </StatsGrid>
      ) : null}

      <div className="mt-6">
        <DataTable
          columns={columns} data={data} total={total} page={page} limit={20}
          loading={loading} error={error} searchPlaceholder="To'lov qidirish..."
          onPageChange={setPage} onSearch={setSearch}
        />
      </div>
    </>
  )
}
