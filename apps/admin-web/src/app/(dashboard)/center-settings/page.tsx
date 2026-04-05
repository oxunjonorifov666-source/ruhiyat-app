"use client"

import { Settings, Building2, Clock, MapPin, Image, Phone, Mail, Globe } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"

const settingsSections = [
  {
    title: "Umumiy ma'lumotlar",
    description: "Markaz nomi, tavsifi va asosiy ma'lumotlari",
    icon: Building2,
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    fields: ["Markaz nomi", "Qisqa tavsif", "To'liq tavsif", "Logo"],
    status: "Tez kunda",
  },
  {
    title: "Ish vaqti",
    description: "Markaz ish kunlari va soatlari",
    icon: Clock,
    color: "text-green-600",
    bg: "bg-green-100 dark:bg-green-900/30",
    fields: ["Dushanba-Juma", "Shanba", "Yakshanba", "Dam olish kunlari"],
    status: "Tez kunda",
  },
  {
    title: "Manzil",
    description: "Markaz manzili va joylashuvi",
    icon: MapPin,
    color: "text-red-600",
    bg: "bg-red-100 dark:bg-red-900/30",
    fields: ["Shahar", "Tuman", "Ko'cha", "Xarita koordinatalari"],
    status: "Tez kunda",
  },
  {
    title: "Aloqa ma'lumotlari",
    description: "Telefon, email va ijtimoiy tarmoqlar",
    icon: Phone,
    color: "text-purple-600",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    fields: ["Telefon raqami", "Email", "Telegram", "Web sayt"],
    status: "Tez kunda",
  },
]

export default function CenterSettingsPage() {
  const { user } = useAuth()
  const centerName = user?.administrator?.center?.name

  return (
    <div className="space-y-6">
      <PageHeader
        title="Markaz sozlamalari"
        subtitle={centerName ? `${centerName} sozlamalari` : "Ta'lim markazi sozlamalari"}
        icon={Settings}
      />

      {centerName && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="size-7 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{centerName}</h3>
                <p className="text-sm text-muted-foreground">Ta'lim markazi</p>
              </div>
              <Badge className="ml-auto" variant="default">Faol</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {settingsSections.map((section, i) => (
          <Card key={i} className="transition-all hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex size-10 items-center justify-center rounded-lg ${section.bg}`}>
                    <section.icon className={`size-5 ${section.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{section.title}</CardTitle>
                    <CardDescription className="mt-0.5">{section.description}</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">{section.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {section.fields.map((field, j) => (
                  <div key={j} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                    <span className="text-sm">{field}</span>
                    <span className="text-xs text-muted-foreground">—</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
