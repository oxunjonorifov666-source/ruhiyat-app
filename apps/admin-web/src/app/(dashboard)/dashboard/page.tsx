"use client"

import { Users, GraduationCap, Brain, BookOpen, UsersRound, CalendarCheck, DollarSign, Clock, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/page-header"
import { StatsCard, StatsGrid } from "@/components/stats-card"
import { useApiData } from "@/hooks/use-api-data"
import { useAuth } from "@/components/auth-provider"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

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
  sessions: {
    upcoming: { id: number; scheduledAt: string; status: string; duration: number; psychologist: string; client: string }[]
    recent: { id: number; scheduledAt: string; status: string; psychologist: string; client: string; createdAt: string }[]
  }
  monthlyStudents: { month: string; count: number }[]
}

const statusLabels: Record<string, string> = {
  PENDING: "Kutilmoqda",
  ACCEPTED: "Qabul qilingan",
  COMPLETED: "Yakunlangan",
  CANCELLED: "Bekor qilingan",
  REJECTED: "Rad etilgan",
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  ACCEPTED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

function AnimatedNumber({ value }: { value: number }) {
  return <span className="tabular-nums">{value.toLocaleString()}</span>
}

function formatCurrency(amount: number) {
  return `${amount.toLocaleString()} UZS`
}

export default function DashboardPage() {
  const { user } = useAuth()
  const centerName = user?.administrator?.center?.name || "Markaz"

  const { data, loading } = useApiData<AdminStats>({
    path: "/dashboard/admin/stats",
    refreshInterval: 60000,
  })

  const stats = data?.stats

  return (
    <>
      <PageHeader
        title="Boshqaruv paneli"
        description={`${centerName} — umumiy holat`}
        icon={TrendingUp}
      />

      {loading ? (
        <StatsGrid columns={4}>
          {Array.from({ length: 8 }).map((_, i) => (
            <StatsCard key={i} title="" value="" icon={Users} loading />
          ))}
        </StatsGrid>
      ) : (
        <>
          <StatsGrid columns={4}>
            <StatsCard
              title="O'quvchilar"
              value={<AnimatedNumber value={stats?.totalStudents || 0} />}
              icon={Users}
              iconColor="bg-blue-500/10 text-blue-600"
            />
            <StatsCard
              title="O'qituvchilar"
              value={<AnimatedNumber value={stats?.totalTeachers || 0} />}
              icon={GraduationCap}
              iconColor="bg-emerald-500/10 text-emerald-600"
            />
            <StatsCard
              title="Psixologlar"
              value={<AnimatedNumber value={stats?.totalPsychologists || 0} />}
              icon={Brain}
              iconColor="bg-purple-500/10 text-purple-600"
            />
            <StatsCard
              title="Kurslar"
              value={<AnimatedNumber value={stats?.totalCourses || 0} />}
              icon={BookOpen}
              iconColor="bg-amber-500/10 text-amber-600"
            />
          </StatsGrid>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
            <StatsCard
              title="Jami seanslar"
              value={<AnimatedNumber value={stats?.totalSessions || 0} />}
              icon={CalendarCheck}
              iconColor="bg-sky-500/10 text-sky-600"
            />
            <StatsCard
              title="Kutilayotgan"
              value={<AnimatedNumber value={stats?.pendingSessions || 0} />}
              icon={Clock}
              iconColor="bg-yellow-500/10 text-yellow-600"
              description="Kutilayotgan seanslar"
            />
            <StatsCard
              title="Yakunlangan"
              value={<AnimatedNumber value={stats?.completedSessions || 0} />}
              icon={CalendarCheck}
              iconColor="bg-green-500/10 text-green-600"
            />
            <StatsCard
              title="Daromad"
              value={formatCurrency(stats?.totalRevenue || 0)}
              icon={DollarSign}
              iconColor="bg-emerald-500/10 text-emerald-600"
              description={`Oylik: ${formatCurrency(stats?.monthlyRevenue || 0)}`}
            />
          </div>
        </>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>O'quvchilar dinamikasi</CardTitle>
            <CardDescription>Oxirgi 6 oy davomida ro'yxatdan o'tganlar</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data?.monthlyStudents || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis allowDecimals={false} className="text-xs" />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                    formatter={(value: number) => [`${value} ta`, "O'quvchilar"]}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kelgusi seanslar</CardTitle>
            <CardDescription>Rejalashtirilgan uchrashuvlar</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (data?.sessions?.upcoming || []).length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                Rejalashtirilgan seanslar yo'q
              </div>
            ) : (
              <div className="space-y-3">
                {(data?.sessions?.upcoming || []).map((s) => (
                  <div key={s.id} className="flex items-start justify-between border-b pb-3 last:border-0">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{s.psychologist}</p>
                      <p className="text-xs text-muted-foreground">{s.client}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono">
                        {new Date(s.scheduledAt).toLocaleDateString("uz-UZ")}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {new Date(s.scheduledAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>So'nggi seanslar</CardTitle>
            <CardDescription>Oxirgi yaratilgan seanslar</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (data?.sessions?.recent || []).length === 0 ? (
              <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
                Seanslar topilmadi
              </div>
            ) : (
              <div className="space-y-2">
                {(data?.sessions?.recent || []).map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <CalendarCheck className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{s.client}</p>
                        <p className="text-xs text-muted-foreground">{s.psychologist}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[s.status] || "bg-gray-100 text-gray-800"}`}>
                        {statusLabels[s.status] || s.status}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(s.createdAt).toLocaleDateString("uz-UZ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
