"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Shield, Plus, Key, Loader2, Trash2, CheckCircle2, XCircle, Settings, Users, Brain, Building2, FileText, Database, Lock, BarChart3, PieChart, FlaskConical, LayoutGrid, ChevronRight, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { apiClient } from "@/lib/api-client"
import { safeDevError } from "@/lib/safe-log"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Permission {
  id: number
  resource: string
  action: string
}

interface Role {
  id: number
  name: string
  description: string | null
  isSystem: boolean
  permissions: Permission[]
}

const RESOURCES = [
  { id: "users", label: "Foydalanuvchilar", icon: Users },
  { id: "psychologists", label: "Psixologlar", icon: Brain },
  { id: "administrators", label: "Administratorlar", icon: Shield },
  { id: "centers", label: "O'quv markazlari", icon: Building2 },
  { id: "content", label: "Kontent (Maqolalar/Audio)", icon: FileText },
  { id: "finance", label: "Moliya", icon: Database },
  { id: "analytics", label: "Analitika", icon: BarChart3 },
  { id: "reports", label: "Hisobotlar", icon: PieChart },
  { id: "tests", label: "Psixologik testlar", icon: FlaskConical },
  { id: "system", label: "Tizim sozlamalari", icon: Settings },
]

const ACTIONS = [
  { id: "read", label: "Ko'rish", color: "bg-blue-500", desc: "Ma'lumotlarni ko'rish ruxsati" },
  { id: "write", label: "Yaratish", color: "bg-emerald-500", desc: "Yangi ma'lumot qo'shish va tahrirlash" },
  { id: "delete", label: "O'chirish", color: "bg-red-500", desc: "Ma'lumotlarni butunlay o'chirish" },
  { id: "manage", label: "Boshqarish", color: "bg-violet-500", desc: "Bloklash, tasdiqlash va boshqa amallar" },
  { id: "audit", label: "Audit", color: "bg-amber-500", desc: "Loglar va faollikni kuzatish" },
]

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false)
  const [newRole, setNewRole] = useState({ name: "", description: "" })
  const [adding, setAdding] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  const fetchRoles = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiClient<Role[]>("/roles")
      setRoles(data)
      if (data.length > 0) {
        if (!selectedRole) {
          setSelectedRole(data[0])
        } else {
          const updated = data.find(r => r.id === selectedRole.id)
          if (updated) setSelectedRole(updated)
        }
      }
    } catch (e: unknown) {
      safeDevError("roles/fetch", e)
    } finally {
      setLoading(false)
    }
  }, [selectedRole])

  useEffect(() => {
    fetchRoles()
  }, [])

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    try {
      await apiClient("/roles", {
        method: "POST",
        body: newRole
      })
      setIsAddRoleOpen(false)
      setNewRole({ name: "", description: "" })
      fetchRoles()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setAdding(false)
    }
  }

  const togglePermission = async (resource: string, action: string) => {
    if (!selectedRole || selectedRole.isSystem || selectedRole.name === "SUPERADMIN") return
    
    const key = `${resource}-${action}`
    setToggling(key)

    try {
      const existing = selectedRole.permissions.find(p => p.resource === resource && p.action === action)
      
      if (existing) {
        // Remove permission
        await apiClient(`/roles/${selectedRole.id}/permissions/${existing.id}`, {
          method: "DELETE"
        })
      } else {
        // Add permission
        await apiClient(`/roles/${selectedRole.id}/permissions`, {
          method: "POST",
          body: { resource, action }
        })
      }
      await fetchRoles()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setToggling(null)
    }
  }

  const hasPermission = (role: Role, resource: string, action: string) => {
    if (role.name === "SUPERADMIN") return true
    return role.permissions.some(p => p.resource === resource && p.action === action)
  }

  if (loading && roles.length === 0) {
    return (
      <div className="flex h-[500px] flex-col items-center justify-center space-y-4">
        <Loader2 className="size-12 animate-spin text-primary opacity-20" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Ruxsatlar matritsasi yuklanmoqda...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="Rollar va Ruxsatlar"
        description="Tizim bo'yicha kirish darajalari va ruxsatlar boshqaruvi"
        icon={Shield}
        actions={[
          { 
            label: "Yangi rol yaratish", 
            icon: Plus, 
            variant: "default",
            onClick: () => setIsAddRoleOpen(true)
          },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Roles Sidebar */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Platformadagi rollar</h3>
            <Badge variant="outline" className="text-[10px] font-bold">{roles.length}</Badge>
          </div>
          <div className="grid gap-2">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`group relative flex flex-col items-start p-4 rounded-2xl border transition-all duration-300 ${
                  selectedRole?.id === role.id 
                    ? "border-primary bg-primary/5 shadow-sm shadow-primary/10" 
                    : "border-border/50 bg-background hover:border-border hover:bg-muted/30"
                }`}
              >
                <div className="flex w-full items-center justify-between mb-2">
                  <span className={`text-sm font-bold transition-colors ${selectedRole?.id === role.id ? "text-primary" : "text-foreground"}`}>
                    {role.name}
                  </span>
                  {role.isSystem ? (
                    <Badge className="h-4 text-[9px] uppercase font-black bg-amber-500/10 text-amber-600 border-none">System</Badge>
                  ) : (
                    <Badge className="h-4 text-[9px] uppercase font-black bg-blue-500/10 text-blue-600 border-none">Custom</Badge>
                  )}
                </div>
                {role.description && (
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mb-3 text-left leading-relaxed">
                    {role.description}
                  </p>
                )}
                <div className="flex items-center gap-3 w-full border-t border-border/50 pt-3 mt-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                    <LayoutGrid className="size-3" />
                    <span>{role.permissions.length} ruxsatlar</span>
                  </div>
                  {selectedRole?.id === role.id && (
                     <div className="ml-auto">
                        <ChevronRight className="size-4 text-primary animate-in slide-in-from-left-2 duration-300" />
                     </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Matrix */}
        <div className="lg:col-span-9 h-full">
          {selectedRole && (
            <Card className="border-none shadow-xl shadow-black/5 bg-background overflow-hidden h-full flex flex-col">
              <CardHeader className="bg-muted/20 border-b px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Lock className="size-5 text-primary" />
                      </div>
                      <CardTitle className="text-xl font-black tracking-tight">{selectedRole.name}</CardTitle>
                    </div>
                    <CardDescription className="text-sm ml-13">
                      {selectedRole.description || "Ushbu rol foydalanuvchilari uchun ruxsatlar matritsasi"}
                    </CardDescription>
                  </div>
                  {selectedRole.name === "SUPERADMIN" ? (
                    <Badge className="bg-emerald-600 text-white border-none py-1.5 px-4 rounded-full font-bold animate-pulse">
                      To'liq nazorat (Full Access)
                    </Badge>
                  ) : selectedRole.isSystem ? (
                    <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 rounded-full font-bold">
                      Tizim roli (Cheklangan tahrirlash)
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto flex-1">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b">
                      <TableHead className="w-[280px] px-8 font-black text-[11px] uppercase tracking-widest text-muted-foreground">Resurs / Bo'lim</TableHead>
                      {ACTIONS.map(action => (
                        <TableHead key={action.id} className="text-center px-4 py-6">
                           <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex flex-col items-center gap-2 cursor-help group">
                                    <div className={`size-2 rounded-full ${action.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
                                    <span className="text-[10px] font-black uppercase tracking-wider">{action.label}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">{action.desc}</p>
                                </TooltipContent>
                              </Tooltip>
                           </TooltipProvider>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {RESOURCES.map(resource => (
                      <TableRow key={resource.id} className="hover:bg-muted/10 group transition-colors">
                        <TableCell className="px-8 py-5">
                          <div className="flex items-center gap-3">
                             <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                <resource.icon className="size-4" />
                             </div>
                             <span className="font-bold text-sm tracking-tight">{resource.label}</span>
                          </div>
                        </TableCell>
                        {ACTIONS.map(action => {
                          const active = hasPermission(selectedRole, resource.id, action.id)
                          const isToggling = toggling === `${resource.id}-${action.id}`
                          const isDisabled = selectedRole.isSystem || selectedRole.name === "SUPERADMIN" || isToggling

                          return (
                            <TableCell key={action.id} className="text-center p-0">
                              <div className="flex justify-center items-center h-[64px]">
                                {isToggling ? (
                                  <Loader2 className="size-4 animate-spin text-primary opacity-50" />
                                ) : (
                                  <div 
                                    className={`relative flex items-center justify-center size-8 rounded-lg cursor-pointer transition-all ${
                                      active 
                                        ? "bg-emerald-500/10 hover:bg-emerald-500/20" 
                                        : "hover:bg-muted"
                                    } ${isDisabled ? "cursor-not-allowed opacity-40" : ""}`}
                                    onClick={() => !isDisabled && togglePermission(resource.id, action.id)}
                                  >
                                    <div className={`size-4 rounded border transition-all flex items-center justify-center ${
                                      active 
                                        ? "bg-emerald-500 border-emerald-500 scale-110 shadow-lg shadow-emerald-500/20" 
                                        : "border-muted-foreground/30 bg-background"
                                    }`}>
                                      {active && <CheckCircle2 className="size-3 text-white" />}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <div className="bg-muted/10 border-t p-6 mt-auto">
                 <div className="flex items-start gap-3">
                    <Info className="size-5 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-1">
                       <p className="text-xs font-bold text-foreground">Xavfsizlik eslatmasi</p>
                       <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Ruxsatlarni o'zgartirish darhol kuchga kiradi. Tizim uchun muhim bo'lgan 'Superadmin' va 'Administrator' rollari uchun ma'lum cheklovlar o'rnatilgan bo'lishi mumkin. Yangi ruxsat qo'shishdan oldin uning ta'sirini tekshirib ko'ring.
                       </p>
                    </div>
                 </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Add Role Dialog */}
      <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Yangi rol yaratish</DialogTitle>
            <DialogDescription>Xodimlaringiz uchun moslashtirilgan kirish ruxsatlarini belgilang</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6 font-medium">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Rol nomi (Katta harflarda)</Label>
              <Input 
                id="name" 
                placeholder="MASALAN: MODERATOR" 
                value={newRole.name}
                onChange={e => setNewRole({...newRole, name: e.target.value.toUpperCase().replace(/\s+/g, '_')})}
                className="rounded-xl h-12 border-muted-foreground/20 font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Qisqacha tavsif</Label>
              <Input 
                id="desc" 
                placeholder="Ushbu rol kimlarga va nima uchun tayinlanadi..." 
                value={newRole.description}
                onChange={e => setNewRole({...newRole, description: e.target.value})}
                className="rounded-xl h-12 border-muted-foreground/20"
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={() => setIsAddRoleOpen(false)} className="rounded-xl">Bekor qilish</Button>
            <Button onClick={handleAddRole} disabled={adding || !newRole.name} className="rounded-xl px-8 h-12 font-bold shadow-lg shadow-primary/20">
              {adding ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
              Yaratish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
