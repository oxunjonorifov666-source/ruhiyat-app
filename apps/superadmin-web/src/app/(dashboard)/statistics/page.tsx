"use client"

import { PieChart, Users, Brain, Globe, CreditCard, TrendingUp, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"

export default function StatisticsPage() {
return (
  <div className="space-y-6">
    <PageHeader
      title="Statistika"
      description="Umumiy statistik ma'lumotlar va ko'rsatkichlar"
      icon={PieChart}
      badge="Ishlab chiqilmoqda"
      badgeVariant="secondary"
    />

    <div className="grid gap-6 lg:grid-cols-2">
      {[
        { title: "Foydalanuvchi statistikasi", desc: "Ro'yxatdan o'tish va faollik", icon: Users },
        { title: "Psixolog statistikasi", desc: "Seanslar va reytinglar", icon: Brain },
        { title: "Hamjamiyat statistikasi", desc: "Postlar, izohlar va faollik", icon: Globe },
        { title: "Moliya statistikasi", desc: "To'lovlar va daromad", icon: CreditCard },
      ].map((item) => (
        <Card key={item.title} className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <item.icon className="size-4" />
              </div>
              <div>
                <CardTitle className="text-sm">{item.title}</CardTitle>
                <CardDescription className="text-xs">{item.desc}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed bg-muted/30">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="mx-auto size-8 mb-2 opacity-40" />
                <p className="text-xs">Statistik ma'lumotlar tayyorlanmoqda</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
)
}
