"use client"

import { Monitor, Server, Database, Activity, AlertTriangle, Cpu } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"

export default function MonitoringPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Texnik monitoring"
        description="Server va xizmatlar holatini kuzatish"
        icon={Monitor}
        badge="Ishlab chiqilmoqda"
        badgeVariant="secondary"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "API Server", status: "Ishlayapti", color: "bg-green-500", icon: Server },
          { title: "Ma'lumotlar bazasi", status: "Ishlayapti", color: "bg-green-500", icon: Database },
          { title: "CPU yuklamasi", status: "Normal", color: "bg-green-500", icon: Cpu },
        ].map((item) => (
          <Card key={item.title}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                    <item.icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.status}</p>
                  </div>
                </div>
                <div className={`size-2.5 rounded-full ${item.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Tizim metrikalari</CardTitle>
          <CardDescription>Real vaqt rejimida server ko'rsatkichlari</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed bg-muted/30">
            <div className="text-center text-muted-foreground">
              <Activity className="mx-auto size-10 mb-3 opacity-40" />
              <p className="text-sm">Monitoring grafiklari tayyorlanmoqda</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}