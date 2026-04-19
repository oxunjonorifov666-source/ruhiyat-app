"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useSuperadminCenter } from "@/hooks/use-superadmin-center"
import { apiClient } from "@/lib/api-client"
import { centerIdQuery, withCenterQuery } from "@/lib/endpoints"
import {
  describeEmbeddedApiError,
  type EmbeddedApiErrorDescription,
} from "@/lib/api-error"
import { EmbeddedApiErrorBanner } from "@/components/embedded-api-error-banner"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { FormFooter } from "@/components/crud/form-footer"
import { UserPlus, Contact } from "lucide-react"

export interface TeacherFormData {
  id?: number
  firstName: string
  lastName: string
  phone: string
  email?: string
  subject?: string
  isActive: boolean
}

interface TeacherFormProps {
  initialData?: TeacherFormData
  isEdit?: boolean
}

function buildBody(state: {
  firstName: string
  lastName: string
  phone: string
  email: string
  subject: string
  isActive: boolean
}) {
  return {
    firstName: state.firstName.trim(),
    lastName: state.lastName.trim(),
    phone: state.phone.trim() || null,
    email: state.email.trim() || null,
    subject: state.subject.trim() || null,
    isActive: state.isActive,
  }
}

export function TeacherForm({ initialData, isEdit = false }: TeacherFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const centerCtx = useSuperadminCenter(user)
  const centerId = centerCtx.effectiveCenterId
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<EmbeddedApiErrorDescription | null>(null)
  const [firstName, setFirstName] = useState(initialData?.firstName ?? "")
  const [lastName, setLastName] = useState(initialData?.lastName ?? "")
  const [phone, setPhone] = useState(initialData?.phone ?? "")
  const [email, setEmail] = useState(initialData?.email ?? "")
  const [subject, setSubject] = useState(initialData?.subject ?? "")
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true)

  useEffect(() => {
    if (!initialData) return
    setFirstName(initialData.firstName ?? "")
    setLastName(initialData.lastName ?? "")
    setPhone(initialData.phone ?? "")
    setEmail(initialData.email ?? "")
    setSubject(initialData.subject ?? "")
    setIsActive(initialData.isActive ?? true)
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!centerId) {
      toast.error("Markaz aniqlanmadi")
      return
    }

    const body = buildBody({ firstName, lastName, phone, email, subject, isActive })
    if (!body.firstName || !body.lastName) {
      toast.error("Ism va familiya majburiy")
      return
    }
    if (!body.phone) {
      toast.error("Telefon raqami majburiy")
      return
    }

    setLoading(true)
    setApiError(null)
    const params = centerIdQuery(centerId)
    try {
      if (isEdit && initialData?.id) {
        await apiClient(`/teachers/${initialData.id}`, {
          method: "PATCH",
          body,
          params,
        })
        toast.success("O'qituvchi ma'lumotlari yangilandi")
      } else {
        await apiClient("/teachers", {
          method: "POST",
          body,
          params,
        })
        toast.success("O'qituvchi muvaffaqiyatli qo'shildi")
      }
      router.push(withCenterQuery("/teachers", centerId))
      router.refresh()
    } catch (error: unknown) {
      const d = describeEmbeddedApiError(error)
      setApiError(d)
      toast.error(d.title, { description: d.description })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <EmbeddedApiErrorBanner error={apiError} />

      <Card>
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex items-center gap-2">
            <UserPlus className="size-5 text-primary" />
            <div>
              <CardTitle>Asosiy ma'lumotlar</CardTitle>
              <CardDescription>O'qituvchining shaxsiy ma'lumotlari</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Ism <span className="text-red-500">*</span></Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="Akmal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Familiya <span className="text-red-500">*</span></Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="Rasulov"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Dars beradigan fan / mutaxassislik</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Masalan: Matematika, Ingliz tili"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
            <div>
              <Label>Holat</Label>
              <p className="text-xs text-muted-foreground">Faol / nofaol</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex items-center gap-2">
            <Contact className="size-5 text-primary" />
            <div>
              <CardTitle>Aloqa ma'lumotlari</CardTitle>
              <CardDescription>Telefon va email</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon raqam <span className="text-red-500">*</span></Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="+998 90 123 45 67"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="akmal@example.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <FormFooter loading={loading} />
      </Card>
    </form>
  )
}
