"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Edit } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { TeacherForm, TeacherFormData } from "@/components/teachers/teacher-form"
import { useAuth } from "@/components/auth-provider"
import { buildCenterEndpoint } from "@/lib/endpoints"
import { Skeleton } from "@/components/ui/skeleton"

export default function EditTeacherPage() {
  const params = useParams()
  const id = Number(params?.id)
  const { user } = useAuth()
  const centerId = user?.administrator?.centerId
  
  const [data, setData] = useState<TeacherFormData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id || !centerId) return
    const fetchTeacher = async () => {
      try {
        const endpoint = buildCenterEndpoint(`teachers/${id}`, centerId)
        // const res = await apiClient<{ data: TeacherFormData }>(endpoint)
        // setData(res.data)
        
        // Mock payload until backend verified
        await new Promise(r => setTimeout(r, 600))
        setData({
          id,
          first_name: "Mock Akmal",
          last_name: "Rasulov",
          phone: "+998 90 111 22 33",
          specialization: "Ingliz tili",
          experience_years: 5,
          status: "ACTIVE"
        })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchTeacher()
  }, [id, centerId])

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-64 w-full max-w-4xl" />
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader 
        title="O'qituvchi ma'lumotlarini tahrirlash" 
        subtitle={data ? `${data.first_name} ${data.last_name}` : "Tahrirlash"}
        icon={Edit} 
      />
      <div className="px-1">
        {data && <TeacherForm initialData={data} isEdit={true} />}
      </div>
    </div>
  )
}
