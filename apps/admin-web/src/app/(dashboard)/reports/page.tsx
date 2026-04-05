"use client"

import { FileText, Download, Calendar, TrendingUp, Users, DollarSign } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const reportTypes = [
  {
    title: "Oylik hisobot",
    description: "Markazning oylik faoliyati bo'yicha umumiy hisobot",
    icon: Calendar,
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    status: "Tez kunda",
  },
  {
    title: "Moliyaviy hisobot",
    description: "To'lovlar, daromadlar va xarajatlar bo'yicha batafsil hisobot",
    icon: DollarSign,
    color: "text-green-600",
    bg: "bg-green-100 dark:bg-green-900/30",
    status: "Tez kunda",
  },
  {
    title: "O'quvchilar hisoboti",
    description: "O'quvchilar soni, davomat va o'zlashtirish bo'yicha hisobot",
    icon: Users,
    color: "text-purple-600",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    status: "Tez kunda",
  },
  {
    title: "Psixologik xizmatlar hisoboti",
    description: "Seanslar, testlar va psixologik xizmatlar statistikasi",
    icon: TrendingUp,
    color: "text-orange-600",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    status: "Tez kunda",
  },
]

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Hisobotlar"
        subtitle="Markaz faoliyati bo'yicha batafsil hisobotlar"
        icon={FileText}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {reportTypes.map((report, i) => (
          <Card key={i} className="transition-all hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex size-10 items-center justify-center rounded-lg ${report.bg}`}>
                    <report.icon className={`size-5 ${report.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{report.title}</CardTitle>
                    <CardDescription className="mt-0.5">{report.description}</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">{report.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Avtomatik generatsiya qo'llab-quvvatlanadi</span>
                <Button variant="outline" size="sm" disabled>
                  <Download className="size-3.5 mr-1.5" />
                  Yuklab olish
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hisobotlar tarixi</CardTitle>
          <CardDescription>Avval yaratilgan hisobotlar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <FileText className="mx-auto size-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Hisobotlar tarixi tez kunda qo'shiladi</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
