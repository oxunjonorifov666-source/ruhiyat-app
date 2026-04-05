"use client"

import { useEffect, useState, useRef } from "react"
import {
  Users, Brain, Building2, CreditCard, MessageSquare, Globe,
  FileText, TrendingUp, Activity, Calendar, ShieldCheck, AlertTriangle,
  CalendarCheck, Clock, CheckCircle, DollarSign,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/page-header"
import { StatsCard, StatsGrid } from "@/components/stats-card"
import { useApiData } from "@/hooks/use-api-data"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"

interface DashboardData {
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

function formatPrice(price: number) {
  return new Intl.NumberFormat("uz-UZ").format(price) + " so'm"
}

function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<number>(0)

  useEffect(() => {
    const start = ref.current
    const diff = value - start
    if (diff === 0) return
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(start + diff * eased)
      setDisplay(current)
      if (progress < 1) requestAnimationFrame(animate)
      else ref.current = value
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return <>{display.toLocaleString()}</>
}

function StatsCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="size-10 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { data, loading, error } = useApiData<DashboardData>({
    path: "/dashboard/superadmin/stats",
    refreshInterval: 60000,
  })

  const stats = data?.stats
  const bookings = data?.bookings

  return (
    <div className="space-y-6">
      <PageHeader
        title="Boshqaruv paneli"
        description="Platformaning umumiy holati va asosiy ko'rsatkichlar"
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">
            Ma'lumotlarni yuklashda xatolik: {error}
          </CardContent>
        </Card>
      ) : (
        <>
          <StatsGrid columns={4}>
            <StatsCard
              title="Jami foydalanuvchilar"
              value={<AnimatedNumber value={stats?.totalUsers || 0} />}
              icon={Users}
              iconColor="bg-blue-500/10 text-blue-600"
            />
            <StatsCard
              title="Faol psixologlar"
              value={<AnimatedNumber value={stats?.activePsychologists || 0} />}
              icon={Brain}
              iconColor="bg-violet-500/10 text-violet-600"
            />
            <StatsCard
              title="Ta'lim markazlari"
              value={<AnimatedNumber value={stats?.educationCenters || 0} />}
              icon={Building2}
              iconColor="bg-amber-500/10 text-amber-600"
            />
            <StatsCard
              title="Jami to'lovlar"
              value={<AnimatedNumber value={stats?.totalPayments || 0} />}
              icon={CreditCard}
              iconColor="bg-emerald-500/10 text-emerald-600"
            />
          </StatsGrid>

          {bookings && (
            <StatsGrid columns={4}>
              <StatsCard
                title="Jami seanslar"
                value={<AnimatedNumber value={bookings.total} />}
                icon={CalendarCheck}
                iconColor="bg-sky-500/10 text-sky-600"
              />
              <StatsCard
                title="Kutilayotgan seanslar"
                value={<AnimatedNumber value={bookings.pending} />}
                icon={Clock}
                iconColor="bg-orange-500/10 text-orange-600"
              />
              <StatsCard
                title="Yakunlangan seanslar"
                value={<AnimatedNumber value={bookings.completed} />}
                icon={CheckCircle}
                iconColor="bg-green-500/10 text-green-600"
              />
              <StatsCard
                title="Seans daromadi"
                value={formatPrice(bookings.revenue)}
                icon={DollarSign}
                iconColor="bg-emerald-500/10 text-emerald-600"
              />
            </StatsGrid>
          )}
        </>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Foydalanuvchilar dinamikasi</CardTitle>
            <CardDescription>Oxirgi 6 oy davomida ro'yxatdan o'tganlar</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-64 w-full rounded-lg" />
              </div>
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
                      formatter={(value: number) => [`${value} ta`, "Foydalanuvchilar"]}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed bg-muted/30">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="mx-auto size-10 mb-3 opacity-40" />
                  <p className="text-sm font-medium">Ma'lumot yo'q</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">So'nggi foydalanuvchilar</CardTitle>
            <CardDescription>Yaqinda ro'yxatdan o'tganlar</CardDescription>
          </CardHeader>
          <CardContent>
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
                  <div key={u.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-dashed last:border-0 transition-colors hover:bg-muted/30 rounded px-1">
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

      <StatsGrid columns={4}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)
        ) : (
          <>
            <StatsCard
              title="Faol seanslar"
              value={<AnimatedNumber value={stats?.activeSessions || 0} />}
              icon={MessageSquare}
              iconColor="bg-sky-500/10 text-sky-600"
              description="Hozirgi faol seanslar"
            />
            <StatsCard
              title="Hamjamiyat postlari"
              value={<AnimatedNumber value={stats?.communityPosts || 0} />}
              icon={Globe}
              iconColor="bg-teal-500/10 text-teal-600"
            />
            <StatsCard
              title="Maqolalar"
              value={<AnimatedNumber value={stats?.articles || 0} />}
              icon={FileText}
              iconColor="bg-orange-500/10 text-orange-600"
              description="Nashr etilgan maqolalar"
            />
            <StatsCard
              title="Tizim holati"
              value="Barqaror"
              icon={ShieldCheck}
              iconColor="bg-green-500/10 text-green-600"
              description="Barcha xizmatlar ishlayapti"
            />
          </>
        )}
      </StatsGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tezkor havolalar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Yangi foydalanuvchi", icon: Users, desc: "Foydalanuvchi qo'shish" },
                { label: "Yangi maqola", icon: FileText, desc: "Maqola yaratish" },
                { label: "Yangi e'lon", icon: Globe, desc: "E'lon e'lon qilish" },
                { label: "Uchrashuvlar", icon: Calendar, desc: "Uchrashuvlarni boshqarish" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-all duration-200 hover:shadow-sm hover:scale-[1.01]">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">So'nggi faollik</CardTitle>
            <CardDescription>Tizim auditi</CardDescription>
          </CardHeader>
          <CardContent>
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
                    <div key={item.id} className="flex items-center gap-3 py-1.5 border-b border-dashed last:border-0 transition-colors hover:bg-muted/30 rounded px-1">
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
              <div className="text-center py-8 text-sm text-muted-foreground">
                Hali faollik yo'q
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
