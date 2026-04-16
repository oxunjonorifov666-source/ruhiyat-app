"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Shield, Key, CheckCircle2, Plus, Pencil, Trash2, Loader2, Info, Lock, Users, GraduationCap, BookOpen, LayoutGrid, Database, MessageSquare, Bell, CreditCard, Star, ChevronRight, HelpCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { PageHeader } from "@/components/page-header"
import { StatsCard, StatsGrid } from "@/components/stats-card"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UserRole } from "@ruhiyat/types"

interface Role {
  id: number
  name: string
  description: string | null
  isSystem: boolean
  centerId: number | null
  createdAt: string
  permissions: Permission[]
}

interface Permission {
  id: number
  resource: string
  action: string
}

const RESOURCES = [
  { id: "students", label: "O'quvchilar", icon: Users },
  { id: "teachers", label: "O'qituvchilar", icon: GraduationCap },
  { id: "groups", label: "Guruhlar", icon: LayoutGrid },
  { id: "courses", label: "Kurslar", icon: BookOpen },
  { id: "sessions", label: "Seanslar", icon: Star },
  { id: "finance", label: "Moliya", icon: CreditCard },
  { id: "staff", label: "Xodimlar", icon: Shield },
  { id: "announcements", label: "E'lonlar", icon: Bell },
  { id: "chat", label: "Chatlar", icon: MessageSquare },
  { id: "system", label: "Sozlamalar", icon: Database },
]

const ACTIONS = [
  { id: "read", label: "Ko'rish", color: "bg-sky-500", desc: "Ma'lumotlarni ko'rish ruxsati" },
  { id: "write", label: "Yaratish", color: "bg-emerald-500", desc: "Yangi ma'lumot qo'shish va tahrirlash" },
  { id: "delete", label: "O'chirish", color: "bg-rose-500", desc: "Ma'lumotlarni o'chirish ruxsati" },
  { id: "manage", label: "Boshqarish", color: "bg-indigo-500", desc: "To'liq boshqaruv va tasdiqlash" },
]

export default function StaffRolesPage() {
  const { user } = useAuth()
  const centerId = user?.administrator?.centerId
  
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false)
  const [newRole, setNewRole] = useState({ name: "", description: "" })
  const [adding, setAdding] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  const fetchRoles = useCallback(async () => {
    if (!centerId) return
    setLoading(true)
    try {
      const res = await apiClient<Role[]>(`/roles`, { params: { centerId } })
      setRoles(res || [])
      if (res && res.length > 0) {
        if (!selectedRole) {
          setSelectedRole(res[0])
        } else {
          const updated = res.find(r => r.id === selectedRole.id)
          if (updated) setSelectedRole(updated)
        }
      }
    } catch (e: any) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [centerId, selectedRole])

  useEffect(() => { fetchRoles() }, [fetchRoles])

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!centerId) return
    setAdding(true)
    try {
      await apiClient("/roles", {
        method: "POST",
        body: { ...newRole, centerId }
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
    if (!selectedRole || (selectedRole.isSystem && user?.role !== UserRole.SUPERADMIN)) return
    
    const key = `${resource}-${action}`
    setToggling(key)

    try {
      const existing = selectedRole.permissions.find(p => p.resource === resource && p.action === action)
      
      if (existing) {
        await apiClient(`/roles/${selectedRole.id}/permissions/${existing.id}`, {
          method: "DELETE"
        })
      } else {
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
    return role.permissions?.some(p => p.resource === resource && p.action === action) || false
  }

  const systemRolesCount = roles.filter(r => r.isSystem).length
  const customRolesCount = roles.filter(r => !r.isSystem).length

  if (loading && roles.length === 0) {
    return (
      <div className="flex h-[500px] flex-col items-center justify-center space-y-4">
        <Loader2 className="size-12 animate-spin text-primary opacity-20" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Rollar ro'yxati yuklanmoqda...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title="Xodimlar Rollari" 
        description="Markaz xodimlari uchun ruxsatnomalar va rollarni boshqarish" 
        icon={Shield} 
        actions={[
          { label: "Yangi rol", icon: Plus, onClick: () => setIsAddRoleOpen(true) }
        ]}
      />

      <StatsGrid columns={3}>
        <StatsCard title="Jami rollar" value={roles.length} icon={Shield} loading={loading} iconColor="bg-blue-500/10 text-blue-600" />
        <StatsCard title="Tizim rollari" value={systemRolesCount} icon={Lock} loading={loading} iconColor="bg-slate-500/10 text-slate-600" />
        <StatsCard title="Markaz rollari" value={customRolesCount} icon={Plus} loading={loading} iconColor="bg-emerald-500/10 text-emerald-600" />
      </StatsGrid>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Mavjud rollar</p>
          <div className="grid gap-2">
             {roles.map(role => (
               <button
                 key={role.id}
                 onClick={() => setSelectedRole(role)}
                 className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 ${
                   selectedRole?.id === role.id 
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : "border-border/50 bg-background hover:bg-muted/50"
                 }`}
               >
                 <div className="flex items-center justify-between mb-2">
                   <span className={`text-sm font-bold ${selectedRole?.id === role.id ? "text-primary" : ""}`}>{role.name}</span>
                   {role.isSystem && <Badge className="text-[9px] h-4 font-black bg-slate-100 text-slate-600 border-none">System</Badge>}
                 </div>
                 <p className="text-[11px] text-muted-foreground line-clamp-1 leading-relaxed">{role.description || "Tavsif mavjud emas"}</p>
                 <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/70">
                       <Key className="size-3" />
                       {role.permissions?.length || 0} ruxsatlar
                    </div>
                    {selectedRole?.id === role.id && <ChevronRight className="size-3 text-primary" />}
                 </div>
               </button>
             ))}
          </div>
        </div>

        {/* Matrix */}
        <div className="lg:col-span-9 h-full">
           {selectedRole && (
             <Card className="border-none shadow-2xl shadow-primary/5 bg-background overflow-hidden h-full flex flex-col rounded-3xl">
                <CardHeader className="bg-muted/10 border-b px-8 py-6">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <Lock className="size-6" />
                         </div>
                         <div>
                            <CardTitle className="text-xl font-black">{selectedRole.name}</CardTitle>
                            <CardDescription className="text-xs mt-1 font-medium">{selectedRole.description || "Ushbu rol foydalanuvchilari uchun ruxsatlar"}</CardDescription>
                         </div>
                      </div>
                      {selectedRole.isSystem && (
                         <Badge variant="outline" className="rounded-full bg-amber-50 text-amber-600 border-amber-200 font-bold px-4 py-1">
                            Tizim Roli
                         </Badge>
                      )}
                   </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-x-auto">
                   <Table>
                      <TableHeader>
                         <TableRow className="hover:bg-transparent border-b">
                            <TableHead className="w-[300px] px-8 font-black text-[10px] uppercase tracking-widest">Resurs / Bo'lim</TableHead>
                            {ACTIONS.map(action => (
                               <TableHead key={action.id} className="text-center py-6 px-4">
                                  <TooltipProvider>
                                     <Tooltip>
                                        <TooltipTrigger asChild>
                                           <div className="flex flex-col items-center gap-2 cursor-help group">
                                              <div className={`size-2 rounded-full ${action.color} group-hover:scale-125 transition-transform`} />
                                              <span className="text-[10px] font-black uppercase tracking-tight">{action.label}</span>
                                           </div>
                                        </TooltipTrigger>
                                        <TooltipContent><p className="text-xs font-medium">{action.desc}</p></TooltipContent>
                                     </Tooltip>
                                  </TooltipProvider>
                               </TableHead>
                            ))}
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         {RESOURCES.map(resource => (
                            <TableRow key={resource.id} className="hover:bg-muted/5 group transition-colors">
                               <TableCell className="px-8 py-5">
                                  <div className="flex items-center gap-4">
                                     <div className="size-9 rounded-xl bg-muted border flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/5 transition-all">
                                        <resource.icon className="size-4" />
                                     </div>
                                     <span className="font-bold text-sm tracking-tight">{resource.label}</span>
                                  </div>
                               </TableCell>
                               {ACTIONS.map(action => {
                                  const active = hasPermission(selectedRole, resource.id, action.id)
                                  const isToggling = toggling === `${resource.id}-${action.id}`
                                  const isDisabled = selectedRole.isSystem || isToggling

                                  return (
                                    <TableCell key={action.id} className="text-center p-0">
                                       <div className="flex justify-center items-center h-[72px]">
                                          {isToggling ? (
                                            <Loader2 className="size-4 animate-spin text-primary opacity-50" />
                                          ) : (
                                            <div 
                                              className={`size-9 rounded-xl flex items-center justify-center transition-all ${
                                                active ? "bg-emerald-500/10" : "hover:bg-muted/70"
                                              } ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                                              onClick={() => !isDisabled && togglePermission(resource.id, action.id)}
                                            >
                                               <div className={`size-4 rounded-md border-2 transition-all flex items-center justify-center ${
                                                 active ? "bg-emerald-500 border-emerald-500 scale-110 shadow-lg shadow-emerald-500/20" : "border-muted-foreground/20 bg-background"
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
                <CardFooter className="bg-muted/10 border-t p-6 mt-auto">
                   <div className="flex items-start gap-3">
                      <HelpCircle className="size-5 text-primary shrink-0 mt-0.5" />
                      <div>
                         <p className="text-xs font-bold mb-1">Eslatma</p>
                         <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Xodim ruxsatlarini o'zgartirish darhol kuchga kiradi. Tizim xavfsizligi barcha amallarni qayd etib boradi.
                         </p>
                      </div>
                   </div>
                </CardFooter>
             </Card>
           )}
        </div>
      </div>

      {/* Add Role Dialog */}
      <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">Yangi rol yaratish</DialogTitle>
            <DialogDescription className="font-medium text-xs">Markaz xodimlari uchun maxsus kirish darajasi</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-2">
               <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Rol nomi</Label>
               <Input 
                 placeholder="MASALAN: MENEJER" 
                 value={newRole.name} 
                 onChange={e => setNewRole({...newRole, name: e.target.value.toUpperCase().replace(/\s+/g, "_")})}
                 className="rounded-2xl h-12 font-bold border-muted-foreground/20 focus-visible:ring-primary"
               />
            </div>
            <div className="space-y-2">
               <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Tavsif</Label>
               <Input 
                 placeholder="Ushbu rol haqida qisqacha..." 
                 value={newRole.description} 
                 onChange={e => setNewRole({...newRole, description: e.target.value})}
                 className="rounded-2xl h-12 border-muted-foreground/20"
               />
            </div>
          </div>
          <DialogFooter className="gap-3 sm:justify-center">
             <Button variant="ghost" onClick={() => setIsAddRoleOpen(false)} className="rounded-2xl px-6">Bekor qilish</Button>
             <Button 
               onClick={handleAddRole} 
               disabled={adding || !newRole.name}
               className="rounded-2xl px-10 h-11 font-bold shadow-xl shadow-primary/20"
             >
               {adding ? <Loader2 className="size-4 animate-spin mr-2" /> : <Shield className="size-4 mr-2" />}
               Saqlash
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
