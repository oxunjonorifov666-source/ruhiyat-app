"use client"

import { Users, GraduationCap, CalendarCheck, DollarSign, Clock, TrendingUp, Activity, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { StatsCard, StatsGrid } from "@/components/stats-card"
import { useApiData } from "@/hooks/use-api-data"
import { useSuperadminCenter } from "@/hooks/use-superadmin-center"
import { useAuth } from "@/components/auth-provider"
import { SuperadminCenterEmptyState, SuperadminCenterSelect } from "@/components/superadmin-center-select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { Badge } from "@/components/ui/badge"
import { AccessDeniedPlaceholder } from "@/components/access-denied-placeholder"

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
    /** Yakunlangan / jami yozilishlar (%) — backend */
    completionRate: number
    activeEnrollments: number
    /** Backend: yakunlangan seanslar / (psixologlar × 40) × 100, max 100 */
    psychologistLoad?: number
    /** Backend: faol yozilishlar / (guruhlar × 15) × 100, max 100 */
    groupOccupancy?: number
    /** Backend: 50+ ball testlar / jami testlar × 100, max 100 */
    testSuccessRate?: number
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
  const centerCtx = useSuperadminCenter(user)
  const centerName = centerCtx.centerDisplayName
  const centerId = centerCtx.effectiveCenterId

  const statsEnabled = !centerCtx.needsCenterSelection

  const { data, loading, error, permissionDenied } = useApiData<AdminStats>({
    path: "/dashboard/admin/stats",
    params: centerId != null ? { centerId } : undefined,
    enabled: statsEnabled,
    refreshInterval: 30000,
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("uz-UZ", {
      style: "currency",
      currency: "UZS",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const {
    data: financeData,
    loading: financeLoading,
    error: financeError,
    permissionDenied: financePermissionDenied,
  } = useApiData<{
    totalRevenue: number
    revenuePerCourse: { name: string; value: number }[]
    revenuePerGroup: { name: string; value: number }[]
  }>({
    path: "/payments/analytics",
    params: centerId != null ? { centerId } : undefined,
    refreshInterval: 60000,
    enabled: centerId != null && statsEnabled,
  })

  if (centerCtx.needsCenterSelection) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Boshqaruv paneli"
          description="Markaz bo'yicha faoliyat va asosiy ko'rsatkichlar"
          icon={TrendingUp}
          actions={
            <SuperadminCenterSelect
              centers={centerCtx.centers}
              centersLoading={centerCtx.centersLoading}
              value={centerCtx.effectiveCenterId}
              onChange={centerCtx.setCenterId}
            />
          }
        />
        <SuperadminCenterEmptyState
          centers={centerCtx.centers}
          centersLoading={centerCtx.centersLoading}
          onSelect={centerCtx.setCenterId}
        />
      </div>
    )
  }

  if (loading && !data) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (permissionDenied) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Boshqaruv paneli"
          description={`${centerName} faoliyati va asosiy ko'rsatkichlari`}
          icon={TrendingUp}
          actions={
            centerCtx.isSuperadmin ? (
              <SuperadminCenterSelect
                centers={centerCtx.centers}
                centersLoading={centerCtx.centersLoading}
                value={centerCtx.effectiveCenterId}
                onChange={centerCtx.setCenterId}
              />
            ) : undefined
          }
        />
        <AccessDeniedPlaceholder
          title="Dashboard statistikalariga ruxsat yo'q"
          description="Markaz boshqaruv panelidagi yig'ma ko'rsatkichlar odatda markaz administratori yoki kengaytirilgan statistika ruxsatini talab qiladi."
          detail={error}
        />
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
        actions={
          centerCtx.isSuperadmin ? (
            <SuperadminCenterSelect
              centers={centerCtx.centers}
              centersLoading={centerCtx.centersLoading}
              value={centerCtx.effectiveCenterId}
              onChange={centerCtx.setCenterId}
            />
          ) : undefined
        }
      />

      {error && !data && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <StatsGrid columns={4}>
        <StatsCard
          title="O'quvchilar"
          value={stats?.totalStudents || 0}
          icon={Users}
          iconColor="bg-blue-500/10 text-blue-600"
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
          description={`Kutilayotgan: ${stats?.pendingSessions || 0} · Yakunlangan: ${stats?.completedSessions || 0}`}
        />
        <StatsCard
          title="Seans tushumi (to'langan)"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={DollarSign}
          iconColor="bg-amber-500/10 text-amber-600"
          description={`Joriy oy (seanslar): ${formatCurrency(stats?.monthlyRevenue || 0)}`}
        />
      </StatsGrid>

      <div className="grid gap-6 md:grid-cols-4 mt-6 mb-6">
        <Card className="col-span-1 md:col-span-4 bg-primary text-primary-foreground border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold flex items-center">
              <GraduationCap className="mr-2 size-5" /> Ta&apos;lim va yozilishlar
            </CardTitle>
            <CardDescription className="text-primary-foreground/70">
              Yozilishlarni yakunlash ulushi va faol yozilishlar — backend ma&apos;lumotlari
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="space-y-1 p-4 rounded-lg bg-primary-foreground/10">
              <p className="text-sm font-medium text-primary-foreground/80">Yozilishlarni yakunlash</p>
              <p className="text-3xl font-bold">{stats?.completionRate ?? 0}%</p>
              <p className="text-xs text-primary-foreground/60">Yakunlangan / jami yozilishlar</p>
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

      {centerId != null && (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-6">
          {financePermissionDenied ? (
            <div className="lg:col-span-2">
              <AccessDeniedPlaceholder
                title="To'lovlar tahliliga ruxsat yo'q"
                description="Kurs va guruh bo'yicha to'lov diagrammalari odatda finance.read yoki to'lovlar/analitika ruxsatini talab qiladi. Boshqa dashboard bo'limlari ko'rinishi mumkin."
                detail={financeError}
              />
            </div>
          ) : (
            <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center">
                <DollarSign className="mr-2 size-5 text-amber-500" /> Markaz to&apos;lovlari — kurs bo&apos;yicha
              </CardTitle>
              <CardDescription>
                To&apos;langan markaz to&apos;lovlari (kurs nomi bo&apos;yicha yig&apos;indilar)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {financeError ? (
                <p className="py-12 text-center text-sm text-destructive">{financeError}</p>
              ) : financeLoading && !financeData ? (
                <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">Yuklanmoqda...</div>
              ) : (financeData?.revenuePerCourse?.length ?? 0) === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Kurs bo&apos;yicha to&apos;lovlar hozircha yo&apos;q
                </p>
              ) : (
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financeData!.revenuePerCourse} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip cursor={{ fill: "transparent" }} formatter={(value: number) => [formatCurrency(value), "Tushum"]} />
                      <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center">
                <Users className="mr-2 size-5 text-indigo-500" /> Markaz to&apos;lovlari — guruh bo&apos;yicha
              </CardTitle>
              <CardDescription>Guruh nomi bo&apos;yicha yig&apos;indilar</CardDescription>
            </CardHeader>
            <CardContent>
              {financeError ? (
                <p className="py-12 text-center text-sm text-destructive">{financeError}</p>
              ) : financeLoading && !financeData ? (
                <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">Yuklanmoqda...</div>
              ) : (financeData?.revenuePerGroup?.length ?? 0) === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Guruh bo&apos;yicha to&apos;lovlar hozircha yo&apos;q
                </p>
              ) : (
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financeData!.revenuePerGroup} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip cursor={{ fill: "transparent" }} formatter={(value: number) => [formatCurrency(value), "Tushum"]} />
                      <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
            </>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Main Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">O&apos;quvchilar dinamikasi</CardTitle>
                <CardDescription>Oxirgi 6 oy: yangi o&apos;quvchilar (ro&apos;yxatdan o&apos;tish)</CardDescription>
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
              {(!data?.sessions?.recent || data.sessions.recent.length === 0) ? (
                <p className="py-8 text-center text-sm text-muted-foreground">So&apos;nggi seans yozuvlari yo&apos;q</p>
              ) : (
                data.sessions.recent.map((s) => (
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
                ))
              )}
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
              <CardTitle className="text-lg">Joriy oy — seans tushumi</CardTitle>
              <CardDescription className="text-primary-foreground/70">
                To&apos;langan psixolog seanslari (joriy oy yaratilgan, status PAID)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">{formatCurrency(stats?.monthlyRevenue || 0)}</p>
                <p className="text-xs text-primary-foreground/65">
                  Markaz to&apos;lovlari (kurs/guruh) alohida diagrammalarda; bu raqam faqat seanslar asosida.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Yuklama va natijalar (backend)</CardTitle>
              <CardDescription>
                Foizlar serverdagi maqsadli formulalar bo&apos;yicha; katta raqam = maqsadga yaqinroq (max 100%).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(
                [
                  {
                    label: "Psixolog yuklamasi",
                    sub: "Yakunlangan seanslar / (psixolog × 40)",
                    value: Math.min(100, stats?.psychologistLoad ?? 0),
                    color: "bg-blue-500",
                  },
                  {
                    label: "Guruh bandligi",
                    sub: "Faol yozilishlar / (guruh × 15)",
                    value: Math.min(100, stats?.groupOccupancy ?? 0),
                    color: "bg-emerald-500",
                  },
                  {
                    label: "Test natijalari (50+ ball)",
                    sub: "Ijobiy testlar / jami testlar",
                    value: Math.min(100, stats?.testSuccessRate ?? 0),
                    color: "bg-amber-500",
                  },
                ] as const
              ).map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-muted-foreground">
                      {item.label}
                      <span className="block text-[10px] font-normal text-muted-foreground/80">{item.sub}</span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums">{item.value}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.value}%` }} />
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
