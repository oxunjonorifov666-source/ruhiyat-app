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
import { classifyApiError, describeEmbeddedApiError, formatEmbeddedApiError } from "@/lib/api-error"
import { AccessDeniedPlaceholder } from "@/components/access-denied-placeholder"
import { useSuperadminCenter } from "@/hooks/use-superadmin-center"
import { SuperadminCenterRequiredScreen, SuperadminCenterSelect } from "@/components/superadmin-center-select"
import { useRouter } from "next/navigation"
import { withCenterQuery } from "@/lib/endpoints"
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
  const centerCtx = useSuperadminCenter(user)
  const centerId = centerCtx.effectiveCenterId
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<Course | null>(null)
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!centerId) return
    setLoading(true)
    setPermissionDenied(false)
    setLoadError(null)
    try {
      const [courseRes, statsRes] = await Promise.all([
        apiClient<Course>(`/courses/${courseId}?centerId=${centerId}`),
        apiClient<CourseAnalytics>(`/courses/${courseId}/analytics?centerId=${centerId}`)
      ])
      setCourse(courseRes)
      setAnalytics(statsRes)
    } catch (e: unknown) {
      const { permissionDenied: denied } = classifyApiError(e)
      if (denied) {
        setPermissionDenied(true)
      } else {
        setLoadError(formatEmbeddedApiError(e))
        const d = describeEmbeddedApiError(e)
        toast.error(d.title, { description: d.description })
      }
    } finally {
      setLoading(false)
    }
  }, [centerId, courseId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (centerCtx.needsCenterSelection) {
    return (
      <SuperadminCenterRequiredScreen
        title="Kurs tahlili"
        description="Kurs bo'yicha tahlillar uchun markazni tanlang"
        icon={BookOpen}
        centers={centerCtx.centers}
        centersLoading={centerCtx.centersLoading}
        setCenterId={centerCtx.setCenterId}
      />
    )
  }

  if (!centerId) {
    return <div className="p-8 text-center text-muted-foreground">Markaz topilmadi</div>
  }

  if (permissionDenied) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push(withCenterQuery("/courses", centerId))}>Orqaga</Button>
        </div>
        <PageHeader title="Kurs tahlili" description="Kurs bo'yicha ko'rsatkichlar" icon={BookOpen} />
        <AccessDeniedPlaceholder
          title="Kurs tahliliga ruxsat yo'q"
          description="Kurs tafsilotlari va analitika odatda courses.read yoki tegishli ruxsatlarni talab qiladi."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => router.push(withCenterQuery("/courses", centerId))}>Orqaga</Button>
        {centerCtx.isSuperadmin && (
          <SuperadminCenterSelect
            centers={centerCtx.centers}
            centersLoading={centerCtx.centersLoading}
            value={centerCtx.effectiveCenterId}
            onChange={centerCtx.setCenterId}
          />
        )}
      </div>

      <PageHeader
        title={`Kurs Tahlili: ${course?.title || "Yuklanmoqda..."}`}
        description={`${centerCtx.centerDisplayName} · "${course?.code || ""}" kodi ostidagi ko'rsatkichlar`}
        icon={BookOpen}
        badge={course?.status === "PUBLISHED" ? "Faol" : "Nofaol"}
        badgeVariant={course?.status === "PUBLISHED" ? "default" : "secondary"}
      />

      {loading ? (
        <div className="flex h-[200px] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : analytics ? (
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
      ) : (
        <p className="text-sm text-muted-foreground">Ma&apos;lumot topilmadi.</p>
      )}
    </div>
  )
}
