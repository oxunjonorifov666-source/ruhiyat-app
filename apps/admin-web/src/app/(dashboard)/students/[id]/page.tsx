"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { User, Mail, Phone, CreditCard, Edit, BookOpen } from "lucide-react"
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

interface EnrollmentRow {
  id: number
  course: { id: number; name: string; code?: string | null }
  group: { id: number; name: string } | null
}

interface PaymentRow {
  id: number
  amount: number
  currency: string
  status: string
  paymentDate: string | null
  createdAt: string
}

interface StudentDetailApi {
  id: number
  firstName: string
  lastName: string
  phone: string | null
  email: string | null
  dateOfBirth: string | null
  isActive: boolean
  createdAt: string
  enrollments?: EnrollmentRow[]
  payments?: PaymentRow[]
}

export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params?.id)
  const { user } = useAuth()
  const centerCtx = useSuperadminCenter(user)
  const centerId = centerCtx.effectiveCenterId

  const [data, setData] = useState<StudentDetailApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [loadError, setLoadError] = useState<EmbeddedApiErrorDescription | null>(null)

  useEffect(() => {
    if (!id || Number.isNaN(id) || !centerId) {
      if (!centerId && user) setLoading(false)
      return
    }

    let cancelled = false
    const fetchStudent = async () => {
      setLoading(true)
      setPermissionDenied(false)
      try {
        const res = await apiClient<StudentDetailApi>(`/students/${id}`, {
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
    fetchStudent()
    return () => {
      cancelled = true
    }
  }, [id, centerId, user, router])

  if (centerCtx.needsCenterSelection) {
    return (
      <SuperadminCenterRequiredScreen
        title="O'quvchi kartasi"
        description="Batafsil ko'rish uchun markazni tanlang"
        icon={User}
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
        <PageHeader title="O'quvchi" description="Batafsil ma'lumot" icon={User} />
        <AccessDeniedPlaceholder
          title="O'quvchi kartasiga ruxsat yo'q"
          description="Ushbu o'quvchini ko'rish students.read yoki markaz chegarasidagi ruxsatni talab qiladi."
        />
        <Button variant="outline" onClick={() => router.push(withCenterQuery("/students", centerId))}>
          Ro'yxatga qaytish
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-2" />
          <Skeleton className="h-64 col-span-1" />
        </div>
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
          <Button variant="outline" onClick={() => router.push(withCenterQuery("/students", centerId))}>
            Ro'yxatga qaytish
          </Button>
        </div>
      </div>
    )
  }

  const dob = data.dateOfBirth
    ? new Date(data.dateOfBirth).toLocaleDateString("uz-UZ")
    : "—"

  const HeaderAction = (
    <RoleGuard requires="update:students" fallback={<Button disabled variant="outline" size="sm"><Edit className="mr-2 size-4"/> Tahrirlash</Button>}>
      <Button variant="outline" size="sm" onClick={() => router.push(withCenterQuery(`/students/${id}/edit`, centerId))}>
        <Edit className="mr-2 size-4" />
        Tahrirlash
      </Button>
    </RoleGuard>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${data.firstName} ${data.lastName}`}
        subtitle="O'quvchi ma'lumotlari"
        icon={User}
      />

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="w-full lg:w-2/3 space-y-6">
          <EntityDetailSection title="Asosiy ma'lumotlar" icon={User} action={HeaderAction}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
              <DetailRow label="Ism" value={data.firstName} />
              <DetailRow label="Familiya" value={data.lastName} />
              <DetailRow label="Tug'ilgan sana" value={dob} />
              <DetailRow
                label="Holat"
                value={
                  <Badge variant={data.isActive ? "default" : "secondary"}>
                    {data.isActive ? "Faol" : "Nofaol"}
                  </Badge>
                }
              />
              <DetailRow
                label="Ro'yxatdan o'tgan sana"
                value={new Date(data.createdAt).toLocaleDateString("uz-UZ")}
              />
            </div>
          </EntityDetailSection>

          <EntityDetailSection title="Aloqa ma'lumotlari" icon={Phone}>
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <DetailRow label="Telefon" value={data.phone || "—"} />
              <DetailRow
                label="Email"
                value={data.email ? <span className="flex items-center gap-1"><Mail className="size-3" />{data.email}</span> : "—"}
              />
            </div>
          </EntityDetailSection>
        </div>

        <div className="w-full lg:w-1/3 space-y-6 shrink-0">
          <EntityDetailSection title="Kurs va guruhlar" icon={BookOpen} className="bg-primary/5">
            {data.enrollments && data.enrollments.length > 0 ? (
              <div className="space-y-4">
                {data.enrollments.map((e) => (
                  <div
                    key={e.id}
                    className="flex justify-between items-center bg-background p-3 rounded-md border shadow-sm"
                  >
                    <div>
                      <div className="font-medium text-sm">{e.course?.name ?? "Kurs"}</div>
                      <div className="text-xs text-muted-foreground">
                        {e.group?.name ? `Guruh: ${e.group.name}` : "Guruh biriktirilmagan"}
                      </div>
                    </div>
                    <Badge variant="outline">Faol</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-center text-muted-foreground py-4">Guruhlar biriktirilmagan</div>
            )}
          </EntityDetailSection>

          <EntityDetailSection title="So'nggi to'lovlar" icon={CreditCard}>
            {data.payments && data.payments.length > 0 ? (
              <div className="space-y-4">
                {data.payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {p.amount.toLocaleString()} {p.currency || "UZS"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(p.paymentDate || p.createdAt) &&
                          new Date(p.paymentDate || p.createdAt).toLocaleDateString("uz-UZ")}
                      </div>
                    </div>
                    <Badge variant="outline">{p.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-center text-muted-foreground py-4">To'lovlar mavjud emas</div>
            )}
          </EntityDetailSection>
        </div>
      </div>
    </div>
  )
}
