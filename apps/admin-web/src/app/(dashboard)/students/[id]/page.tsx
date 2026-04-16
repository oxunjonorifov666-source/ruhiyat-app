"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { User, Mail, Phone, MapPin, Calendar, CreditCard, Activity, Edit, BookOpen } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { EntityDetailSection, DetailRow } from "@/components/crud/entity-detail-section"
import { useAuth } from "@/components/auth-provider"
import { buildCenterEndpoint } from "@/lib/endpoints"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RoleGuard } from "@/components/role-guard"

export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params?.id)
  const { user } = useAuth()
  const centerId = user?.administrator?.centerId
  
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id || !centerId) return
    const fetchStudent = async () => {
      try {
        // Mock payload until backend verified for detail view
        await new Promise(r => setTimeout(r, 600))
        setData({
          id,
          first_name: "Mock Ali",
          last_name: "Valiyev",
          phone: "+998 90 999 88 77",
          status: "ACTIVE",
          parent_phone: "+998 99 111 22 33",
          birth_date: "2010-05-15",
          address: "Toshkent shahar, Yunusobod",
          created_at: new Date().toISOString(),
          courses: [{ id: 1, name: "Matematika", group: "MAT-201" }],
          payments: [{ id: 101, amount: 500000, date: "2026-03-01", status: "COMPLETED" }]
        })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchStudent()
  }, [id, centerId])

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-64 col-span-2" />
        <Skeleton className="h-64 col-span-1" />
      </div>
    </div>
  )

  if (!data) return <div>Ma'lumot topilmadi</div>

  const HeaderAction = (
    <RoleGuard requires="update:students" fallback={<Button disabled variant="outline" size="sm"><Edit className="mr-2 size-4"/> Tahrirlash</Button>}>
      <Button variant="outline" size="sm" onClick={() => router.push(`/students/${id}/edit`)}>
        <Edit className="mr-2 size-4" />
        Tahrirlash
      </Button>
    </RoleGuard>
  )

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`${data.first_name} ${data.last_name}`}
        subtitle="O'quvchi ma'lumotlari"
        icon={User} 
      />

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="w-full lg:w-2/3 space-y-6">
          <EntityDetailSection title="Asosiy ma'lumotlar" icon={User} action={HeaderAction}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
              <DetailRow label="Ism" value={data.first_name} />
              <DetailRow label="Familiya" value={data.last_name} />
              <DetailRow label="Tug'ilgan sana" value={data.birth_date} />
              <DetailRow label="Holat" value={<Badge variant={data.status === "ACTIVE" ? "default" : "secondary"}>{data.status === "ACTIVE" ? "Faol" : "Nofaol"}</Badge>} />
              <DetailRow label="Ro'yxatdan o'tgan sana" value={new Date(data.created_at).toLocaleDateString("uz-UZ")} />
            </div>
          </EntityDetailSection>

          <EntityDetailSection title="Aloqa ma'lumotlari" icon={Phone}>
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <DetailRow label="Shaxsiy telefon" value={data.phone} />
              <DetailRow label="Ota-ona telefoni" value={data.parent_phone} />
              <DetailRow label="Manzil" value={data.address} colSpan={2} />
            </div>
          </EntityDetailSection>

          <EntityDetailSection title="Aktivlik tarixi" icon={Activity}>
            <div className="text-sm text-center text-muted-foreground py-8">
              Tarix moduli tez kunda ishga tushadi
            </div>
          </EntityDetailSection>
        </div>

        <div className="w-full lg:w-1/3 space-y-6 shrink-0">
          <EntityDetailSection title="Kurs va guruhlar" icon={BookOpen} className="bg-primary/5">
            {data.courses?.length > 0 ? (
              <div className="space-y-4">
                {data.courses.map((c: any) => (
                  <div key={c.id} className="flex justify-between items-center bg-background p-3 rounded-md border shadow-sm">
                    <div>
                      <div className="font-medium text-sm">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.group}</div>
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
            {data.payments?.length > 0 ? (
              <div className="space-y-4">
                {data.payments.map((p: any) => (
                  <div key={p.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium text-sm">{p.amount.toLocaleString()} UZS</div>
                      <div className="text-xs text-muted-foreground">{p.date}</div>
                    </div>
                    <Badge className="bg-green-500 hover:bg-green-600">To'langan</Badge>
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
