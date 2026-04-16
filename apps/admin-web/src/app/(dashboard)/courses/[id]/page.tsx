"use client"

import { useEffect, useState, useCallback, use } from "react"
import { useAuth } from "@/components/auth-provider"
import { apiClient } from "@/lib/api-client"
import { PageHeader } from "@/components/page-header"
import { StatsCard, StatsGrid } from "@/components/stats-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BookOpen, UsersRound, TrendingUp, Presentation, CheckCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

interface CourseAnalytics {
  totalEnrollments: number
  activeGroupsCount: number
  totalGroupsCount: number
  averageGroupSize: number
  completionRate: number
  completed: number
}

interface Course {
  id: number
  title: string
  code: string
  category: string
  status: string
}

export default function CourseAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const courseId = resolvedParams.id

  const { user } = useAuth()
  const centerId = user?.administrator?.centerId
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<Course | null>(null)
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null)

  const fetchData = useCallback(async () => {
    if (!centerId) return
    setLoading(true)
    try {
      const [courseRes, statsRes] = await Promise.all([
        apiClient<Course>(`/courses/${courseId}?centerId=${centerId}`),
        apiClient<CourseAnalytics>(`/courses/${courseId}/analytics?centerId=${centerId}`)
      ])
      setCourse(courseRes)
      setAnalytics(statsRes)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [centerId, courseId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (!centerId) return <div className="p-8 text-center">Markaz topilmadi</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => router.push("/courses")}>Orqaga</Button>
      </div>

      <PageHeader
        title={`Kurs Tahlili: ${course?.title || "Yuklanmoqda..."}`}
        description={`"${course?.code || ""}" kodi ostidagi o'quv moduli ko'rsatkichlari`}
        icon={BookOpen}
        badge={course?.status === "PUBLISHED" ? "Faol" : "Nofaol"}
        badgeVariant={course?.status === "PUBLISHED" ? "default" : "secondary"}
      />

      {loading ? (
        <div className="flex h-[200px] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : analytics && (
        <div className="space-y-6">
          <StatsGrid columns={4}>
            <StatsCard
              title="Jami O'quvchilar"
              value={analytics.totalEnrollments}
              icon={UsersRound}
              iconColor="bg-blue-500/10 text-blue-600"
              description={`Barcha vaqt tranzaksiyalari`}
            />
            <StatsCard
              title="O'zlashtirish (Tugatganlar)"
              value={`${analytics.completionRate}%`}
              icon={CheckCircle}
              iconColor="bg-emerald-500/10 text-emerald-600"
              description={`${analytics.completed} nafar yakunlagan`}
            />
            <StatsCard
              title="Faol Guruhlar"
              value={analytics.activeGroupsCount}
              icon={Presentation}
              iconColor="bg-indigo-500/10 text-indigo-600"
              description={`Jami guruhlar: ${analytics.totalGroupsCount}`}
            />
            <StatsCard
              title="O'rtacha Guruh Sig'imi"
              value={analytics.averageGroupSize}
              icon={TrendingUp}
              iconColor="bg-sky-500/10 text-sky-600"
              description="Hozirgi faol guruhlar kesimida"
            />
          </StatsGrid>

          <Card>
            <CardHeader>
              <CardTitle>Konspekt Boshqaruvi</CardTitle>
              <CardDescription>Bu bo'lim Faza doirasida keyinroq to'ldiriladi va barcha guruhlar qamrab olinadi.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-20 flex items-center justify-center rounded-md border border-dashed text-muted-foreground/50">
                Course detallashtirish jadvali tez kunda qo'shiladi. Bu sahifa statistika qatlami (2.3) uchun qurildi.
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
