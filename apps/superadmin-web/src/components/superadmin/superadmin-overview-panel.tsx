"use client"

import { useCallback, useState, useEffect } from "react"
import {
  Users,
  Activity,
  CalendarCheck,
  Banknote,
  UserPlus,
  TrendingUp,
  RefreshCw,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { StatsGrid, StatsCard } from "@/components/stats-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ComposedChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  Line,
  LineChart,
} from "recharts"
import {
  exportSuperadminOverviewExcel,
  exportSuperadminOverviewPdf,
  type SuperadminOverviewExportRow,
} from "@/lib/export-utils"

export interface OverviewApiResponse {
  range: { from: string; to: string }
  granularity: "day" | "week" | "month"
  activeUsersWindowDays: number
  kpis: {
    totalUsers: number
    activeUsers: number
    sessions: number
    completedSessions: number
    revenue: number
    newRegistrations: number
  }
  trends: {
    sessions: number
    revenue: number
    newUsers: number
  }
  usersByRole: { role: string; label: string; count: number }[]
  series: {
    key: string
    label: string
    newUsers: number
    sessions: number
    revenue: number
  }[]
}

const PIE_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 76%, 36%)",
  "hsl(262, 83%, 58%)",
  "hsl(38, 92%, 50%)",
]

function formatMoney(n: number) {
  return new Intl.NumberFormat("uz-UZ", {
    style: "currency",
    currency: "UZS",
    maximumFractionDigits: 0,
  }).format(n)
}

export function SuperadminOverviewPanel() {
  const [filterFrom, setFilterFrom] = useState("")
  const [filterTo, setFilterTo] = useState("")
  const [granularity, setGranularity] = useState<"day" | "week" | "month">("day")
  const [activePreset, setActivePreset] = useState<string | null>("30days")
  const [data, setData] = useState<OverviewApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setPresetRange = useCallback((preset: "today" | "7days" | "30days" | "month" | "year") => {
    setActivePreset(preset)
    const end = new Date()
    const start = new Date()
    switch (preset) {
      case "today":
        start.setHours(0, 0, 0, 0)
        break
      case "7days":
        start.setDate(end.getDate() - 6)
        start.setHours(0, 0, 0, 0)
        break
      case "30days":
        start.setDate(end.getDate() - 29)
        start.setHours(0, 0, 0, 0)
        break
      case "month":
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        break
      case "year":
        start.setMonth(0, 1)
        start.setHours(0, 0, 0, 0)
        break
    }
    setFilterFrom(start.toISOString().split("T")[0])
    setFilterTo(end.toISOString().split("T")[0])
  }, [])

  useEffect(() => {
    setPresetRange("30days")
  }, [setPresetRange])

  const fetchOverview = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      setError(null)
      try {
        const params: Record<string, string | undefined> = {
          granularity,
        }
        if (filterFrom) params.dateFrom = filterFrom
        if (filterTo) params.dateTo = filterTo
        const res = await apiClient<OverviewApiResponse>("/dashboard/superadmin/overview", { params })
        setData(res)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Xatolik"
        setError(msg)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [filterFrom, filterTo, granularity],
  )

  useEffect(() => {
    if (!filterFrom || !filterTo) return
    fetchOverview()
  }, [fetchOverview, filterFrom, filterTo])

  useEffect(() => {
    const t = setInterval(() => {
      if (filterFrom && filterTo) fetchOverview(true)
    }, 60000)
    return () => clearInterval(t)
  }, [fetchOverview, filterFrom, filterTo])

  const clearFilters = () => {
    setActivePreset(null)
    setFilterFrom("")
    setFilterTo("")
  }

  const exportRows: SuperadminOverviewExportRow[] =
    data?.series.map((s) => ({
      label: s.label,
      newUsers: s.newUsers,
      sessions: s.sessions,
      revenue: s.revenue,
    })) || []

  const handleExcel = () => {
    if (!data) return
    const kpis: Record<string, string | number> = {
      "Jami foydalanuvchilar": data.kpis.totalUsers,
      [`Aktiv (oxirgi ${data.activeUsersWindowDays} kun)`]: data.kpis.activeUsers,
      "Tanlangan davr seanslari": data.kpis.sessions,
      "Yakunlangan seanslar": data.kpis.completedSessions,
      "Daromad (tanlangan davr)": data.kpis.revenue,
      "Yangi ro'yxatdan o'tganlar": data.kpis.newRegistrations,
    }
    exportSuperadminOverviewExcel(
      kpis,
      exportRows,
      `Ruhiyat_dashboard_${new Date().toISOString().split("T")[0]}`,
    )
  }

  const handlePdf = () => {
    if (!data) return
    const kpis: [string, string][] = [
      ["Jami foydalanuvchilar", String(data.kpis.totalUsers)],
      [`Aktiv (oxirgi ${data.activeUsersWindowDays} kun)`, String(data.kpis.activeUsers)],
      ["Seanslar (davr)", String(data.kpis.sessions)],
      ["Yakunlangan seanslar", String(data.kpis.completedSessions)],
      ["Daromad (UZS)", String(data.kpis.revenue)],
      ["Yangi ro'yxatdan o'tishlar", String(data.kpis.newRegistrations)],
    ]
    exportSuperadminOverviewPdf(
      "Ruhiyat — Superadmin dashboard",
      kpis,
      exportRows,
      `Ruhiyat_dashboard_${new Date().toISOString().split("T")[0]}`,
    )
  }

  const chartData = data?.series || []

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm bg-muted/30 backdrop-blur-sm">
        <CardContent className="p-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "today", label: "Bugun" },
                { id: "7days", label: "7 kun" },
                { id: "30days", label: "30 kun" },
                { id: "month", label: "Shu oy" },
                { id: "year", label: "Shu yil" },
              ] as const
            ).map((p) => (
              <Button
                key={p.id}
                variant={activePreset === p.id ? "default" : "outline"}
                size="sm"
                className="h-8 rounded-full text-xs"
                onClick={() => setPresetRange(p.id)}
              >
                {p.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={granularity}
              onValueChange={(v) => setGranularity(v as "day" | "week" | "month")}
            >
              <SelectTrigger className="h-8 w-[140px] rounded-full text-xs">
                <SelectValue placeholder="Grafik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Kunlik</SelectItem>
                <SelectItem value="week">Haftalik</SelectItem>
                <SelectItem value="month">Oylik</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                className="h-8 w-[138px] pl-8 text-xs rounded-full"
                value={filterFrom}
                onChange={(e) => {
                  setFilterFrom(e.target.value)
                  setActivePreset(null)
                }}
              />
            </div>
            <span className="text-muted-foreground text-xs">—</span>
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                className="h-8 w-[138px] pl-8 text-xs rounded-full"
                value={filterTo}
                onChange={(e) => {
                  setFilterTo(e.target.value)
                  setActivePreset(null)
                }}
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={clearFilters}
              title="Tozalash"
            >
              <X className="size-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-full gap-1"
              onClick={() => fetchOverview(true)}
              disabled={refreshing || loading}
            >
              {refreshing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              Yangilash
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-8 rounded-full gap-1 bg-gradient-to-r from-primary to-primary/85">
                  <Download className="size-3.5" />
                  Eksport
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExcel} className="gap-2 cursor-pointer">
                  <FileSpreadsheet className="size-4 text-emerald-600" />
                  Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePdf} className="gap-2 cursor-pointer">
                  <FileText className="size-4 text-rose-600" />
                  PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <StatsGrid columns={4}>
        <StatsCard
          title="Jami foydalanuvchilar"
          value={data?.kpis.totalUsers ?? 0}
          icon={Users}
          iconColor="bg-blue-500/10 text-blue-600"
          loading={loading}
        />
        <StatsCard
          title={`Aktiv foydalanuvchilar (${data?.activeUsersWindowDays ?? 30} kun)`}
          value={data?.kpis.activeUsers ?? 0}
          description="Oxirgi muddatda tizimga kirganlar"
          icon={Activity}
          iconColor="bg-violet-500/10 text-violet-600"
          loading={loading}
        />
        <StatsCard
          title="Seanslar (tanlangan davr)"
          value={data?.kpis.sessions ?? 0}
          description={`Yakunlangan: ${data?.kpis.completedSessions ?? 0}`}
          icon={CalendarCheck}
          trend={
            data
              ? { value: data.trends.sessions, label: "oldingi davrga nisbatan" }
              : undefined
          }
          iconColor="bg-sky-500/10 text-sky-600"
          loading={loading}
        />
        <StatsCard
          title="Daromad (tanlangan davr)"
          value={data ? formatMoney(data.kpis.revenue) : "—"}
          icon={Banknote}
          trend={
            data ? { value: data.trends.revenue, label: "oldingi davrga nisbatan" } : undefined
          }
          iconColor="bg-emerald-500/10 text-emerald-600"
          loading={loading}
        />
      </StatsGrid>

      <StatsGrid columns={3}>
        <StatsCard
          title="Yangi ro'yxatdan o'tishlar"
          value={data?.kpis.newRegistrations ?? 0}
          icon={UserPlus}
          trend={
            data ? { value: data.trends.newUsers, label: "oldingi davrga nisbatan" } : undefined
          }
          iconColor="bg-amber-500/10 text-amber-600"
          loading={loading}
        />
        <StatsCard
          title="Ma'lumotlar yangilanishi"
          value="~1 min"
          description="Avtomatik yangilanish oralig'i"
          icon={TrendingUp}
          iconColor="bg-teal-500/10 text-teal-600"
          loading={loading}
        />
        <Card className="overflow-hidden border-dashed">
          <CardContent className="p-5 flex flex-col justify-center h-full min-h-[120px]">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Tanlangan davr
            </p>
            {loading ? (
              <Skeleton className="h-8 w-48 mt-2" />
            ) : (
              <p className="text-sm font-semibold mt-2">
                {filterFrom && filterTo
                  ? `${filterFrom} — ${filterTo}`
                  : "—"}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Grafik:{" "}
              {granularity === "day"
                ? "kunlik"
                : granularity === "week"
                  ? "haftalik"
                  : "oylik"}{" "}
              bo'linmalar
            </p>
          </CardContent>
        </Card>
      </StatsGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden shadow-sm">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-base">Seanslar va daromad</CardTitle>
            <CardDescription>Tanlangan davr va grafik zichligi bo'yicha</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <Skeleton className="h-[320px] w-full rounded-xl" />
            ) : chartData.length === 0 ? (
              <div className="flex h-[320px] items-center justify-center text-muted-foreground text-sm">
                Tanlangan filtr uchun ma'lumot yo'q
              </div>
            ) : (
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 11 }}
                      allowDecimals={false}
                      label={{ value: "Seanslar", angle: -90, position: "insideLeft", fontSize: 10 }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) =>
                        v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${Math.round(v / 1000)}k`
                      }
                      label={{ value: "Daromad (so'm)", angle: 90, position: "insideRight", fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--card))",
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === "Daromad") return [formatMoney(value), name]
                        if (name === "Seanslar") return [value, name]
                        return [value, name]
                      }}
                    />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="sessions"
                      name="Seanslar"
                      fill="hsl(221, 83%, 53%)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={48}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      name="Daromad"
                      fill="hsl(142, 76%, 36%, 0.15)"
                      stroke="hsl(142, 76%, 36%)"
                      strokeWidth={2}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-base">Rollar bo'yicha</CardTitle>
            <CardDescription>Foydalanuvchilar taqsimoti</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <Skeleton className="h-[260px] w-full rounded-xl" />
            ) : !data?.usersByRole?.length ? (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                Ma'lumot yo'q
              </div>
            ) : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.usersByRole.map((u) => ({ name: u.label, value: u.count }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {data.usersByRole.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-base">Yangi ro'yxatdan o'tishlar</CardTitle>
          <CardDescription>Tanlangan davr bo'yicha dinamika</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <Skeleton className="h-[260px] w-full rounded-xl" />
          ) : chartData.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-muted-foreground text-sm">
              Ma'lumot yo'q
            </div>
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="newUsers"
                    name="Yangi foydalanuvchilar"
                    stroke="hsl(262, 83%, 58%)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
