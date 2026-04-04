"use client"

import { Settings, Globe, Bell, Palette, Database, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sozlamalar"
        description="Tizim sozlamalarini boshqarish va konfiguratsiya"
        icon={Settings}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {[
          { title: "Umumiy sozlamalar", desc: "Tizim nomi, tili va vaqt mintaqasi", icon: Globe, action: "Tahrirlash" },
          { title: "Bildirishnomalar", desc: "Email va push bildirishnomalar sozlamalari", icon: Bell, action: "Sozlash" },
          { title: "Dizayn", desc: "Logo, ranglar va mavzu sozlamalari", icon: Palette, action: "Tahrirlash" },
          { title: "Ma'lumotlar bazasi", desc: "Backup va sinxronizatsiya sozlamalari", icon: Database, action: "Boshqarish" },
          { title: "Xavfsizlik", desc: "Parol siyosati va ikki bosqichli tekshirish", icon: Shield, action: "Sozlash" },
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <item.icon className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">{item.title}</CardTitle>
                    <CardDescription className="text-xs">{item.desc}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" disabled>{item.action}</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}