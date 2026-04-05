"use client"

import { PieChart, BarChart3, TrendingUp, Users, BookOpen, Brain, DollarSign, CalendarCheck } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatsCard, StatsGrid } from "@/components/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useApiData } from "@/hooks/use-api-data"
import { useAuth } from "@/components/auth-provider"

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
  }
}

export default function StatisticsPage() {
  const { user } = useAuth()
  const centerId = user?.administrator?.centerId
  const { data, loading } = useApiData<AdminStats>("/dashboard/admin/stats")
  const s = data?.stats

  return (
    <div className="space-y-6">
      <PageHeader title="Statistika" subtitle="Markaz faoliyati bo'yicha umumiy statistika" icon={PieChart} />

      <StatsGrid>
        <StatsCard title="O'quvchilar" value={s?.totalStudents || 0} icon={Users} loading={loading} iconColor="text-blue-600" />
        <StatsCard title="O'qituvchilar" value={s?.totalTeachers || 0} icon={Users} loading={loading} iconColor="text-green-600" />
        <StatsCard title="Kurslar" value={s?.totalCourses || 0} icon={BookOpen} loading={loading} iconColor="text-purple-600" />
        <StatsCard title="Guruhlar" value={s?.totalGroups || 0} icon={Users} loading={loading} iconColor="text-orange-600" />
      </StatsGrid>

      <StatsGrid>
        <StatsCard title="Psixologlar" value={s?.totalPsychologists || 0} icon={Brain} loading={loading} iconColor="text-pink-600" />
        <StatsCard title="Jami seanslar" value={s?.totalSessions || 0} icon={CalendarCheck} loading={loading} iconColor="text-cyan-600" />
        <StatsCard title="Kutilayotgan seanslar" value={s?.pendingSessions || 0} icon={CalendarCheck} loading={loading} iconColor="text-yellow-600" />
        <StatsCard title="Yakunlangan seanslar" value={s?.completedSessions || 0} icon={CalendarCheck} loading={loading} iconColor="text-emerald-600" />
      </StatsGrid>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <DollarSign className="size-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base">Umumiy daromad</CardTitle>
                <CardDescription>Jami to'lovlar summasi</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(s?.totalRevenue || 0).toLocaleString()} <span className="text-sm font-normal text-muted-foreground">so'm</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <TrendingUp className="size-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">Oylik daromad</CardTitle>
                <CardDescription>Joriy oy uchun</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(s?.monthlyRevenue || 0).toLocaleString()} <span className="text-sm font-normal text-muted-foreground">so'm</span></p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Solishtirma tahlil</CardTitle>
          <CardDescription>Oylik solishtirma grafiklar tez kunda qo'shiladi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <BarChart3 className="mx-auto size-10 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Grafiklar tez kunda</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
