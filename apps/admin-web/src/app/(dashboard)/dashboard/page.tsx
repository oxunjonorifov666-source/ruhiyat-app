"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Users, GraduationCap, Brain, BookOpen, CalendarCheck, DollarSign, Clock, TrendingUp, Activity, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { StatsCard, StatsGrid } from "@/components/stats-card"
import { useApiData } from "@/hooks/use-api-data"
import { useAuth } from "@/components/auth-provider"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { Badge } from "@/components/ui/badge"

interface AdminStats {
  stats: {
    totalStudents: number
    totalTeachers: number
    totalCourses: number
    totalGroups: number
    totalPsychologists: number
    totalSessions: number
    pendingSessions: number
    completedSessions: number
    totalRevenue: number
    monthlyRevenue: number
    completionRate: number
    activeEnrollments: number
  }
  sessions: {
    upcoming: { id: number; scheduledAt: string; status: string; duration: number; psychologist: string; client: string }[]
    recent: { id: number; scheduledAt: string; status: string; psychologist: string; client: string; createdAt: string }[]
  }
  monthlyStudents: { month: string; count: number }[]
}

const statusColors: Record<string, string> = {
  PENDING: "bg-blue-500/10 text-blue-600 border-blue-200",
  ACCEPTED: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
  COMPLETED: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  CANCELLED: "bg-red-500/10 text-red-600 border-red-200",
  REJECTED: "bg-slate-500/10 text-slate-600 border-slate-200",
}

export default function DashboardPage() {
  const { user } = useAuth()
  const centerName = user?.administrator?.center?.name || "Markaz"
  const centerId = user?.administrator?.centerId

  const { data, loading, error } = useApiData<AdminStats>({
    path: "/dashboard/admin/stats",
    refreshInterval: 30000,
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("uz-UZ", {
      style: "currency",
      currency: "UZS",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const { data: financeData, loading: financeLoading } = useApiData<any>({
    path: "/payments/analytics",
    params: { centerId },
    refreshInterval: 60000,
  })

  if (loading && !data && financeLoading) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  const stats = data?.stats

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Boshqaruv paneli"
        description={`${centerName} faoliyati va asosiy ko'rsatkichlari`}
        icon={TrendingUp}
        badge="Enterprise"
        badgeVariant="outline"
      />

      <StatsGrid columns={4}>
        <StatsCard
          title="O'quvchilar"
          value={stats?.totalStudents || 0}
          icon={Users}
          iconColor="bg-blue-500/10 text-blue-600"
          trend={{ value: 12, label: "o'sish" }}
        />
        <StatsCard
          title="O'qituvchilar"
          value={stats?.totalTeachers || 0}
          icon={GraduationCap}
          iconColor="bg-emerald-500/10 text-emerald-600"
        />
        <StatsCard
          title="Seanslar"
          value={stats?.totalSessions || 0}
          icon={CalendarCheck}
          iconColor="bg-sky-500/10 text-sky-600"
          description={`Bugun: ${stats?.pendingSessions || 0} ta kutilmoqda`}
        />
        <StatsCard
          title="Umumiy tushum"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={DollarSign}
          iconColor="bg-amber-500/10 text-amber-600"
          description={`Shu oy: ${formatCurrency(stats?.monthlyRevenue || 0)}`}
        />
      </StatsGrid>

      <div className="grid gap-6 md:grid-cols-4 mt-6 mb-6">
        <Card className="col-span-1 md:col-span-4 bg-primary text-primary-foreground border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold flex items-center">
              <GraduationCap className="mr-2 size-5" /> Akademik Samaradorlik ko'rsatkichlari (Faza 2.3)
            </CardTitle>
            <CardDescription className="text-primary-foreground/70">Markazning o'zlashtirish va guruhlar bo'yicha integrallashgan analitikasi</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="space-y-1 p-4 rounded-lg bg-primary-foreground/10">
              <p className="text-sm font-medium text-primary-foreground/80">O'zlashtirish (Bitirganlar)</p>
              <p className="text-3xl font-bold">{stats?.completionRate || 0}%</p>
            </div>
            <div className="space-y-1 p-4 rounded-lg bg-primary-foreground/10">
              <p className="text-sm font-medium text-primary-foreground/80">Faol Yozilishlar</p>
              <p className="text-3xl font-bold flex items-center gap-2">
                {stats?.activeEnrollments || 0}
              </p>
            </div>
            <div className="space-y-1 p-4 rounded-lg bg-primary-foreground/10">
              <p className="text-sm font-medium text-primary-foreground/80">Faol Kurslar</p>
              <p className="text-3xl font-bold">{stats?.totalCourses || 0} ta</p>
            </div>
            <div className="space-y-1 p-4 rounded-lg bg-primary-foreground/10">
              <p className="text-sm font-medium text-primary-foreground/80">Markaz Guruhlari</p>
              <p className="text-3xl font-bold">{stats?.totalGroups || 0} ta</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {financeData && (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center">
                <DollarSign className="mr-2 size-5 text-amber-500" /> Moliyaviy Tushum (Faza 2.4)
              </CardTitle>
              <CardDescription>Kurslar bo'yicha tushumlar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financeData.revenuePerCourse || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip cursor={{ fill: 'transparent' }} formatter={(value: number) => [formatCurrency(value), "Tushum"]} />
                    <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center">
                <Users className="mr-2 size-5 text-indigo-500" /> Guruhlar bo'yicha daromad
              </CardTitle>
              <CardDescription>Aktiv guruhlar tushumi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financeData.revenuePerGroup || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip cursor={{ fill: 'transparent' }} formatter={(value: number) => [formatCurrency(value), "Tushum"]} />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Main Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">O'quvchilar dinamikasi</CardTitle>
                <CardDescription>Oxirgi 6 oylik qabul ko'rsatkichlari</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-normal">
                  Jami: {stats?.totalStudents || 0}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.monthlyStudents || []}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    className="text-[10px] uppercase font-medium text-muted-foreground" 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    className="text-[10px] text-muted-foreground" 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    name="O'quvchilar"
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Sessions */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Kelgusi seanslar</CardTitle>
            <CardDescription>Yaqin soatlardagi uchrashuvlar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(!data?.sessions?.upcoming || data.sessions.upcoming.length === 0) ? (
                <div className="flex h-[250px] flex-col items-center justify-center text-center space-y-2 opacity-40">
                  <Clock className="size-10" />
                  <p className="text-sm">Rejalashtirilgan seanslar yo'q</p>
                </div>
              ) : (
                data.sessions.upcoming.map((session) => (
                  <div key={session.id} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold leading-none">{session.client}</p>
                      <p className="text-xs text-muted-foreground">{session.psychologist}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-medium">
                        {new Date(session.scheduledAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(session.scheduledAt).toLocaleDateString("uz-UZ")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">So'nggi faollik</CardTitle>
              <CardDescription>Yuborilgan seanslar xronologiyasi</CardDescription>
            </div>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.sessions?.recent || []).map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 transition-all hover:bg-muted/40">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-background flex items-center justify-center border shadow-sm">
                      <Activity className="size-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{s.client}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-tight">{s.psychologist}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className={`text-[10px] h-5 ${statusColors[s.status] || "bg-gray-100"}`}>
                      {s.status}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(s.createdAt).toLocaleDateString("uz-UZ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions / Summary */}
        <div className="space-y-6">
          <Card className="bg-primary text-primary-foreground border-none shadow-indigo-500/20 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingUp className="size-32" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg">Oylik natija</CardTitle>
              <CardDescription className="text-primary-foreground/70">Markazning joriy oydagi ko'rsatkichlari</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="space-y-1">
                  <p className="text-3xl font-bold">{formatCurrency(stats?.monthlyRevenue || 0)}</p>
                  <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                    <ArrowUpRight className="size-4 text-emerald-300" />
                    <span>O'tgan oyga nisbatan +14%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Tizim holati</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "O'quvchilar faolligi", value: 92, color: "bg-blue-500" },
                { label: "Seanslar yakunlanishi", value: 85, color: "bg-emerald-500" },
                { label: "To'lovlar intizomi", value: 78, color: "bg-amber-500" },
              ].map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold">{item.value}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
