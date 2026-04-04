"use client"

import { ScrollText, Search, Filter, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit loglari"
        description="Tizimda bajarilgan barcha amallar logi"
        icon={ScrollText}
        badge="Tez kunda"
        badgeVariant="secondary"
        actions={[
          { label: "Eksport", icon: Download, variant: "outline" },
        ]}
      />

      <Card className="border-dashed">
        <CardContent className="p-0">
          <div className="flex h-72 items-center justify-center">
            <div className="text-center text-muted-foreground">
              <ScrollText className="mx-auto size-12 mb-3 opacity-40" />
              <p className="text-sm font-medium">Audit loglari moduli</p>
              <p className="text-xs mt-1">Barcha tizim amallari shu yerda qayd etiladi</p>
              <p className="text-xs mt-0.5">API endpointi mavjud, jadval tayyorlanmoqda</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}