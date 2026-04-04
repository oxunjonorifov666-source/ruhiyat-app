"use client"

import { useEffect, useState } from "react"
import { Users, Brain, Building2, CreditCard, MessageSquare, Globe, FileText, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { StatsCard } from "@/components/stats-card"
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

  const roleLabels: Record<string, string> = {
    SUPERADMIN: "Superadmin",
    ADMINISTRATOR: "Administrator",
    MOBILE_USER: "Foydalanuvchi",
  }

  return (
    <>
      <PageHeader
        title="Boshqaruv paneli"
        description="Platformaning umumiy holati va asosiy ko'rsatkichlar"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Jami foydalanuvchilar"
          value={loading ? "..." : (stats?.totalUsers?.toLocaleString() || "0")}
          icon={Users}
        />
        <StatsCard
          title="Faol psixologlar"
          value={loading ? "..." : String(stats?.activePsychologists || 0)}
          icon={Brain}
        />
        <StatsCard
          title="Ta'lim markazlari"
          value={loading ? "..." : String(stats?.educationCenters || 0)}
          icon={Building2}
        />
        <StatsCard
          title="Jami to'lovlar"
          value={loading ? "..." : String(stats?.totalPayments || 0)}
          icon={CreditCard}
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Foydalanuvchilar dinamikasi</CardTitle>
            <CardDescription>Oxirgi 12 oy davomida ro'yxatdan o'tganlar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
              <div className="text-center text-muted-foreground">
                <TrendingUp className="mx-auto size-8 mb-2" />
                <p>Grafik bu yerda ko'rsatiladi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>So'nggi foydalanuvchilar</CardTitle>
            <CardDescription>Yaqinda ro'yxatdan o'tganlar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.length === 0 && !loading && (
                <p className="text-sm text-muted-foreground">Hali foydalanuvchilar yo'q</p>
              )}
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">
                      {u.firstName && u.lastName
                        ? `${u.firstName} ${u.lastName}`
                        : u.email || u.phone || `#${u.id}`}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {roleLabels[u.role] || u.role}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs">{formatTimeSince(u.createdAt)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Faol seanslar"
          value={loading ? "..." : String(stats?.activeSessions || 0)}
          icon={MessageSquare}
          description="Hozirgi faol seanslar"
        />
        <StatsCard
          title="Hamjamiyat postlari"
          value={loading ? "..." : (stats?.communityPosts?.toLocaleString() || "0")}
          icon={Globe}
        />
        <StatsCard
          title="Maqolalar"
          value={loading ? "..." : String(stats?.articles || 0)}
          icon={FileText}
          description="Nashr etilgan maqolalar"
        />
        <StatsCard
          title="To'lovlar"
          value={loading ? "..." : String(stats?.totalPayments || 0)}
          icon={CreditCard}
        />
      </div>
    </>
  )
}
