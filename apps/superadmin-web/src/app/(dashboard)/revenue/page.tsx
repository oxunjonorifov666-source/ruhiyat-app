"use client"

import { useEffect, useState, useCallback } from "react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { StatsGrid, StatsCard } from "@/components/stats-card"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, BarChart3, Calendar, Download, Filter, X } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface RevenueRecord {
  id: number
  centerId: number | null
  source: string
  amount: number
  currency: string
  period: string | null
  description: string | null
  createdAt: string
}

interface MonthlyData {
  month: string
  revenue: number
  payments: number
  refunds: number
}

interface FinanceStats {
  totalRevenue: number
  monthlyRevenue: number
  lastMonthRevenue: number
  totalPayments: number
  completedPayments: number
}

function formatMoney(amount: number, currency = "UZS") {
  return `${amount.toLocaleString("uz-UZ")} ${currency}`
}

const sourceLabels: Record<string, string> = {
  subscription: "Obuna",
  session: "Seans",
  course: "Kurs",
  consultation: "Konsultatsiya",
  other: "Boshqa",
}

function exportCSV(data: RevenueRecord[]) {
  const headers = ["ID", "Manba", "Summa", "Valyuta", "Davr", "Tavsif", "Sana"]
  const rows = data.map(r => [
    r.id,
    sourceLabels[r.source] || r.source,
    r.amount,
    r.currency,
    r.period || "",
    r.description || "",
    new Date(r.createdAt).toLocaleDateString("uz-UZ"),
  ])
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n")
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = `daromadlar_${new Date().toISOString().split("T")[0]}.csv`
  link.click()
}

export default function RevenuePage() {
  const [data, setData] = useState<RevenueRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<FinanceStats | null>(null)
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])

  const [filterSource, setFilterSource] = useState("")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string | number | undefined> = { page, limit: 20 }
      if (filterSource) params.source = filterSource
      if (filterDateFrom) params.dateFrom = filterDateFrom
      if (filterDateTo) params.dateTo = filterDateTo
      const res = await apiClient<PaginatedResponse<RevenueRecord>>("/revenue", { params })
      setData(res.data)
      setTotal(res.total)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, filterSource, filterDateFrom, filterDateTo])

  const fetchStats = useCallback(async () => {
    try {
      const [s, m] = await Promise.all([
        apiClient<FinanceStats>("/finance/stats"),
        apiClient<MonthlyData[]>("/finance/monthly-revenue"),
      ])
      setStats(s)
      setMonthlyData(m)
    } catch {}
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchStats() }, [fetchStats])

  const clearFilters = () => {
    setFilterSource("")
    setFilterDateFrom("")
    setFilterDateTo("")
    setPage(1)
  }

  const hasFilters = filterSource || filterDateFrom || filterDateTo

  const revenueGrowth = stats && stats.lastMonthRevenue > 0
    ? Math.round(((stats.monthlyRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100)
    : 0

  const columns = [
    {
      key: "source",
      title: "Manba",
      render: (r: RevenueRecord) => <Badge variant="outline">{sourceLabels[r.source] || r.source}</Badge>,
    },
    {
      key: "amount",
      title: "Summa",
      render: (r: RevenueRecord) => <span className="font-medium">{formatMoney(r.amount, r.currency)}</span>,
    },
    {
      key: "period",
      title: "Davr",
      render: (r: RevenueRecord) => r.period || "—",
    },
    {
      key: "description",
      title: "Tavsif",
      render: (r: RevenueRecord) => <span className="text-sm text-muted-foreground">{r.description || "—"}</span>,
    },
    {
      key: "createdAt",
      title: "Sana",
      render: (r: RevenueRecord) => new Date(r.createdAt).toLocaleDateString("uz-UZ"),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daromadlar"
        description="Platformaning daromad ko'rsatkichlari va tahlili"
        icon={DollarSign}
        actions={[
          { label: "CSV yuklash", icon: Download, variant: "outline", onClick: () => exportCSV(data) },
          { label: showFilters ? "Filtrni yopish" : "Filtr", icon: showFilters ? X : Filter, variant: "outline", onClick: () => setShowFilters(!showFilters) },
        ]}
      />

      {stats && (
        <StatsGrid columns={4}>
          <StatsCard
            title="Umumiy daromad"
            value={formatMoney(stats.totalRevenue)}
            icon={DollarSign}
            iconColor="bg-emerald-500/10 text-emerald-600"
          />
          <StatsCard
            title="Oylik daromad"
            value={formatMoney(stats.monthlyRevenue)}
            icon={TrendingUp}
            iconColor="bg-blue-500/10 text-blue-600"
            trend={revenueGrowth !== 0 ? { value: revenueGrowth, label: "o'tgan oyga nisbatan" } : undefined}
          />
          <StatsCard
            title="O'tgan oy"
            value={formatMoney(stats.lastMonthRevenue)}
            icon={Calendar}
            iconColor="bg-violet-500/10 text-violet-600"
          />
          <StatsCard
            title="Muvaffaqiyatli to'lovlar"
            value={stats.completedPayments}
            icon={BarChart3}
            iconColor="bg-amber-500/10 text-amber-600"
          />
        </StatsGrid>
      )}

      {monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daromad dinamikasi</CardTitle>
            <CardDescription>Oxirgi 12 oy</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11 }} />
                <YAxis className="text-xs" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatMoney(value),
                    name === "revenue" ? "Daromad" : name === "payments" ? "To'lovlar" : "Qaytarishlar"
                  ]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                />
                <Legend formatter={(value) => value === "revenue" ? "Daromad" : value === "payments" ? "To'lovlar" : "Qaytarishlar"} />
                <Bar dataKey="revenue" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} name="revenue" />
                <Bar dataKey="payments" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} name="payments" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Manba</label>
                <Select value={filterSource} onValueChange={(v) => { setFilterSource(v === "all" ? "" : v); setPage(1) }}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Barchasi" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    {Object.entries(sourceLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Boshlanish</label>
                <Input type="date" value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1) }} className="w-[160px]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Tugash</label>
                <Input type="date" value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); setPage(1) }} className="w-[160px]" />
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="size-4 mr-1" /> Tozalash
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable
        title=""
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={20}
        loading={loading}
        error={error}
        searchPlaceholder="Daromad qidirish..."
        onPageChange={setPage}
        onSearch={() => {}}
      />
    </div>
  )
}
