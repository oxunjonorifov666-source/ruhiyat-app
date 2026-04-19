"use client"

import { useMemo } from "react"
import { PieChart as PieIcon, TrendingUp, Users, BookOpen, Brain, DollarSign, CalendarCheck, Loader2, AlertCircle, RefreshCw, Activity } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatsCard, StatsGrid } from "@/components/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useApiData } from "@/hooks/use-api-data"
import { useSuperadminCenter } from "@/hooks/use-superadmin-center"
import { useAuth } from "@/components/auth-provider"
import { SuperadminCenterEmptyState, SuperadminCenterSelect } from "@/components/superadmin-center-select"
import { Button } from "@/components/ui/button"
import { AccessDeniedPlaceholder } from "@/components/access-denied-placeholder"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from "recharts"

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
    psychologistLoad: number
    groupOccupancy: number
    testSuccessRate: number
    completionRate: number
  }
  sessions: {
    upcoming: any[]
    recent: any[]
  }
  monthlyStudents: { month: string; count: number }[]
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];

export default function StatisticsPage() {
  const { user } = useAuth()
  const centerCtx = useSuperadminCenter(user)
  const centerName = centerCtx.centerDisplayName
  const statsEnabled = !centerCtx.needsCenterSelection
  const centerId = centerCtx.effectiveCenterId

  const { data, loading, error, permissionDenied, refresh } = useApiData<AdminStats>({
    path: "/dashboard/admin/stats",
    params: centerId != null ? { centerId } : undefined,
    enabled: statsEnabled,
  })
  
  const s = data?.stats
  
  const sessionData = useMemo(() => {
    if (!s) return []
    return [
      { name: 'Kutilayotgan', value: s.pendingSessions, color: '#3b82f6' },
      { name: 'Yakunlangan', value: s.completedSessions, color: '#10b981' },
      { name: 'Boshqa', value: Math.max(0, s.totalSessions - s.pendingSessions - s.completedSessions), color: '#94a3b8' }
    ].filter(d => d.value > 0)
  }, [s])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(val)
  }

  if (centerCtx.needsCenterSelection) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Markaz Statistikasi"
          description="Markaz bo'yicha real vaqt tahlili va ko'rsatkichlar"
          icon={PieIcon}
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
      <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
        <Loader2 className="size-10 animate-spin text-primary opacity-50" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Ma'lumotlar tahlil qilinmoqda...</p>
      </div>
    )
  }

  if (permissionDenied) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Markaz Statistikasi"
          description={`${centerName} faoliyati bo'yicha real vaqt tahlili va ko'rsatkichlari`}
          icon={PieIcon}
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
          title="Statistikaga ruxsat yo'q"
          description="Ushbu sahifadagi yig'ma tahlillar markaz administratori yoki kengaytirilgan statistika ruxsatini talab qilishi mumkin."
          detail={error}
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-12 text-center bg-destructive/5 rounded-3xl border border-destructive/10">
        <AlertCircle className="size-10 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-bold text-destructive">Server xatosi</h3>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={refresh}>Qayta urinish</Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-16">
      <PageHeader 
        title="Markaz Statistikasi" 
        description={`${centerName} faoliyati bo'yicha real vaqt tahlili va ko'rsatkichlari`} 
        icon={PieIcon}
        actions={
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
            {centerCtx.isSuperadmin && (
              <SuperadminCenterSelect
                centers={centerCtx.centers}
                centersLoading={centerCtx.centersLoading}
                value={centerCtx.effectiveCenterId}
                onChange={centerCtx.setCenterId}
              />
            )}
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              <span className="ml-1.5">Yangilash</span>
            </Button>
          </div>
        }
      />

      <StatsGrid columns={4}>
        <StatsCard title="O'quvchilar" value={s?.totalStudents || 0} icon={Users} loading={loading} iconColor="bg-blue-500/10 text-blue-600" />
        <StatsCard title="O'qituvchilar" value={s?.totalTeachers || 0} icon={Users} loading={loading} iconColor="bg-emerald-500/10 text-emerald-600" />
        <StatsCard title="Jami kurslar" value={s?.totalCourses || 0} icon={BookOpen} loading={loading} iconColor="bg-violet-500/10 text-violet-600" />
        <StatsCard title="Mavjud guruhlar" value={s?.totalGroups || 0} icon={Brain} loading={loading} iconColor="bg-orange-500/10 text-orange-600" />
      </StatsGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* area chart - student growth */}
        <Card className="shadow-sm border-none bg-background overflow-hidden hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between bg-muted/20 px-6 py-4 border-b">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                 O'quvchilar qabuli
              </CardTitle>
              <CardDescription className="text-xs">Oylik o'sish dinamikasi</CardDescription>
            </div>
            <TrendingUp className="size-4 text-primary" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.monthlyStudents || []}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#64748b'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#64748b'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="count" name="O'quvchilar" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorStudents)" activeDot={{ r: 6, strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* pie chart - session distribution */}
        <Card className="shadow-sm border-none bg-background overflow-hidden hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between bg-muted/20 px-6 py-4 border-b">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                 Seanslar tahlili
              </CardTitle>
              <CardDescription className="text-xs">Psixologik xizmat ko'rsatkichlari</CardDescription>
            </div>
            <CalendarCheck className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[280px] w-full flex items-center justify-center">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sessionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {sessionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  </PieChart>
               </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
         <Card className="lg:col-span-2 shadow-sm border-none bg-background overflow-hidden hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between bg-muted/20 px-6 py-4 border-b">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                 Moliyaviy ko'rsatkichlar
              </CardTitle>
              <CardDescription className="text-xs">Seanslar va kurslardan tushumlar</CardDescription>
            </div>
            <DollarSign className="size-4 text-amber-500" />
          </CardHeader>
            <CardContent className="p-6">
                <div className="h-[320px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={[
                       { name: 'Joriy oy', value: s?.monthlyRevenue || 0 },
                       { name: 'Umumiy', value: s?.totalRevenue || 0 },
                     ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#64748b'}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#64748b'}} tickFormatter={(v) => `${(v/1e6).toFixed(1)}M`} />
                        <Tooltip cursor={{fill: '#f8fafc'}} formatter={(v: number) => [formatCurrency(v), "Tushum"]} />
                        <Bar dataKey="value" fill="#f59e0b" radius={[8, 8, 0, 0]} barSize={60} />
                     </BarChart>
                  </ResponsiveContainer>
                </div>
            </CardContent>
         </Card>

         <Card className="shadow-sm border-none bg-gradient-to-br from-indigo-600 to-indigo-700 text-white overflow-hidden">
          <CardHeader className="px-6 py-5 border-b border-white/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base font-bold">Resurslardan foydalanish</CardTitle>
              <Activity className="size-4 text-white/60" />
            </div>
          </CardHeader>
            <CardContent className="p-6 space-y-8">
               <ResourceStat label="Psixologlar yuklamasi" value={s?.psychologistLoad || 0} />
               <ResourceStat label="Guruhlar to'laligi" value={s?.groupOccupancy || 0} />
               <ResourceStat label="Test natijalari (Ijobiy)" value={s?.testSuccessRate || 0} />
               <ResourceStat label="Talabalar yakuni (Completion)" value={s?.completionRate || 0} />
               
               <div className="pt-6 border-t border-white/10 mt-6">
                  <div className="flex items-center gap-4">
                     <div className="size-12 rounded-2xl bg-white/15 flex items-center justify-center shadow-inner">
                        <Brain className="size-6 text-white" />
                     </div>
                     <div>
                        <p className="text-[10px] text-white/50 uppercase font-black tracking-[0.2em]">Markaz KPI Reytingi</p>
                        <p className="text-3xl font-black">{s && s.psychologistLoad > 80 ? 'A+' : s && s.psychologistLoad > 50 ? 'B+' : 'C'}</p>
                     </div>
                  </div>
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  )
}

function ResourceStat({ label, value }: { label: string, value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-medium">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
        <div 
          className="h-full bg-white rounded-full transition-all duration-1000" 
          style={{ width: `${value}%` }} 
        />
      </div>
    </div>
  )
}
