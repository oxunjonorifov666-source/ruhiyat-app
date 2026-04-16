"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Edit } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StudentForm, StudentFormData } from "@/components/students/student-form"
import { useAuth } from "@/components/auth-provider"
import { buildCenterEndpoint } from "@/lib/endpoints"
import { apiClient } from "@/lib/api-client"
import { Skeleton } from "@/components/ui/skeleton"

export default function EditStudentPage() {
  const params = useParams()
  const id = Number(params?.id)
  const { user } = useAuth()
  const centerId = user?.administrator?.centerId
  
  const [data, setData] = useState<StudentFormData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id || !centerId) return
    const fetchStudent = async () => {
      try {
        const endpoint = buildCenterEndpoint(`students/${id}`, centerId)
        // const res = await apiClient<{ data: StudentFormData }>(endpoint)
        // setData(res.data)
        
        // Mock payload until backend verified
        await new Promise(r => setTimeout(r, 600))
        setData({
          id,
          first_name: "Mock Ali",
          last_name: "Valiyev",
          phone: "+998 90 999 88 77",
          status: "ACTIVE"
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
      <Skeleton className="h-64 w-full max-w-4xl" />
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader 
        title="O'quvchi ma'lumotlarini tahrirlash" 
        subtitle={data ? `${data.first_name} ${data.last_name}` : "Tahrirlash"}
        icon={Edit} 
      />
      <div className="px-1">
        {data && <StudentForm initialData={data} isEdit={true} />}
      </div>
    </div>
  )
}
