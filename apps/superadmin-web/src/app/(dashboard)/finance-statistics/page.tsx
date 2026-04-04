"use client"

import { TrendingUp, DollarSign, CreditCard, BarChart3, PieChart, ArrowUpDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"

export default function FinanceStatisticsPage() {
return (
  <div className="space-y-6">
    <PageHeader
      title="Moliya statistikasi"
      description="Moliyaviy ko'rsatkichlar va tahlillar"
      icon={TrendingUp}
      badge="Ishlab chiqilmoqda"
      badgeVariant="secondary"
    />

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[
        { title: "Umumiy daromad", value: "0 so'm", icon: DollarSign, color: "bg-emerald-500/10 text-emerald-600" },
        { title: "Oylik daromad", value: "0 so'm", icon: BarChart3, color: "bg-blue-500/10 text-blue-600" },
        { title: "To'lovlar soni", value: "0", icon: CreditCard, color: "bg-violet-500/10 text-violet-600" },
        { title: "O'rtacha check", value: "0 so'm", icon: ArrowUpDown, color: "bg-amber-500/10 text-amber-600" },
      ].map((item) => (
        <Card key={item.title}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.title}</p>
                <p className="text-2xl font-bold">{item.value}</p>
              </div>
              <div className={`flex size-10 items-center justify-center rounded-lg ${item.color}`}>
                <item.icon className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daromad dinamikasi</CardTitle>
          <CardDescription>Oxirgi 12 oy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed bg-muted/30">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="mx-auto size-10 mb-3 opacity-40" />
              <p className="text-sm">Grafik tayyorlanmoqda</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">To'lov turlari taqsimoti</CardTitle>
          <CardDescription>Kategoriya bo'yicha</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed bg-muted/30">
            <div className="text-center text-muted-foreground">
              <PieChart className="mx-auto size-10 mb-3 opacity-40" />
              <p className="text-sm">Diagramma tayyorlanmoqda</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
)
}
