"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useAuth } from "@/components/auth-provider"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Edit, Trash2, UserPlus, Mail, Phone, Shield, Calendar, Loader2, UserCog } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle,
  SheetFooter
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"

interface Staff {
  id: number
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  position: string | null
  roleId: number | null
  role?: { name: string; isSystem: boolean }
  isActive: boolean
  createdAt: string
}

interface Role {
  id: number
  name: string
  isSystem: boolean
}

export default function StaffPage() {
  const { user } = useAuth()
  const router = useRouter()
  const centerId = user?.administrator?.centerId
  
  const [data, setData] = useState<Staff[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    roleId: "",
    isActive: true
  })

  const fetchData = useCallback(async () => {
    if (!centerId) return
    setLoading(true); setError(null)
    try {
      // 1. Fetch Staff
      const res = await apiClient<PaginatedResponse<Staff>>(`/education-centers/${centerId}/staff`, {
        params: { page, limit: 15, search }
      })
      setData(res.data); setTotal(res.total)
      
      // 2. Fetch Roles (once)
      if (roles.length === 0) {
        const rolesRes = await apiClient<Role[]>(`/roles`, { params: { centerId } })
        setRoles(rolesRes || [])
      }
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [centerId, page, search, roles])

  useEffect(() => { fetchData() }, [fetchData])

  const openForm = (staff: Staff | null = null) => {
    if (staff) {
      setSelectedStaff(staff)
      setForm({
        firstName: staff.firstName || "",
        lastName: staff.lastName || "",
        email: staff.email || "",
        phone: staff.phone || "",
        position: staff.position || "",
        roleId: staff.roleId?.toString() || "",
        isActive: staff.isActive
      })
    } else {
      setSelectedStaff(null)
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        position: "",
        roleId: "",
        isActive: true
      })
    }
    setIsSheetOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!centerId) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        roleId: form.roleId ? parseInt(form.roleId) : null,
        centerId
      }
      
      if (selectedStaff) {
        await apiClient(`/education-centers/${centerId}/staff/${selectedStaff.id}`, {
          method: "PATCH",
          body: payload
        })
      } else {
        await apiClient(`/education-centers/${centerId}/staff`, {
          method: "POST",
          body: payload
        })
      }
      setIsSheetOpen(false)
      fetchData()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!centerId || !confirm("Haqiqatan ham ushbu xodimni o'chirmoqchimisiz?")) return
    try {
      await apiClient(`/education-centers/${centerId}/staff/${id}`, { method: "DELETE" })
      fetchData()
    } catch (e: any) { alert(e.message) }
  }

  const columns = [
    {
      key: "name", 
      title: "Xodim",
      render: (s: Staff) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {s.firstName || s.lastName ? `${s.firstName || ''} ${s.lastName || ''}`.trim() : "Ismsiz"}
          </span>
          <div className="flex items-center gap-2 mt-1">
            {s.email && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Mail size={10} />{s.email}</span>}
          </div>
        </div>
      ),
    },
    { 
      key: "role", 
      title: "Rol va Lavozim", 
      render: (s: Staff) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Shield size={12} className="text-primary" />
            <span className="text-xs font-medium">{s.role?.name || "Rol yo'q"}</span>
          </div>
          <span className="text-[10px] text-muted-foreground ml-4">{s.position || "—"}</span>
        </div>
      )
    },
    { 
      key: "isActive", 
      title: "Holat", 
      render: (s: Staff) => (
        <Badge variant={s.isActive ? "default" : "secondary"} className="text-[10px] h-5">
          {s.isActive ? "Faol" : "Nofaol"}
        </Badge>
      ) 
    },
    { 
      key: "createdAt", 
      title: "Qo'shilgan", 
      render: (s: Staff) => (
        <span className="text-[10px] text-muted-foreground font-mono">
          {new Date(s.createdAt).toLocaleDateString("uz-UZ")}
        </span>
      )
    },
    { 
      key: "actions", 
      title: "", 
      render: (s: Staff) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0"><MoreHorizontal className="size-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openForm(s)}><Edit className="mr-2 size-4" /> Tahrirlash</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDelete(s.id)} className="text-red-500"><Trash2 className="mr-2 size-4" /> O'chirish</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ]

  if (!centerId) return <div className="p-8 text-center text-muted-foreground">Markaz topilmadi</div>

  return (
    <div className="space-y-6">
      <PageHeader
        title="Xodimlar"
        description="Markaz ma'muriyati va xodimlarini boshqarish"
        icon={UserCog}
        actions={[
          { label: "Yangi xodim", icon: UserPlus, onClick: () => openForm() }
        ]}
      />

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={15}
        loading={loading}
        error={error}
        onPageChange={setPage}
        onSearchChange={setSearch}
        searchPlaceholder="Ism yoki lavozim bo'yicha qidiruv..."
      />

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{selectedStaff ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}</SheetTitle>
            <SheetDescription>
              Xodimning shaxsiy ma'lumotlarini kiriting va rol biriktiring.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSave} className="space-y-5 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Ism</Label>
                <Input 
                  id="firstName" 
                  value={form.firstName} 
                  onChange={(e) => setForm({...form, firstName: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Familiya</Label>
                <Input 
                  id="lastName" 
                  value={form.lastName} 
                  onChange={(e) => setForm({...form, lastName: e.target.value})} 
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email"
                value={form.email} 
                onChange={(e) => setForm({...form, email: e.target.value})} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Lavozim</Label>
              <Input 
                id="position" 
                value={form.position} 
                onChange={(e) => setForm({...form, position: e.target.value})} 
                placeholder="Masalan: Katta menedjer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Tizimdagi roli</Label>
              <Select 
                value={form.roleId} 
                onValueChange={(v) => setForm({...form, roleId: v})}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Rolni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      <div className="flex items-center gap-2">
                        {role.name}
                        {role.isSystem && <Badge variant="outline" className="text-[9px] h-4">System</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground mt-1 underline cursor-pointer" onClick={() => router.push('/staff-roles')}>
                Rollar va ruxsatlarni boshqarish
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <Label>Xodim faolligi</Label>
                <p className="text-[10px] text-muted-foreground">O'chirilgan xodimlar tizimga kira olmaydi</p>
              </div>
              <Switch 
                checked={form.isActive} 
                onCheckedChange={(v: boolean) => setForm({...form, isActive: v})} 
              />
            </div>

            <SheetFooter className="mt-8">
              <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)} className="flex-1">
                Bekor qilish
              </Button>
              <Button type="submit" disabled={saving} className="flex-1">
                {saving && <Loader2 className="size-4 animate-spin mr-2" />}
                {selectedStaff ? "Yangilash" : "Qo'shish"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
