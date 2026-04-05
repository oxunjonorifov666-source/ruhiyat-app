"use client"

import { DollarSign } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/page-header"
import { useApiData } from "@/hooks/use-api-data"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function RevenuePage() {
  const { data: monthlyData, loading: chartLoading } = useApiData<{ month: string; revenue: number }[]>({
    path: "/finance/monthly-revenue",
  })

  return (
    <>
      <PageHeader
        title="Daromadlar"
        description="Oylik daromad dinamikasi va tahlil"
        icon={DollarSign}
      />

      <Card>
        <CardHeader>
          <CardTitle>Oylik daromad</CardTitle>
          <CardDescription>Oxirgi oylar davomida daromad ko'rsatkichlari</CardDescription>
        </CardHeader>
        <CardContent>
          {chartLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : !monthlyData || monthlyData.length === 0 ? (
            <div className="flex h-72 items-center justify-center text-muted-foreground">
              Daromad ma'lumotlari topilmadi
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                  formatter={(value: number) => [`${value.toLocaleString()} UZS`, "Daromad"]}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </>
  )
}
