"use client"

import { Lock, Key, Shield, Clock, AlertTriangle, CheckCircle, Eye, UserX } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const securitySections = [
  {
    title: "Parol siyosati",
    description: "Parol murakkabligi va yangilash qoidalari",
    icon: Key,
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    items: [
      { label: "Minimal uzunlik", value: "8 belgi", status: "active" },
      { label: "Katta-kichik harflar", value: "Talab etiladi", status: "active" },
      { label: "Raqamlar", value: "Talab etiladi", status: "active" },
      { label: "Maxsus belgilar", value: "Tavsiya etiladi", status: "warning" },
    ],
  },
  {
    title: "Sessiya boshqaruvi",
    description: "Avtomatik chiqish va sessiya muddati",
    icon: Clock,
    color: "text-green-600",
    bg: "bg-green-100 dark:bg-green-900/30",
    items: [
      { label: "Sessiya muddati", value: "24 soat", status: "active" },
      { label: "Nofaol sessiya", value: "30 daqiqa", status: "active" },
      { label: "Bir vaqtda sessiyalar", value: "3 ta", status: "active" },
      { label: "IP tekshirish", value: "O'chirilgan", status: "warning" },
    ],
  },
  {
    title: "Kirish nazorati",
    description: "Kirish urinishlari va cheklovlar",
    icon: Shield,
    color: "text-purple-600",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    items: [
      { label: "Muvaffaqiyatsiz urinishlar limiti", value: "5 ta", status: "active" },
      { label: "Bloklash muddati", value: "15 daqiqa", status: "active" },
      { label: "Ikki bosqichli tasdiqlash", value: "O'chirilgan", status: "warning" },
      { label: "Captcha", value: "O'chirilgan", status: "warning" },
    ],
  },
  {
    title: "Ma'lumot himoyasi",
    description: "Shifrlash va ma'lumot xavfsizligi",
    icon: Eye,
    color: "text-red-600",
    bg: "bg-red-100 dark:bg-red-900/30",
    items: [
      { label: "HTTPS shifrlash", value: "Faol", status: "active" },
      { label: "Ma'lumot zaxirasi", value: "Har kuni", status: "active" },
      { label: "JWT token muddati", value: "1 soat", status: "active" },
      { label: "API rate limiting", value: "Tez kunda", status: "warning" },
    ],
  },
]

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Xavfsizlik" subtitle="Xavfsizlik sozlamalari va monitoring" icon={Lock} />

      <div className="grid gap-4 md:grid-cols-2">
        {securitySections.map((section, i) => (
          <Card key={i} className="transition-all hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`flex size-10 items-center justify-center rounded-lg ${section.bg}`}>
                  <section.icon className={`size-5 ${section.color}`} />
                </div>
                <div>
                  <CardTitle className="text-base">{section.title}</CardTitle>
                  <CardDescription className="mt-0.5">{section.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {section.items.map((item, j) => (
                  <div key={j} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                    <span className="text-sm">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.value}</span>
                      {item.status === "active" ? (
                        <CheckCircle className="size-3.5 text-green-500" />
                      ) : (
                        <AlertTriangle className="size-3.5 text-yellow-500" />
                      )}
                    </div>
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
