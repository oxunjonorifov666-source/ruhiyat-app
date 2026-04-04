"use client"

import { Key, Plus, Shield, Copy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"

export default function ApiKeysPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="API kalitlar"
        description="API kalitlarni yaratish va boshqarish"
        icon={Key}
        actions={[
          { label: "Yangi kalit", icon: Plus, variant: "default" },
        ]}
      />

      <Card className="border-dashed">
        <CardContent className="p-0">
          <div className="flex h-48 items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Key className="mx-auto size-12 mb-3 opacity-40" />
              <p className="text-sm font-medium">Hozircha API kalitlar yo'q</p>
              <p className="text-xs mt-1">Yangi API kalit yaratish uchun yuqoridagi tugmani bosing</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">API hujjatlari</CardTitle>
          <CardDescription>API endpointlari va foydalanish bo'yicha</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-2 rounded bg-muted/50">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">GET</Badge>
                <code className="text-xs">/api/auth/me</code>
              </div>
              <span className="text-xs text-muted-foreground">Profil ma'lumotlari</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/50">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">GET</Badge>
                <code className="text-xs">/api/users</code>
              </div>
              <span className="text-xs text-muted-foreground">Foydalanuvchilar</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/50">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">GET</Badge>
                <code className="text-xs">/api/dashboard/superadmin/stats</code>
              </div>
              <span className="text-xs text-muted-foreground">Dashboard statistika</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}