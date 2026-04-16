"use client"

import { useState } from "react"
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
import { toast } from "sonner"
import { RoleGuard } from "@/components/role-guard"
import { buildCenterEndpoint } from "@/lib/endpoints"
import { apiClient } from "@/lib/api-client"

export default function CenterSettingsPage() {
  const { user } = useAuth()
  const centerId = user?.administrator?.centerId
  const centerName = user?.administrator?.center?.name || "Ta'lim markazi"
  
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    try {
      // API call placeholder using standard pattern
      // const endpoint = buildCenterEndpoint("settings", centerId)
      // await apiClient(endpoint, { method: "PUT", body: Object.fromEntries(fd.entries()) })
      
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success("Sozlamalar muvaffaqiyatli saqlandi")
    } catch (e: any) {
      toast.error(e.message || "Xatolik yuz berdi")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Markaz sozlamalari"
        description={`${centerName} konfiguratsiyasini boshqarish`}
        icon={Settings}
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
                  <h3 className="font-semibold text-lg">{centerName}</h3>
                  <p className="text-sm text-muted-foreground mt-1">ID: #{centerId}</p>
                  <Badge variant="default" className="mt-2">Faol</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        <section className="flex-1 min-w-0">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="general"><Building2 className="size-4 mr-2" /> Umumiy</TabsTrigger>
              <TabsTrigger value="contact"><Phone className="size-4 mr-2" /> Aloqa</TabsTrigger>
              <TabsTrigger value="address"><MapPin className="size-4 mr-2" /> Manzil</TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general">
              <Card>
                <form onSubmit={handleSave}>
                  <CardHeader>
                    <CardTitle>Umumiy ma'lumotlar</CardTitle>
                    <CardDescription>Markazning asosiy profili va identifikatsiyasi.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Markaz nomi</Label>
                      <Input id="name" name="name" defaultValue={centerName} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="short_desc">Qisqa tavsif</Label>
                      <Input id="short_desc" name="short_desc" placeholder="Tizimda ko'rinadigan qisqa eslatma" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">To'liq tavsif</Label>
                      <Textarea id="description" name="description" placeholder="Markaz haqida to'liq ma'lumot" rows={4} />
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

            {/* Contact Tab */}
            <TabsContent value="contact">
              <Card>
                <form onSubmit={handleSave}>
                  <CardHeader>
                    <CardTitle>Aloqa ma'lumotlari</CardTitle>
                    <CardDescription>Mijozlar bilishi kerak bo'lgan kontakt raqamlar va ijtimoiy tarmoqlar.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Asosiy telefon</Label>
                        <Input id="phone" name="phone" placeholder="+998 90 123 45 67" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email manzil</Label>
                        <Input id="email" name="email" type="email" placeholder="info@markaz.uz" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="telegram">Telegram</Label>
                        <Input id="telegram" name="telegram" placeholder="@username" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input id="instagram" name="instagram" placeholder="@username" />
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

            {/* Address Tab */}
            <TabsContent value="address">
              <Card>
                <form onSubmit={handleSave}>
                  <CardHeader>
                    <CardTitle>Manzil va joylashuv</CardTitle>
                    <CardDescription>O'quv markazining ofis manzili.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="city">Viloyat / Shahar</Label>
                        <Input id="city" name="city" placeholder="Toshkent shahri" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="district">Tuman</Label>
                        <Input id="district" name="district" placeholder="Yunusobod tumani" />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="street">Ko'cha va uy</Label>
                      <Input id="street" name="street" placeholder="Amir Temur ko'chasi, 108-uy" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="coordinates">Xarita koordinatalari</Label>
                      <Input id="coordinates" name="coordinates" placeholder="41.311151, 69.279737" />
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
