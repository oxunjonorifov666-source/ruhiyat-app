"use client"

import { useEffect, useState } from "react"
import { Users, GraduationCap, Brain, CreditCard, BookOpen, TrendingUp, Calendar, UsersRound } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { StatsCard } from "@/components/stats-card"
import { useAuth } from "@/components/auth-provider"

interface AdminStats {
  totalStudents: number
  totalTeachers: number
  totalCourses: number
  totalGroups: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export default function DashboardPage() {
  const { accessToken } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accessToken) return

    fetch(`${API_URL}/dashboard/admin/stats`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(res => res.json())
      .then(data => setStats(data.stats))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [accessToken])

  return (
    <>
      <PageHeader
        title="Boshqaruv paneli"
        description="Ta'lim markazingizning umumiy holati"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Jami o'quvchilar"
          value={loading ? "..." : String(stats?.totalStudents || 0)}
          icon={Users}
        />
        <StatsCard
          title="O'qituvchilar"
          value={loading ? "..." : String(stats?.totalTeachers || 0)}
          icon={GraduationCap}
          description="Faol o'qituvchilar soni"
        />
        <StatsCard
          title="Kurslar"
          value={loading ? "..." : String(stats?.totalCourses || 0)}
          icon={BookOpen}
        />
        <StatsCard
          title="Guruhlar"
          value={loading ? "..." : String(stats?.totalGroups || 0)}
          icon={UsersRound}
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>O'quvchilar dinamikasi</CardTitle>
            <CardDescription>Oxirgi 6 oy davomida ro'yxatdan o'tganlar</CardDescription>
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
            <CardTitle>Bugungi jadval</CardTitle>
            <CardDescription>Rejalashtirilgan darslar va uchrashuvlar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { text: "Matematika — 3-guruh", time: "09:00" },
                { text: "Ingliz tili — 1-guruh", time: "10:30" },
                { text: "Psixolog seansi", time: "13:00" },
                { text: "Ota-onalar yig'ilishi", time: "16:00" },
                { text: "Pedagoglar kengashi", time: "17:30" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{item.text}</span>
                  <span className="text-muted-foreground font-mono text-xs">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Faol kurslar"
          value={loading ? "..." : String(stats?.totalCourses || 0)}
          icon={BookOpen}
          description="Hozirgi o'quv davri"
        />
        <StatsCard
          title="Guruhlar"
          value={loading ? "..." : String(stats?.totalGroups || 0)}
          icon={UsersRound}
          description="Faol guruhlar soni"
        />
        <StatsCard
          title="Bugungi uchrashuvlar"
          value="0"
          icon={Calendar}
          description="Rejalashtirilgan"
        />
        <StatsCard
          title="O'qituvchilar"
          value={loading ? "..." : String(stats?.totalTeachers || 0)}
          icon={Brain}
        />
      </div>
    </>
  )
}
