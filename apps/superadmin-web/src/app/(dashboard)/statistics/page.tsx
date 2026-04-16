"use client"

import Link from "next/link"
import { PieChart, BarChart3, TrendingUp, ArrowRight, FileBarChart } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { SuperadminOverviewPanel } from "@/components/superadmin/superadmin-overview-panel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function StatisticsPage() {
  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title="Statistika"
        description="Barcha asosiy ko'rsatkichlar, filtrlash va eksport — real bazadan"
        icon={PieChart}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border bg-gradient-to-br from-primary/5 to-transparent shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="size-4 text-primary" />
              Chuqur analitika
            </CardTitle>
            <CardDescription className="text-xs">
              Testlar, psixologlar, demografiya va oylik tahlillar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" size="sm" className="w-full gap-2">
              <Link href="/analytics">
                Analitika sahifasi
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border bg-gradient-to-br from-emerald-500/5 to-transparent shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-600" />
              Moliya statistikasi
            </CardTitle>
            <CardDescription className="text-xs">
              Daromad, tranzaksiyalar va turlar bo'yicha taqsimot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" size="sm" className="w-full gap-2">
              <Link href="/finance-statistics">
                Moliyaga o'tish
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border bg-gradient-to-br from-amber-500/5 to-transparent shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileBarChart className="size-4 text-amber-600" />
              Hisobotlar
            </CardTitle>
            <CardDescription className="text-xs">
              Moliyaviy va foydalanuvchilar bo'yicha eksport qilinadigan hisobotlar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" size="sm" className="w-full gap-2">
              <Link href="/reports">
                Hisobotlar
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <SuperadminOverviewPanel />
    </div>
  )
}
