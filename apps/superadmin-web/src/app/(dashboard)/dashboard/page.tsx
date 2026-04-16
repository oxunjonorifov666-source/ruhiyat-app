"use client"

import {
  Users, FileText, Globe, Calendar, Activity, CheckCircle, AlertTriangle,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/page-header"
import { SuperadminOverviewPanel } from "@/components/superadmin/superadmin-overview-panel"
import { useApiData } from "@/hooks/use-api-data"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { LayoutDashboard } from "lucide-react"

interface DashboardStatsPayload {
  stats: {
    totalUsers: number
    activePsychologists: number
    educationCenters: number
    totalPayments: number
    activeSessions: number
    communityPosts: number
    articles: number
  }
  bookings: {
    total: number
    pending: number
    completed: number
    revenue: number
  }
  recentUsers: {
    id: number
    email: string | null
    phone: string | null
    firstName: string | null
    lastName: string | null
    role: string
    createdAt: string
  }[]
  monthlyGrowth: { month: string; count: number }[]
  recentActivity: {
    id: number
    action: string
    resource: string
    resourceId: number | null
    userName: string
    createdAt: string
  }[]
}

const roleLabels: Record<string, string> = {
  SUPERADMIN: "Superadmin",
  ADMINISTRATOR: "Administrator",
  MOBILE_USER: "Foydalanuvchi",
}

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  SUPERADMIN: "default",
  ADMINISTRATOR: "secondary",
  MOBILE_USER: "outline",
}

const actionLabels: Record<string, string> = {
  CREATE: "yaratdi",
  UPDATE: "yangiladi",
  DELETE: "o'chirdi",
  LOGIN: "tizimga kirdi",
  LOGOUT: "tizimdan chiqdi",
}

const resourceLabels: Record<string, string> = {
  user: "foydalanuvchi",
  psychologist: "psixolog",
  session: "seans",
  article: "maqola",
  payment: "to'lov",
  notification: "bildirishnoma",
  booking_session: "bron",
}

const actionIcons: Record<string, { icon: typeof Activity; color: string }> = {
  CREATE: { icon: CheckCircle, color: "text-green-600" },
  UPDATE: { icon: Activity, color: "text-blue-600" },
  DELETE: { icon: AlertTriangle, color: "text-red-600" },
  LOGIN: { icon: Users, color: "text-violet-600" },
  DEFAULT: { icon: Activity, color: "text-muted-foreground" },
}

function formatTimeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Hozirgina"
  if (mins < 60) return `${mins} daqiqa oldin`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} soat oldin`
  const days = Math.floor(hours / 24)
  return `${days} kun oldin`
}

export default function DashboardPage() {
  const { data, loading, error } = useApiData<DashboardStatsPayload>({
    path: "/dashboard/superadmin/stats",
    refreshInterval: 120000,
  })

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title="Boshqaruv paneli"
        description="Real vaqtga yaqin ko'rsatkichlar, filtrlash va eksport — barchasi bazadan"
        icon={LayoutDashboard}
      />

      <SuperadminOverviewPanel />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden shadow-sm">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-base">Ro'yxatdan o'tishlar (oxirgi 6 oy)</CardTitle>
            <CardDescription>Umumiy tendensiya</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : data?.monthlyGrowth && data.monthlyGrowth.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyGrowth} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
                    <YAxis className="text-xs" tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        backgroundColor: "hsl(var(--card))",
                        color: "hsl(var(--card-foreground))",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [`${value} ta`, "Ro'yxatdan o'tganlar"]}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed bg-muted/30 text-sm text-muted-foreground">
                Ma'lumot yo'q
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-base">So'nggi foydalanuvchilar</CardTitle>
            <CardDescription>Yaqinda qo'shilganlar</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 py-1.5">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {(!data?.recentUsers || data.recentUsers.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Hali foydalanuvchilar yo'q
                  </p>
                )}
                {data?.recentUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-2 py-1.5 border-b border-dashed last:border-0 rounded px-1 hover:bg-muted/30"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {u.firstName && u.lastName
                          ? `${u.firstName} ${u.lastName}`
                          : u.email || u.phone || `#${u.id}`}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatTimeSince(u.createdAt)}</p>
                    </div>
                    <Badge variant={roleBadgeVariant[u.role] || "outline"} className="text-[10px] shrink-0">
                      {roleLabels[u.role] || u.role}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-base">Tezkor havolalar</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Foydalanuvchilar", icon: Users, desc: "Ro'yxat va rollar" },
                { label: "Maqolalar", icon: FileText, desc: "Kontent" },
                { label: "Hamjamiyat", icon: Globe, desc: "Postlar" },
                { label: "Uchrashuvlar", icon: Calendar, desc: "Rejalashtirish" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <item.icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-base">So'nggi faollik</CardTitle>
            <CardDescription>Audit jurnali (qisqacha)</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5">
                    <Skeleton className="size-4 rounded" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data?.recentActivity && data.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {data.recentActivity.map((item) => {
                  const iconConfig = actionIcons[item.action] || actionIcons.DEFAULT
                  const IconComponent = iconConfig.icon
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 py-1.5 border-b border-dashed last:border-0 rounded px-1 hover:bg-muted/30"
                    >
                      <IconComponent className={`size-4 shrink-0 ${iconConfig.color}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm truncate">
                          <span className="font-medium">{item.userName}</span>{" "}
                          {actionLabels[item.action] || item.action.toLowerCase()}{" "}
                          <span className="text-muted-foreground">
                            {resourceLabels[item.resource] || item.resource}
                            {item.resourceId ? ` #${item.resourceId}` : ""}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">{formatTimeSince(item.createdAt)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">Hali yozuvlar yo'q</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
