"use client"

import { useEffect, useState, useCallback } from "react"
import { Shield, Users, Key, CheckCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { PageHeader } from "@/components/page-header"
import { StatsCard, StatsGrid } from "@/components/stats-card"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

interface Role {
  id: number
  name: string
  description: string | null
  isSystem: boolean
  createdAt: string
  _count?: { users: number }
}

interface Permission {
  id: number
  permission: string
  resource: string
  action: string
}

export default function StaffRolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [permLoading, setPermLoading] = useState(false)

  const fetchRoles = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await apiClient<{ data: Role[] }>("/roles")
      setRoles(res.data || [])
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchRoles() }, [fetchRoles])

  const viewPermissions = async (role: Role) => {
    setSelectedRole(role)
    setPermLoading(true)
    try {
      const res = await apiClient<{ data: Permission[] }>(`/roles/${role.id}/permissions`)
      setPermissions(res.data || [])
    } catch { setPermissions([]) }
    finally { setPermLoading(false) }
  }

  const systemRoles = roles.filter(r => r.isSystem).length
  const totalUsers = roles.reduce((sum, r) => sum + (r._count?.users || 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader title="Xodim rollari" subtitle="Rollar va ruxsatlarni boshqarish" icon={Shield} />

      <StatsGrid>
        <StatsCard title="Jami rollar" value={roles.length} icon={Shield} loading={loading} iconColor="text-blue-600" />
        <StatsCard title="Tizim rollari" value={systemRoles} icon={Key} loading={loading} iconColor="text-purple-600" />
        <StatsCard title="Tayinlangan foydalanuvchilar" value={totalUsers} icon={Users} loading={loading} iconColor="text-green-600" />
        <StatsCard title="Maxsus rollar" value={roles.length - systemRoles} icon={CheckCircle} loading={loading} iconColor="text-orange-600" />
      </StatsGrid>

      {error && (
        <Card><CardContent className="py-8 text-center text-destructive">{error}</CardContent></Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="py-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))
        ) : (
          roles.map((role) => (
            <Card
              key={role.id}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
              onClick={() => viewPermissions(role)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{role.name}</CardTitle>
                  {role.isSystem && <Badge variant="secondary">Tizim</Badge>}
                </div>
                <CardDescription>{role.description || "Tavsif yo'q"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Foydalanuvchilar: {role._count?.users || 0}</span>
                  <span className="text-xs text-muted-foreground">{new Date(role.createdAt).toLocaleDateString("uz-UZ")}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Sheet open={!!selectedRole} onOpenChange={() => setSelectedRole(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedRole && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selectedRole.name}
                  {selectedRole.isSystem && <Badge variant="secondary">Tizim</Badge>}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div>
                  <span className="text-sm font-medium">Tavsif</span>
                  <p className="text-sm text-muted-foreground mt-1">{selectedRole.description || "—"}</p>
                </div>
                <Separator />
                <div>
                  <span className="text-sm font-medium">Ruxsatlar ({permissions.length})</span>
                  {permLoading ? (
                    <div className="mt-2 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                  ) : permissions.length === 0 ? (
                    <p className="text-sm text-muted-foreground mt-2">Ruxsatlar topilmadi</p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {permissions.map((p) => (
                        <Badge key={p.id} variant="outline" className="text-xs">
                          {p.resource}.{p.action}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
