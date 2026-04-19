"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Edit } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StudentForm, StudentFormData } from "@/components/students/student-form"
import { useAuth } from "@/components/auth-provider"
import { apiClient } from "@/lib/api-client"
import { centerIdQuery } from "@/lib/endpoints"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { classifyApiError, describeEmbeddedApiError, type EmbeddedApiErrorDescription } from "@/lib/api-error"
import { EmbeddedApiErrorBanner } from "@/components/embedded-api-error-banner"
import { AccessDeniedPlaceholder } from "@/components/access-denied-placeholder"
import { useSuperadminCenter } from "@/hooks/use-superadmin-center"
import { SuperadminCenterRequiredScreen } from "@/components/superadmin-center-select"

interface StudentApi {
  id: number
  firstName: string
  lastName: string
  phone: string | null
  email: string | null
  dateOfBirth: string | null
  isActive: boolean
}

function mapToForm(s: StudentApi): StudentFormData {
  return {
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    phone: s.phone ?? "",
    email: s.email ?? "",
    dateOfBirth: s.dateOfBirth ?? undefined,
    isActive: s.isActive,
  }
}

export default function EditStudentPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params?.id)
  const { user } = useAuth()
  const centerCtx = useSuperadminCenter(user)
  const centerId = centerCtx.effectiveCenterId

  const [data, setData] = useState<StudentFormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [loadError, setLoadError] = useState<EmbeddedApiErrorDescription | null>(null)

  useEffect(() => {
    if (!id || Number.isNaN(id) || !centerId) {
      if (!centerId && user) {
        setLoading(false)
      }
      return
    }

    let cancelled = false
    const load = async () => {
      setLoading(true)
      setPermissionDenied(false)
      setLoadError(null)
      try {
        const res = await apiClient<StudentApi>(`/students/${id}`, {
          params: centerIdQuery(centerId),
        })
        if (!cancelled) setData(mapToForm(res))
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
  }, [id, centerId, user, router])

  if (centerCtx.needsCenterSelection) {
    return (
      <SuperadminCenterRequiredScreen
        title="O'quvchini tahrirlash"
        description="Tahrirlash uchun markazni tanlang"
        icon={Edit}
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
        <PageHeader title="O'quvchini tahrirlash" subtitle="Ruxsat yo'q" icon={Edit} />
        <AccessDeniedPlaceholder
          title="Tahrirlashga ruxsat yo'q"
          description="O'quvchi ma'lumotlarini o'zgartirish students.write ruxsatini talab qiladi."
        />
        <Button variant="outline" onClick={() => router.push("/students")}>Ro'yxatga qaytish</Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full max-w-4xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="O'quvchi ma'lumotlarini tahrirlash"
        subtitle={data ? `${data.firstName} ${data.lastName}` : "Tahrirlash"}
        icon={Edit}
      />
      <div className="px-1">
        {data ? (
          <StudentForm initialData={data} isEdit={true} />
        ) : (
          <div className="space-y-4 max-w-4xl">
            <EmbeddedApiErrorBanner error={loadError} />
            {!loadError && (
              <p className="text-center text-muted-foreground">Ma'lumot yuklanmadi</p>
            )}
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => router.push("/students")}>
                Ro'yxatga qaytish
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
