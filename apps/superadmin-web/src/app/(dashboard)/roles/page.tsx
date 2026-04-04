"use client"

import { Shield, Plus, Users, Key, Settings } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"

const defaultRoles = [
{ name: "SUPERADMIN", label: "Superadmin", permissions: "Barcha huquqlar", color: "bg-red-500/10 text-red-600", count: "*" },
{ name: "ADMIN", label: "Administrator", permissions: "21 ta ruxsat", color: "bg-blue-500/10 text-blue-600", count: "21" },
{ name: "USER", label: "Foydalanuvchi", permissions: "11 ta ruxsat", color: "bg-green-500/10 text-green-600", count: "11" },
]

export default function RolesPage() {
return (
  <div className="space-y-6">
    <PageHeader
      title="Rollar va ruxsatlar"
      description="Foydalanuvchi rollari va ruxsatlar matritsasini boshqarish"
      icon={Shield}
      actions={[
        { label: "Yangi rol", icon: Plus, variant: "default" },
      ]}
    />

    <div className="grid gap-4 md:grid-cols-3">
      {defaultRoles.map((role) => (
        <Card key={role.name}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex size-10 items-center justify-center rounded-lg ${role.color}`}>
                  <Shield className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-sm">{role.label}</CardTitle>
                  <CardDescription className="text-xs">{role.name}</CardDescription>
                </div>
              </div>
              <Badge variant="secondary">{role.count}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{role.permissions}</p>
          </CardContent>
        </Card>
      ))}
    </div>

    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ruxsatlar matritsasi</CardTitle>
        <CardDescription>Har bir rolga tegishli ruxsatlar</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed bg-muted/30">
          <div className="text-center text-muted-foreground">
            <Key className="mx-auto size-8 mb-2 opacity-40" />
            <p className="text-sm">Ruxsatlar matritsasi tayyorlanmoqda</p>
            <p className="text-xs mt-1">API dan rollar va ruxsatlar yuklanadi</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
)
}
