"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { 
  BarChart3, Users, TrendingUp, DollarSign, Loader2, Calendar, 
  Filter, X, Activity, Download, FileJson, FileText, PieChart as PieIcon,
  CheckCircle, Video, ClipboardList, CreditCard, RefreshCw, AlertTriangle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { apiClient } from "@/lib/api-client"
import { StatsGrid, StatsCard } from "@/components/stats-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, Cell, PieChart, Pie
} from "recharts"
import { exportToExcel, exportToPDF } from "@/lib/export-utils"

interface UserStats { total: number; active: number; periodNew: number; trend: number }
interface SessionStats { 
  total: number; completed: number; today: number; 
  trend: number; completedTrend: number 
}
interface FinanceStats { 
  totalRevenue: number; completedPayments: number; 
  trend: number; paymentsTrend: number 
}
interface PsychStats { total: number; approved: number; topPerformers: any[] }
interface TestStats { totalResults: number; trend: number; popular: any[] }
interface TrainingStats { active: number; trend: number }
interface MeetingStats { upcoming: number }
interface MonthlyData { month: string; revenue: number; payments: number; refunds: number }

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterFrom, setFilterFrom] = useState("")
  const [filterTo, setFilterTo] = useState("")
  const [activePreset, setActivePreset] = useState<string | null>("month")

  const [data, setData] = useState<{
    users: UserStats | null;
    sessions: SessionStats | null;
    finance: FinanceStats | null;
    psychologists: PsychStats | null;
    tests: TestStats | null;
    trainings: TrainingStats | null;
    meetings: MeetingStats | null;
    demographics: { gender: any[] } | null;
    monthlyData: MonthlyData[];
  }>({
    users: null,
    sessions: null,
    finance: null,
    psychologists: null,
    tests: null,
    trainings: null,
    meetings: null,
    demographics: null,
    monthlyData: [],
  })

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const params = {
        dateFrom: filterFrom || undefined,
        dateTo: filterTo || undefined,
      }

      const res = await apiClient<any>("/analytics/dashboard", { params })

      setData(res)
    } catch (e: any) {
      setError(e.message || "Ma'lumotlarni yuklashda xatolik yuz berdi")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filterFrom, filterTo])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const setPresetRange = (preset: 'today' | '7days' | '30days' | 'month' | 'all') => {
    setActivePreset(preset)
    const end = new Date()
    let start = new Date()
    
    switch (preset) {
      case 'today':
        start.setHours(0, 0, 0, 0)
        break
      case '7days':
        start.setDate(end.getDate() - 7)
        break
      case '30days':
        start.setDate(end.getDate() - 30)
        break
      case 'month':
        start = new Date(end.getFullYear(), end.getMonth(), 1)
        break
      case 'all':
        setFilterFrom("")
        setFilterTo("")
        return
    }
    
    setFilterFrom(start.toISOString().split('T')[0])
    setFilterTo(end.toISOString().split('T')[0])
  }

  const clearFilters = () => {
    setFilterFrom("")
    setFilterTo("")
    setActivePreset(null)
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("uz-UZ", {
      style: "currency",
      currency: "UZS",
      maximumFractionDigits: 0,
    }).format(val)
  }

  const sessionDistribution = useMemo(() => {
    if (!data.sessions) return []
    return [
      { name: "Yakunlangan", value: data.sessions.completed, color: "#10b981" },
      { name: "Boshqa", value: Math.max(0, data.sessions.total - data.sessions.completed), color: "#3b82f6" },
    ].filter(i => i.value > 0)
  }, [data.sessions])

  const genderData = useMemo(() => {
    if (!data.demographics?.gender) return []
    return data.demographics.gender.map((g, i) => ({
      name: g.label,
      value: g.count,
      color: g.label === 'Erkak' ? '#3b82f6' : '#ec4899'
    }))
  }, [data.demographics])

  const handleExportExcel = () => {
    if (!data.monthlyData.length) return
    exportToExcel(data.monthlyData, `Ruhiyat_Analitika_${new Date().toISOString().split('T')[0]}`, 'Oylik_Statistika')
  }

  const handleExportPDF = () => {
    if (!data.monthlyData.length) return
    const headers = ['Oy', 'Tushum', 'To\'lovlar', 'Qaytarishlar']
    const body = data.monthlyData.map(item => [
      item.month, 
      formatCurrency(item.revenue), 
      item.payments.toString(), 
      (item.refunds || 0).toString()
    ])
    exportToPDF(headers, body, `Ruhiyat_Analitika_${new Date().toISOString().split('T')[0]}`, 'Ruhiyat Analitika Hisoboti')
  }

  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Analitika va Hisobotlar"
        description="Platformaning batafsil tahlili, o'sish ko'rsatkichlari va real vaqt statistikasi"
        icon={BarChart3}
        actions={[
          { 
            label: "Yangilash", 
            icon: refreshing ? Loader2 : RefreshCw, 
            variant: "outline", 
            onClick: () => fetchAnalytics(true),
            disabled: refreshing || loading
          },
          {
            element: (
              <DropdownMenu key="export">
                <DropdownMenuTrigger asChild>
                  <Button variant="default" className="gap-2 shadow-sm bg-gradient-to-r from-primary to-primary/80">
                    <Download className="size-4" /> Eksport
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportExcel} className="cursor-pointer">
                    <FileJson className="mr-2 size-4 text-emerald-600" /> Excel (.xlsx)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
                    <FileText className="mr-2 size-4 text-rose-600" /> PDF (.pdf)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )
          }
        ]}
      />

      <Card className="border-none shadow-sm bg-muted/40 overflow-hidden backdrop-blur-md">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'today', label: 'Bugun' },
              { id: '7days', label: '7 kun' },
              { id: '30days', label: '30 kun' },
              { id: 'month', label: 'Shu oy' },
              { id: 'all', label: 'Barchasi' }
            ].map((p) => (
              <Button
                key={p.id}
                variant={activePreset === p.id ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs font-semibold rounded-full"
                onClick={() => setPresetRange(p.id as any)}
              >
                {p.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative group">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input 
                type="date" 
                className="h-8 pl-8 text-xs w-[140px] border-none shadow-none bg-background focus-visible:ring-1 rounded-full" 
                value={filterFrom}
                onChange={(e) => { setFilterFrom(e.target.value); setActivePreset(null); }}
              />
            </div>
            <span className="text-muted-foreground text-xs">—</span>
            <div className="relative group">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input 
                type="date" 
                className="h-8 pl-8 text-xs w-[140px] border-none shadow-none bg-background focus-visible:ring-1 rounded-full" 
                value={filterTo}
                onChange={(e) => { setFilterTo(e.target.value); setActivePreset(null); }}
              />
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={clearFilters}>
              <X className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="size-4 inline mr-2" />
          {error}
        </div>
      )}

      {/* Main Stats */}
      <StatsGrid columns={5}>
        <StatsCard
          title="Foydalanuvchilar"
          value={data.users?.total || 0}
          icon={Users}
          description={`Yangi: +${data.users?.periodNew || 0}`}
          trend={data.users ? { value: data.users.trend, label: "o'sish" } : undefined}
          iconColor="bg-blue-500/10 text-blue-600"
          loading={loading}
        />
        <StatsCard
          title="Psixologlar"
          value={data.psychologists?.total || 0}
          icon={Users}
          description={`${data.psychologists?.approved || 0} tasdiqlangan`}
          iconColor="bg-indigo-500/10 text-indigo-600"
          loading={loading}
        />
        <StatsCard
          title="Bugun seanslar"
          value={data.sessions?.today || 0}
          icon={Calendar}
          description={`Rejalashtirilgan`}
          iconColor="bg-amber-500/10 text-amber-600"
          loading={loading}
        />
        <StatsCard
          title="Test natijalari"
          value={data.tests?.totalResults || 0}
          icon={ClipboardList}
          description={`Yakunlanganlar`}
          trend={data.tests ? { value: data.tests.trend, label: "dinamika" } : undefined}
          iconColor="bg-rose-500/10 text-rose-600"
          loading={loading}
        />
        <StatsCard
          title="Umumiy tushum"
          value={formatCurrency(data.finance?.totalRevenue || 0)}
          icon={DollarSign}
          description={`Davr uchun`}
          trend={data.finance ? { value: data.finance.trend, label: "o'zgarish" } : undefined}
          iconColor="bg-emerald-500/20 text-emerald-700"
          loading={loading}
        />
      </StatsGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Flow */}
        <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 px-6 py-4">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold">Moliyaviy dinamika</CardTitle>
              <CardDescription className="text-xs">Oxirgi 12 oylik tushum va to'lovlar tahlili</CardDescription>
            </div>
            <div className="bg-emerald-500/10 p-2 rounded-xl">
              <TrendingUp className="size-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <Skeleton className="h-[300px] w-full rounded-xl" />
            ) : (
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.monthlyData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" className="text-[10px]" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                    <YAxis className="text-[10px]" axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} tick={{ fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      formatter={(val: number) => [formatCurrency(val), "Tushum"]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fill="url(#colorRevenue)" activeDot={{ r: 6, strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Demographics */}
        <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 px-6 py-4">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold">Foydalanuvchi demografiyasi</CardTitle>
              <CardDescription className="text-xs">Jins bo'yicha taqsimot</CardDescription>
            </div>
            <div className="bg-blue-500/10 p-2 rounded-xl">
              <PieIcon className="size-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <Skeleton className="size-48 mx-auto rounded-full" />
            ) : (
              <div className="h-[300px] w-full mt-4 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Psychologists */}
        <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 px-6 py-4">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold">Top Psixologlar</CardTitle>
              <CardDescription className="text-xs">Seanslar soni bo'yicha yetakchilar</CardDescription>
            </div>
            <CheckCircle className="size-4 text-indigo-600" />
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {data.psychologists?.topPerformers?.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{p.firstName} {p.lastName}</p>
                        <p className="text-[10px] text-muted-foreground">{p.specialization || "Psixolog"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black">{p.totalSessions}</p>
                      <p className="text-[10px] text-muted-foreground">seanslar</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Tests */}
        <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 px-6 py-4">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold">Ommabop Testlar</CardTitle>
              <CardDescription className="text-xs">Eng ko'p o'tilgan metodikalar</CardDescription>
            </div>
            <ClipboardList className="size-4 text-rose-600" />
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
              </div>
            ) : (
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.tests?.popular} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="title" type="category" className="text-[10px] font-bold" width={100} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Bar dataKey="count" fill="#f43f5e" radius={[0, 6, 6, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity & Refunds */}
        <Card className="lg:col-span-2 overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 px-6 py-4">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold">To'lovlar va Qaytarishlar</CardTitle>
              <CardDescription className="text-xs">Tizimdagi tranzaktsiyalar balansi</CardDescription>
            </div>
            <Activity className="size-4 text-indigo-600" />
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <Skeleton className="h-[300px] w-full rounded-xl" />
            ) : (
              <div className="h-[350px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyData} barGap={12}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" className="text-[10px]" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                    <YAxis className="text-[10px]" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="payments" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Muvaffaqiyatli" barSize={32} />
                    <Bar dataKey="refunds" fill="#ef4444" radius={[6, 6, 0, 0]} name="Qaytarilgan" barSize={32} />
                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
