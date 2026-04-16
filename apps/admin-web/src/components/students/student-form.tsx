"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { apiClient } from "@/lib/api-client"
import { buildCenterEndpoint } from "@/lib/endpoints"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormFooter } from "@/components/crud/form-footer"
import { UserPlus, Contact, BookOpen } from "lucide-react"

export interface StudentFormData {
  id?: number
  first_name: string
  last_name: string
  phone: string
  status: string
  parent_phone?: string
  birth_date?: string
  address?: string
}

interface StudentFormProps {
  initialData?: StudentFormData
  isEdit?: boolean
}

export function StudentForm({ initialData, isEdit = false }: StudentFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const centerId = user?.administrator?.centerId
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const payload = Object.fromEntries(formData.entries())

    try {
      if (isEdit && initialData?.id) {
        const endpoint = buildCenterEndpoint(`students/${initialData.id}`, centerId)
        // await apiClient(endpoint, { method: "PUT", body: payload })
        await new Promise(r => setTimeout(r, 800)) // mock
        toast.success("O'quvchi ma'lumotlari yangilandi")
      } else {
        const endpoint = buildCenterEndpoint("students", centerId)
        // await apiClient(endpoint, { method: "POST", body: payload })
        await new Promise(r => setTimeout(r, 800)) // mock
        toast.success("O'quvchi muvaffaqiyatli qo'shildi")
      }
      
      router.push("/students")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex items-center gap-2">
            <UserPlus className="size-5 text-primary" />
            <div>
              <CardTitle>Asosiy ma'lumotlar</CardTitle>
              <CardDescription>O'quvchining shaxsiy ma'lumotlari</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Ism <span className="text-red-500">*</span></Label>
              <Input id="first_name" name="first_name" defaultValue={initialData?.first_name} required placeholder="Ali" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Familiya <span className="text-red-500">*</span></Label>
              <Input id="last_name" name="last_name" defaultValue={initialData?.last_name} required placeholder="Valiyev" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birth_date">Tug'ilgan sana</Label>
              <Input id="birth_date" name="birth_date" type="date" defaultValue={initialData?.birth_date} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Holat</Label>
              <Select name="status" defaultValue={initialData?.status || "ACTIVE"}>
                <SelectTrigger>
                  <SelectValue placeholder="Holatni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Faol</SelectItem>
                  <SelectItem value="INACTIVE">Nofaol</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex items-center gap-2">
            <Contact className="size-5 text-primary" />
            <div>
              <CardTitle>Aloqa ma'lumotlari</CardTitle>
              <CardDescription>Telefon va manzil</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon raqam <span className="text-red-500">*</span></Label>
              <Input id="phone" name="phone" defaultValue={initialData?.phone} required placeholder="+998 90 123 45 67" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent_phone">Ota-ona telefon raqami</Label>
              <Input id="parent_phone" name="parent_phone" defaultValue={initialData?.parent_phone} placeholder="+998 90 123 45 67" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Yashash manzili</Label>
            <Input id="address" name="address" defaultValue={initialData?.address} placeholder="Toshkent shahar, Yunusobod tumani..." />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <FormFooter loading={loading} />
      </Card>
    </form>
  )
}
