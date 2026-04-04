"use client"

import { DollarSign, TrendingUp, BarChart3, PieChart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"

export default function RevenuePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Daromadlar"
        description="Platformaning daromad ko'rsatkichlari va tahlili"
        icon={DollarSign}
        badge="Ishlab chiqilmoqda"
        badgeVariant="secondary"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Umumiy daromad", value: "0 so'm" },
          { title: "Oylik daromad", value: "0 so'm" },
          { title: "Haftalik daromad", value: "0 so'm" },
          { title: "Bugungi daromad", value: "0 so'm" },
        ].map((item) => (
          <Card key={item.title}>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.title}</p>
              <p className="text-2xl font-bold mt-1">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Daromad dinamikasi</CardTitle>
          <CardDescription>Oxirgi 12 oy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed bg-muted/30">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="mx-auto size-10 mb-3 opacity-40" />
              <p className="text-sm">Daromad grafigi tayyorlanmoqda</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}