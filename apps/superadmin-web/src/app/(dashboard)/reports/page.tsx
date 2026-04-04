"use client"

import { FileText, Calendar, Download, BarChart3, Users, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"

export default function ReportsPage() {
return (
  <div className="space-y-6">
    <PageHeader
      title="Hisobotlar"
      description="Platformaning batafsil hisobotlari va eksport"
      icon={FileText}
      badge="Ishlab chiqilmoqda"
      badgeVariant="secondary"
      actions={[
        { label: "Eksport", icon: Download, variant: "outline" },
      ]}
    />

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[
        { title: "Oylik hisobot", desc: "Joriy oy uchun umumiy hisobot", icon: Calendar, action: "Yaratish" },
        { title: "Yillik hisobot", desc: "Yillik moliyaviy va faoliyat hisoboti", icon: BarChart3, action: "Yaratish" },
        { title: "Foydalanuvchi hisoboti", desc: "Foydalanuvchilar bo'yicha batafsil", icon: Users, action: "Yaratish" },
        { title: "Moliyaviy hisobot", desc: "To'lovlar va tranzaksiyalar hisoboti", icon: DollarSign, action: "Yaratish" },
        { title: "Maxsus hisobot", desc: "O'zingiz sozlaydigan hisobot", icon: FileText, action: "Sozlash" },
      ].map((item) => (
        <Card key={item.title}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <item.icon className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-sm">{item.title}</CardTitle>
                  <CardDescription className="text-xs">{item.desc}</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full" disabled>
              {item.action}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
)
}
