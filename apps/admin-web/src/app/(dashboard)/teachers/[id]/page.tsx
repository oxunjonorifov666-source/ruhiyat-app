"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { GraduationCap, Mail, Phone, BookOpen, Edit } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { EntityDetailSection, DetailRow } from "@/components/crud/entity-detail-section"
import { useAuth } from "@/components/auth-provider"
import { apiClient } from "@/lib/api-client"
import { centerIdQuery, withCenterQuery } from "@/lib/endpoints"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RoleGuard } from "@/components/role-guard"
import { toast } from "sonner"
import { classifyApiError, describeEmbeddedApiError, type EmbeddedApiErrorDescription } from "@/lib/api-error"
import { EmbeddedApiErrorBanner } from "@/components/embedded-api-error-banner"
import { AccessDeniedPlaceholder } from "@/components/access-denied-placeholder"
import { useSuperadminCenter } from "@/hooks/use-superadmin-center"
import { SuperadminCenterRequiredScreen } from "@/components/superadmin-center-select"

interface TeacherDetailApi {
  id: number
  firstName: string
  lastName: string
  phone: string | null
  email: string | null
  subject: string | null
  isActive: boolean
  createdAt: string
}

export default function TeacherDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params?.id)
  const { user } = useAuth()
  const centerCtx = useSuperadminCenter(user)
  const centerId = centerCtx.effectiveCenterId

  const [data, setData] = useState<TeacherDetailApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [loadError, setLoadError] = useState<EmbeddedApiErrorDescription | null>(null)

  useEffect(() => {
    if (!id || Number.isNaN(id) || !centerId) {
      if (!centerId && user) setLoading(false)
      return
    }

    let cancelled = false
    const load = async () => {
      setLoading(true)
      setPermissionDenied(false)
      setLoadError(null)
      try {
        const res = await apiClient<TeacherDetailApi>(`/teachers/${id}`, {
          params: centerIdQuery(centerId),
        })
        if (!cancelled) setData(res)
      } catch (e: unknown) {
        const { permissionDenied: denied } = classifyApiError(e)
        if (denied) {
          if (!cancelled) setPermissionDenied(true)
        } else {
          const d = describeEmbeddedApiError(e)
          if (!cancelled) setLoadError(d)
          toast.error(d.title, { description: d.description })
        }
        if (!cancelled) setData(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id, centerId, user])

  if (centerCtx.needsCenterSelection) {
    return (
      <SuperadminCenterRequiredScreen
        title="O'qituvchi"
        description="Batafsil ko'rish uchun markazni tanlang"
        icon={GraduationCap}
        centers={centerCtx.centers}
        centersLoading={centerCtx.centersLoading}
        setCenterId={centerCtx.setCenterId}
      />
    )
  }

  if (!centerId) {
    return <div className="p-8 text-center text-muted-foreground">Markaz topilmadi</div>
  }

  if (!loading && permissionDenied) {
    return (
      <div className="space-y-6">
        <PageHeader title="O'qituvchi" description="Batafsil ma'lumot" icon={GraduationCap} />
        <AccessDeniedPlaceholder
          title="O'qituvchi kartasiga ruxsat yo'q"
          description="Ushbu o'qituvchini ko'rish teachers.read yoki tegishli ruxsatni talab qiladi."
        />
        <Button variant="outline" onClick={() => router.push(withCenterQuery("/teachers", centerId))}>
          Ro'yxatga qaytish
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full max-w-3xl" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-4 p-8 max-w-2xl mx-auto">
        <EmbeddedApiErrorBanner error={loadError} />
        {!loadError && (
          <p className="text-center text-muted-foreground">Ma'lumot topilmadi</p>
        )}
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => router.push(withCenterQuery("/teachers", centerId))}>
            Ro'yxatga qaytish
          </Button>
        </div>
      </div>
    )
  }

  const HeaderAction = (
    <RoleGuard requires="update:teachers" fallback={<Button disabled variant="outline" size="sm"><Edit className="mr-2 size-4"/> Tahrirlash</Button>}>
      <Button variant="outline" size="sm" onClick={() => router.push(withCenterQuery(`/teachers/${id}/edit`, centerId))}>
        <Edit className="mr-2 size-4" />
        Tahrirlash
      </Button>
    </RoleGuard>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${data.firstName} ${data.lastName}`}
        subtitle="O'qituvchi ma'lumotlari"
        icon={GraduationCap}
      />

      <div className="max-w-3xl space-y-6">
        <EntityDetailSection title="Asosiy ma'lumotlar" icon={GraduationCap} action={HeaderAction}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
            <DetailRow label="Ism" value={data.firstName} />
            <DetailRow label="Familiya" value={data.lastName} />
            <DetailRow
              label="Mutaxassislik / fan"
              value={
                <span className="flex items-center gap-2">
                  <BookOpen className="size-4 text-muted-foreground" />
                  {data.subject || "—"}
                </span>
              }
            />
            <DetailRow
              label="Holat"
              value={
                <Badge variant={data.isActive ? "default" : "secondary"}>
                  {data.isActive ? "Faol" : "Nofaol"}
                </Badge>
              }
            />
            <DetailRow
              label="Ro'yxatga olingan"
              value={new Date(data.createdAt).toLocaleDateString("uz-UZ")}
            />
          </div>
        </EntityDetailSection>

        <EntityDetailSection title="Aloqa" icon={Phone}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
            <DetailRow label="Telefon" value={data.phone || "—"} />
            <DetailRow
              label="Email"
              value={
                data.email ? (
                  <span className="flex items-center gap-2">
                    <Mail className="size-4" />
                    {data.email}
                  </span>
                ) : (
                  "—"
                )
              }
            />
          </div>
        </EntityDetailSection>
      </div>
    </div>
  )
}
