"use client"

import { useEffect, useState, useCallback } from "react"
import { apiClient } from "@/lib/api-client"
import { StatsGrid, StatsCard } from "@/components/stats-card"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TrendingUp, DollarSign, CreditCard, ArrowUpDown, BarChart3, PieChart as PieChartIcon, Loader2, Download, Filter, X, FileSpreadsheet, FileText } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts"
import * as XLSX from "xlsx"
import { exportFinanceStatisticsPdf } from "@/lib/export-utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface FinanceStats {
  totalPayments: number
  completedPayments: number
  failedPayments: number
  refundedPayments: number
  totalTransactions: number
  totalRevenue: number
  monthlyRevenue: number
  lastMonthRevenue: number
}

interface MonthlyData {
  month: string
  revenue: number
  payments: number
  refunds: number
}

interface TypeData {
  type: string
  count: number
  total: number
}

const PIE_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 76%, 36%)",
  "hsl(262, 83%, 58%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
]

const typeLabels: Record<string, string> = {
  PAYMENT: "To'lov",
  REFUND: "Qaytarish",
  COMMISSION: "Komissiya",
  SUBSCRIPTION: "Obuna",
  PAYOUT: "Chiqim",
}

function formatMoney(amount: number, currency = "UZS") {
  return `${amount.toLocaleString("uz-UZ")} ${currency}`
}

function exportFinanceExcel(stats: FinanceStats, monthlyData: MonthlyData[], typeData: TypeData[]) {
  const wb = XLSX.utils.book_new()
  const summary = [
    { Ko_rsatkich: "Umumiy daromad", Qiymat: stats.totalRevenue },
    { Ko_rsatkich: "Oylik daromad", Qiymat: stats.monthlyRevenue },
    { Ko_rsatkich: "To'lovlar soni", Qiymat: stats.totalPayments },
    { Ko_rsatkich: "Muvaffaqiyatli", Qiymat: stats.completedPayments },
    { Ko_rsatkich: "Xatoliklar", Qiymat: stats.failedPayments },
    { Ko_rsatkich: "Qaytarilgan", Qiymat: stats.refundedPayments },
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), "Xulosa")
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      monthlyData.map((m) => ({
        Oy: m.month,
        Daromad: m.revenue,
        Tolovlar: m.payments,
        Qaytarishlar: m.refunds,
      })),
    ),
    "Oylar",
  )
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      typeData.map((t) => ({
        Tur: typeLabels[t.type] || t.type,
        Soni: t.count,
        Jami: t.total,
      })),
    ),
    "Tranzaksiya_turlari",
  )
  XLSX.writeFile(wb, `moliya_statistika_${new Date().toISOString().split("T")[0]}.xlsx`)
}

function exportStatsCSV(stats: FinanceStats, monthlyData: MonthlyData[], typeData: TypeData[]) {
  const lines: string[] = []
  lines.push('"Ko\'rsatkich","Qiymat"')
  lines.push(`"Umumiy daromad","${stats.totalRevenue}"`)
  lines.push(`"Oylik daromad","${stats.monthlyRevenue}"`)
  lines.push(`"To'lovlar soni","${stats.totalPayments}"`)
  lines.push(`"Muvaffaqiyatli","${stats.completedPayments}"`)
  lines.push(`"Xatoliklar","${stats.failedPayments}"`)
  lines.push(`"Qaytarilgan","${stats.refundedPayments}"`)
  lines.push("")
  lines.push('"Oy","Daromad","To\'lovlar","Qaytarishlar"')
  monthlyData.forEach(m => lines.push(`"${m.month}","${m.revenue}","${m.payments}","${m.refunds}"`))
  lines.push("")
  lines.push('"Tur","Soni","Jami"')
  typeData.forEach(t => lines.push(`"${typeLabels[t.type] || t.type}","${t.count}","${t.total}"`))
  const csv = lines.join("\n")
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = `moliya_statistika_${new Date().toISOString().split("T")[0]}.csv`
  link.click()
}

export default function FinanceStatisticsPage() {
  const [stats, setStats] = useState<FinanceStats | null>(null)
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [typeData, setTypeData] = useState<TypeData[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number | undefined> = {}
      if (filterDateFrom) params.dateFrom = filterDateFrom
      if (filterDateTo) params.dateTo = filterDateTo
      const [s, m, t] = await Promise.all([
        apiClient<FinanceStats>("/finance/stats", { params }),
        apiClient<MonthlyData[]>("/finance/monthly-revenue", { params }),
        apiClient<TypeData[]>("/finance/transactions-by-type", { params }),
      ])
      setStats(s)
      setMonthlyData(m)
      setTypeData(t)
    } catch {}
    finally { setLoading(false) }
  }, [filterDateFrom, filterDateTo])

  const clearFilters = () => { setFilterDateFrom(""); setFilterDateTo("") }
  const hasFilters = filterDateFrom || filterDateTo

  useEffect(() => { fetchAll() }, [fetchAll])

  const revenueGrowth = stats && stats.lastMonthRevenue > 0
    ? Math.round(((stats.monthlyRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100)
    : 0

  const avgPayment = stats && stats.completedPayments > 0
    ? Math.round(stats.totalRevenue / stats.completedPayments)
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Moliya statistikasi"
        description="Moliyaviy ko'rsatkichlar va tahlillar"
        icon={TrendingUp}
        actions={[
          {
            element: (
              <DropdownMenu key="export-dd">
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" className="gap-2">
                    <Download className="size-4" />
                    Eksport
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer"
                    onClick={() =>
                      stats && exportFinanceExcel(stats, monthlyData, typeData)
                    }
                  >
                    <FileSpreadsheet className="size-4 text-emerald-600" />
                    Excel (.xlsx)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer"
                    onClick={() => {
                      if (!stats) return
                      const kpis: [string, string][] = [
                        ["Umumiy daromad", String(stats.totalRevenue)],
                        ["Oylik daromad", String(stats.monthlyRevenue)],
                        ["To'lovlar soni", String(stats.totalPayments)],
                        ["Muvaffaqiyatli", String(stats.completedPayments)],
                        ["Xatoliklar", String(stats.failedPayments)],
                        ["Qaytarilgan", String(stats.refundedPayments)],
                      ]
                      exportFinanceStatisticsPdf(
                        kpis,
                        monthlyData,
                        `moliya_statistika_${new Date().toISOString().split("T")[0]}`,
                      )
                    }}
                  >
                    <FileText className="size-4 text-rose-600" />
                    PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer"
                    onClick={() =>
                      stats && exportStatsCSV(stats, monthlyData, typeData)
                    }
                  >
                    <Download className="size-4 text-slate-600" />
                    CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
          {
            label: showFilters ? "Filtrni yopish" : "Filtr",
            icon: showFilters ? X : Filter,
            variant: "outline",
            onClick: () => setShowFilters(!showFilters),
          },
        ]}
      />

      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Boshlanish sanasi</label>
                <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="w-[160px]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Tugash sanasi</label>
                <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="w-[160px]" />
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
            icon={BarChart3}
            iconColor="bg-blue-500/10 text-blue-600"
            trend={revenueGrowth !== 0 ? { value: revenueGrowth, label: "o'tgan oyga nisbatan" } : undefined}
          />
          <StatsCard
            title="To'lovlar soni"
            value={stats.totalPayments}
            icon={CreditCard}
            iconColor="bg-violet-500/10 text-violet-600"
            description={`${stats.completedPayments} ta muvaffaqiyatli`}
          />
          <StatsCard
            title="O'rtacha check"
            value={formatMoney(avgPayment)}
            icon={ArrowUpDown}
            iconColor="bg-amber-500/10 text-amber-600"
          />
        </StatsGrid>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daromad dinamikasi</CardTitle>
            <CardDescription>Oxirgi 12 oy</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      formatMoney(value),
                      name === "revenue" ? "Daromad" : name === "payments" ? "To'lovlar" : "Qaytarishlar"
                    ]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                  />
                  <Legend formatter={(value) => value === "revenue" ? "Daromad" : value === "payments" ? "To'lovlar soni" : "Qaytarishlar"} />
                  <Bar dataKey="revenue" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} name="revenue" />
                  <Bar dataKey="refunds" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} name="refunds" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed bg-muted/30">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="mx-auto size-10 mb-3 opacity-40" />
                  <p className="text-sm">Ma'lumot mavjud emas</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tranzaksiya turlari taqsimoti</CardTitle>
            <CardDescription>Kategoriya bo'yicha</CardDescription>
          </CardHeader>
          <CardContent>
            {typeData.length > 0 ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={typeData.map(t => ({ name: typeLabels[t.type] || t.type, value: t.count }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {typeData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [value, name]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {typeData.map((t, i) => (
                    <div key={t.type} className="flex items-center gap-1.5 text-xs">
                      <div className="size-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span>{typeLabels[t.type] || t.type}: {t.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed bg-muted/30">
                <div className="text-center text-muted-foreground">
                  <PieChartIcon className="mx-auto size-10 mb-3 opacity-40" />
                  <p className="text-sm">Ma'lumot mavjud emas</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <div className="text-center space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Muvaffaqiyat darajasi</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {stats.totalPayments > 0 ? Math.round((stats.completedPayments / stats.totalPayments) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">{stats.completedPayments} / {stats.totalPayments} to'lov</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-center space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Xatolik darajasi</p>
                <p className="text-3xl font-bold text-red-600">
                  {stats.totalPayments > 0 ? Math.round((stats.failedPayments / stats.totalPayments) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">{stats.failedPayments} ta xatolik</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-center space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Qaytarish darajasi</p>
                <p className="text-3xl font-bold text-amber-600">
                  {stats.totalPayments > 0 ? Math.round((stats.refundedPayments / stats.totalPayments) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">{stats.refundedPayments} ta qaytarish</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
