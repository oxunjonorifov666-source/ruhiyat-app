"use client"

import { useEffect, useState } from "react"
import {
  Users, Brain, Building2, CreditCard, MessageSquare, Globe,
  FileText, TrendingUp, Activity, Calendar, ShieldCheck, AlertTriangle
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { StatsCard, StatsGrid } from "@/components/stats-card"
import { useAuth } from "@/components/auth-provider"

interface DashboardStats {
  totalUsers: number
  activePsychologists: number
  educationCenters: number
  totalPayments: number
  activeSessions: number
  communityPosts: number
  articles: number
}

interface RecentUser {
  id: number
  email: string | null
  phone: string | null
  firstName: string | null
  lastName: string | null
  role: string
  createdAt: string
}

const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
const API_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/+$/, '')}/api`

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

export default function DashboardPage() {
  const { accessToken } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accessToken) return
    fetch(`${API_URL}/dashboard/superadmin/stats`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(res => res.json())
      .then(data => {
        setStats(data.stats)
        setRecentUsers(data.recentUsers || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [accessToken])

  const loadingVal = "..."

  return (
    <div className="space-y-6">
      <PageHeader
        title="Boshqaruv paneli"
        description="Platformaning umumiy holati va asosiy ko'rsatkichlar"
      />

      <StatsGrid columns={4}>
        <StatsCard
          title="Jami foydalanuvchilar"
          value={loading ? loadingVal : (stats?.totalUsers?.toLocaleString() || "0")}
          icon={Users}
          iconColor="bg-blue-500/10 text-blue-600"
          trend={{ value: 12, label: "o'tgan oyga nisbatan" }}
        />
        <StatsCard
          title="Faol psixologlar"
          value={loading ? loadingVal : String(stats?.activePsychologists || 0)}
          icon={Brain}
          iconColor="bg-violet-500/10 text-violet-600"
        />
        <StatsCard
          title="Ta'lim markazlari"
          value={loading ? loadingVal : String(stats?.educationCenters || 0)}
          icon={Building2}
          iconColor="bg-amber-500/10 text-amber-600"
        />
        <StatsCard
          title="Jami to'lovlar"
          value={loading ? loadingVal : String(stats?.totalPayments || 0)}
          icon={CreditCard}
          iconColor="bg-emerald-500/10 text-emerald-600"
        />
      </StatsGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Foydalanuvchilar dinamikasi</CardTitle>
            <CardDescription>Oxirgi 12 oy davomida ro'yxatdan o'tganlar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed bg-muted/30">
              <div className="text-center text-muted-foreground">
                <TrendingUp className="mx-auto size-10 mb-3 opacity-40" />
                <p className="text-sm font-medium">Grafik tayyorlanmoqda</p>
                <p className="text-xs mt-1">Recharts integratsiyasi tez orada</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">So'nggi foydalanuvchilar</CardTitle>
            <CardDescription>Yaqinda ro'yxatdan o'tganlar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.length === 0 && !loading && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Hali foydalanuvchilar yo'q
                </p>
              )}
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-dashed last:border-0">
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
          </CardContent>
        </Card>
      </div>

      <StatsGrid columns={4}>
        <StatsCard
          title="Faol seanslar"
          value={loading ? loadingVal : String(stats?.activeSessions || 0)}
          icon={MessageSquare}
          iconColor="bg-sky-500/10 text-sky-600"
          description="Hozirgi faol seanslar"
        />
        <StatsCard
          title="Hamjamiyat postlari"
          value={loading ? loadingVal : (stats?.communityPosts?.toLocaleString() || "0")}
          icon={Globe}
          iconColor="bg-teal-500/10 text-teal-600"
        />
        <StatsCard
          title="Maqolalar"
          value={loading ? loadingVal : String(stats?.articles || 0)}
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
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
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
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { text: "Tizim muvaffaqiyatli yangilandi", time: "2 soat oldin", icon: Activity, color: "text-green-600" },
                { text: "Yangi psixolog ro'yxatdan o'tdi", time: "4 soat oldin", icon: Brain, color: "text-violet-600" },
                { text: "2 ta yangi shikoyat kelib tushdi", time: "5 soat oldin", icon: AlertTriangle, color: "text-amber-600" },
                { text: "Oylik hisobot tayyorlandi", time: "1 kun oldin", icon: FileText, color: "text-blue-600" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5 border-b border-dashed last:border-0">
                  <item.icon className={`size-4 shrink-0 ${item.color}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">{item.text}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
