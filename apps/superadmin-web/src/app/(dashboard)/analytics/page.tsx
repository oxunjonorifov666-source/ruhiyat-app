"use client"

import { BarChart3, Users, TrendingUp, DollarSign, PieChart, Map, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"

export default function AnalyticsPage() {
return (
  <div className="space-y-6">
    <PageHeader
      title="Analitika"
      description="Platformaning batafsil tahlili va ko'rsatkichlari"
      icon={BarChart3}
      badge="Ishlab chiqilmoqda"
      badgeVariant="secondary"
    />

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[
        { title: "Foydalanuvchilar statistikasi", desc: "Ro'yxatdan o'tish, faollik va saqlanish", icon: Users },
        { title: "Daromad tahlili", desc: "Moliyaviy oqimlar va prognozlar", icon: DollarSign },
        { title: "O'sish tendentsiyalari", desc: "Platformaning o'sish ko'rsatkichlari", icon: TrendingUp },
        { title: "Mintaqaviy tahlil", desc: "Geografik taqsimot va mintaqalar", icon: Map },
        { title: "Konversiya ko'rsatkichlari", desc: "Funnel tahlili va konversiya", icon: Target },
        { title: "Segment tahlili", desc: "Foydalanuvchi segmentlari bo'yicha", icon: PieChart },
      ].map((item) => (
        <Card key={item.title} className="border-dashed">
          <CardHeader className="pb-3">
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
            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed bg-muted/30">
              <p className="text-xs text-muted-foreground">Grafik tayyorlanmoqda</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
)
}
