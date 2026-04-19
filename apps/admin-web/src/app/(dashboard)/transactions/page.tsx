"use client"

import { useEffect, useState, useCallback } from "react"
import { ArrowLeftRight } from "lucide-react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import type { FilterField } from "@/components/filter-bar"
import { formatEmbeddedApiError, isPermissionDeniedError } from "@/lib/api-error"
import { AccessDeniedPlaceholder } from "@/components/access-denied-placeholder"

interface Transaction {
  id: number
  type: string
  amount: number
  currency: string
  status: string | null
  description: string | null
  createdAt: string
  user: { id: number; email: string | null; firstName: string | null; lastName: string | null }
  psychologist?: { id: number; firstName: string | null; lastName: string | null } | null
  scheduledAt?: string | null
  sessionStatus?: string | null
}

const statusLabels: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PAID: { label: "To'langan", variant: "default" },
  UNPAID: { label: "To'lanmagan", variant: "secondary" },
  REFUNDED: { label: "Qaytarilgan", variant: "outline" },
}

export default function TransactionsPage() {
  const [data, setData] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [filters, setFilters] = useState<{ status: string; dateFrom: string; dateTo: string }>({
    status: "all",
    dateFrom: "",
    dateTo: "",
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    setPermissionDenied(false)
    try {
      const res = await apiClient<PaginatedResponse<Transaction>>("/finance/ledger", {
        params: {
          page,
          limit: 20,
          search,
          status: filters.status === "all" ? undefined : filters.status,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
        }
      })
      setData(res.data)
      setTotal(res.total)
    } catch (e: unknown) {
      setError(formatEmbeddedApiError(e))
      setPermissionDenied(isPermissionDeniedError(e))
    } finally {
      setLoading(false)
    }
  }, [page, search, filters])

  useEffect(() => { fetchData() }, [fetchData])

  const columns = [
    {
      key: "user", title: "Mijoz",
      render: (t: Transaction) => (
        <span className="font-medium">
          {t.user?.firstName ? `${t.user.firstName} ${t.user.lastName || ""}` : t.user?.email || `#${t.user?.id}`}
        </span>
      ),
    },
    {
      key: "description", title: "Turi",
      render: (t: Transaction) => (
        <div className="flex flex-col">
          <span className="font-medium">{t.description || "Seans"}</span>
          {t.psychologist ? (
            <span className="text-xs text-muted-foreground">
              Psixolog: {t.psychologist.firstName || ""} {t.psychologist.lastName || ""}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "amount", title: "Summa",
      render: (t: Transaction) => <span className="font-mono font-medium">{t.amount?.toLocaleString()} {t.currency || "UZS"}</span>,
    },
    {
      key: "status",
      title: "Holat",
      render: (t: Transaction) => {
        const raw = String(t.status || "").toUpperCase()
        const meta = statusLabels[raw] || { label: t.status || "—", variant: "secondary" as const }
        return <Badge variant={meta.variant}>{meta.label}</Badge>
      }
    },
    { key: "createdAt", title: "Yaratilgan", render: (t: Transaction) => new Date(t.createdAt).toLocaleDateString("uz-UZ") },
  ]

  if (permissionDenied) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Tranzaksiyalar"
          description="Psixolog seanslari bo'yicha to'lovlar tarixi (real baza)"
          icon={ArrowLeftRight}
        />
        <AccessDeniedPlaceholder
          title="Moliyaviy jurnalga ruxsat yo'q"
          description="Tranzaksiya / ledger ma'lumotlari finance.read yoki tegishli moliya ruxsatini talab qiladi. Rolingizda bu ruxsat bo'lmasa, bu bo'lim ochilmaydi."
          detail={error}
        />
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Tranzaksiyalar"
        description="Psixolog seanslari bo'yicha to'lovlar tarixi (real baza)"
        icon={ArrowLeftRight}
      />

      <DataTable
        columns={columns} data={data} total={total} page={page} limit={20}
        loading={loading} error={error} searchPlaceholder="Tranzaksiya qidirish..."
        onPageChange={setPage}
        onSearchChange={(q) => { setSearch(q); setPage(1) }}
        filterFields={[
          {
            id: "status",
            placeholder: "Holat",
            options: [
              { value: "PAID", label: "PAID" },
              { value: "UNPAID", label: "UNPAID" },
              { value: "REFUNDED", label: "REFUNDED" },
            ],
          }
        ] as FilterField[]}
        activeFilters={{ status: filters.status }}
        onFilterChange={(id, value) => {
          if (id === "status") setFilters((p) => ({ ...p, status: value }))
          setPage(1)
        }}
        onResetFilters={() => {
          setFilters({ status: "all", dateFrom: "", dateTo: "" })
          setSearch("")
          setPage(1)
        }}
        filters={
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Boshlanish</div>
              <Input type="date" value={filters.dateFrom} onChange={(e) => { setFilters((p) => ({ ...p, dateFrom: e.target.value })); setPage(1) }} />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Tugash</div>
              <Input type="date" value={filters.dateTo} onChange={(e) => { setFilters((p) => ({ ...p, dateTo: e.target.value })); setPage(1) }} />
            </div>
            <div className="flex items-end justify-end">
              <div className="text-xs text-muted-foreground"> </div>
            </div>
          </div>
        }
      />
    </>
  )
}
