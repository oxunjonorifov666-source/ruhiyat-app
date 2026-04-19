"use client"

import { useCallback, useEffect, useState } from "react"
import { Settings, Building2, MapPin, Phone, Loader2, Save } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { RoleGuard } from "@/components/role-guard"
import { apiClient } from "@/lib/api-client"
import { classifyApiError, describeEmbeddedApiError } from "@/lib/api-error"
import { AccessDeniedPlaceholder } from "@/components/access-denied-placeholder"
import { Skeleton } from "@/components/ui/skeleton"
import { useSuperadminCenter } from "@/hooks/use-superadmin-center"
import { SuperadminCenterRequiredScreen, SuperadminCenterSelect } from "@/components/superadmin-center-select"

/** Response from GET /education-centers/:id (subset used by this page) */
interface EducationCenterResponse {
  id: number
  name: string
  address: string | null
  phone: string | null
  email: string | null
  description: string | null
  isActive: boolean
}

type FormState = {
  name: string
  description: string
  phone: string
  email: string
  address: string
  isActive: boolean
}

const emptyForm: FormState = {
  name: "",
  description: "",
  phone: "",
  email: "",
  address: "",
  isActive: true,
}

function mapCenterToForm(c: EducationCenterResponse): FormState {
  return {
    name: c.name ?? "",
    description: c.description ?? "",
    phone: c.phone ?? "",
    email: c.email ?? "",
    address: c.address ?? "",
    isActive: c.isActive ?? true,
  }
}

function buildPatchBody(f: FormState) {
  return {
    name: f.name.trim(),
    description: f.description.trim() || null,
    phone: f.phone.trim() || null,
    email: f.email.trim() || null,
    address: f.address.trim() || null,
    isActive: f.isActive,
  }
}

export default function CenterSettingsPage() {
  const { user } = useAuth()
  const centerCtx = useSuperadminCenter(user)
  const centerId = centerCtx.effectiveCenterId
  const centerNameFromSession = centerCtx.centerDisplayName || "Ta'lim markazi"

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [loadedName, setLoadedName] = useState(centerNameFromSession)

  const loadCenter = useCallback(async () => {
    if (centerId == null) return
    setLoading(true)
    setPermissionDenied(false)
    try {
      const res = await apiClient<EducationCenterResponse>(`/education-centers/${centerId}`)
      setForm(mapCenterToForm(res))
      setLoadedName(res.name || centerNameFromSession)
    } catch (e: unknown) {
      const { permissionDenied: denied } = classifyApiError(e)
      if (denied) {
        setPermissionDenied(true)
      } else {
        const d = describeEmbeddedApiError(e)
        toast.error(d.title, { description: d.description })
      }
      setForm(emptyForm)
    } finally {
      setLoading(false)
    }
  }, [centerId, centerNameFromSession])

  useEffect(() => {
    if (centerId == null) {
      setLoading(false)
      return
    }
    loadCenter()
  }, [centerId, loadCenter])

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (centerId == null) {
      toast.error("Markaz aniqlanmadi")
      return
    }
    if (!form.name.trim()) {
      toast.error("Markaz nomi majburiy")
      return
    }

    setSaving(true)
    try {
      const updated = await apiClient<EducationCenterResponse>(`/education-centers/${centerId}`, {
        method: "PATCH",
        body: buildPatchBody(form),
      })
      setForm(mapCenterToForm(updated))
      setLoadedName(updated.name)
      toast.success("Sozlamalar saqlandi")
    } catch (e: unknown) {
      const d = describeEmbeddedApiError(e)
      toast.error(d.title, { description: d.description })
    } finally {
      setSaving(false)
    }
  }

  if (centerCtx.needsCenterSelection) {
    return (
      <SuperadminCenterRequiredScreen
        title="Markaz sozlamalari"
        description="Tahrirlash uchun avval ta'lim markazini tanlang"
        icon={Settings}
        centers={centerCtx.centers}
        centersLoading={centerCtx.centersLoading}
        setCenterId={centerCtx.setCenterId}
      />
    )
  }

  if (!centerId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Markaz topilmadi — administrator hisobi bilan kiring.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full max-w-lg" />
        <div className="flex flex-col md:flex-row gap-6">
          <Skeleton className="h-48 w-full md:w-1/4" />
          <Skeleton className="h-96 flex-1" />
        </div>
      </div>
    )
  }

  if (permissionDenied) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Markaz sozlamalari"
          description="Markaz konfiguratsiyasi"
          icon={Settings}
        />
        <AccessDeniedPlaceholder
          title="Markaz sozlamalariga ruxsat yo'q"
          description="Markaz profilini ko'rish va tahrirlash odatda markaz administratori yoki tegishli ruxsatni talab qiladi."
        />
      </div>
    )
  }

  const displayName = loadedName || form.name || centerNameFromSession

  return (
    <div className="space-y-6">
      <PageHeader
        title="Markaz sozlamalari"
        description={`${displayName} konfiguratsiyasini boshqarish`}
        icon={Settings}
        actions={
          centerCtx.isSuperadmin ? (
            <SuperadminCenterSelect
              centers={centerCtx.centers}
              centersLoading={centerCtx.centersLoading}
              value={centerCtx.effectiveCenterId}
              onChange={centerCtx.setCenterId}
            />
          ) : undefined
        }
      />

      <div className="flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-1/4 lg:w-1/5 shrink-0">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
                  <Building2 className="size-10 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{displayName}</h3>
                  <p className="text-sm text-muted-foreground mt-1">ID: #{centerId}</p>
                  <Badge variant={form.isActive ? "default" : "secondary"} className="mt-2">
                    {form.isActive ? "Faol" : "Nofaol"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        <section className="flex-1 min-w-0">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="general">
                <Building2 className="size-4 mr-2" /> Umumiy
              </TabsTrigger>
              <TabsTrigger value="contact">
                <Phone className="size-4 mr-2" /> Aloqa
              </TabsTrigger>
              <TabsTrigger value="address">
                <MapPin className="size-4 mr-2" /> Manzil
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <Card>
                <form onSubmit={handleSave}>
                  <CardHeader>
                    <CardTitle>Umumiy ma'lumotlar</CardTitle>
                    <CardDescription>Markaz nomi, tavsif va holat.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Markaz nomi</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Tavsif</Label>
                      <Textarea
                        id="description"
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Markaz haqida qisqa yoki to'liq ma'lumot"
                        rows={5}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
                      <div>
                        <Label htmlFor="isActive">Markaz faolligi</Label>
                        <p className="text-xs text-muted-foreground">Nofaol markaz tizimda cheklanishi mumkin</p>
                      </div>
                      <Switch
                        id="isActive"
                        checked={form.isActive}
                        onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="border-t px-6 py-4">
                    <RoleGuard requires="update:settings" fallback={<Button disabled>Ruxsat yo'q</Button>}>
                      <Button type="submit" disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Saqlash
                      </Button>
                    </RoleGuard>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="contact">
              <Card>
                <form onSubmit={handleSave}>
                  <CardHeader>
                    <CardTitle>Aloqa ma'lumotlari</CardTitle>
                    <CardDescription>Telefon va email — bazaga yoziladi.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Asosiy telefon</Label>
                        <Input
                          id="phone"
                          value={form.phone}
                          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                          placeholder="+998 90 123 45 67"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email manzil</Label>
                        <Input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                          placeholder="info@markaz.uz"
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t px-6 py-4">
                    <RoleGuard requires="update:settings" fallback={<Button disabled>Ruxsat yo'q</Button>}>
                      <Button type="submit" disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Saqlash
                      </Button>
                    </RoleGuard>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="address">
              <Card>
                <form onSubmit={handleSave}>
                  <CardHeader>
                    <CardTitle>Manzil</CardTitle>
                    <CardDescription>Bitta matn sifatida saqlanadi (ofis manzili).</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="address">Manzil</Label>
                      <Textarea
                        id="address"
                        value={form.address}
                        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                        placeholder="Shahar, tuman, ko'cha va uy"
                        rows={5}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="border-t px-6 py-4">
                    <RoleGuard requires="update:settings" fallback={<Button disabled>Ruxsat yo'q</Button>}>
                      <Button type="submit" disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Saqlash
                      </Button>
                    </RoleGuard>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </div>
  )
}
