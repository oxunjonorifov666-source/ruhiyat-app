"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Brain, Star, Clock, CheckCircle, XCircle, UserPlus, UserMinus, Search, Mail, Phone, MoreHorizontal, Eye, ShieldCheck, GraduationCap, Loader2, Pencil } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/page-header"
import { StatsCard, StatsGrid } from "@/components/stats-card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"

interface Psychologist {
  id: number
  userId: number
  centerId: number | null
  firstName: string
  lastName: string
  patronymic: string | null
  gender: string | null
  dateOfBirth: string | null
  specialization: string | null
  bio: string | null
  education: string | null
  certifications: string[]
  licenseNumber: string | null
  experienceYears: number | null
  verificationStatus: string
  isVerified: boolean
  isAvailable: boolean
  rejectionReason: string | null
  hourlyRate: number | null
  rating: number | null
  totalSessions: number
  createdAt: string
  user?: { email: string | null; phone: string | null; avatarUrl?: string }
}

export default function PsychologistsPage() {
  const { user } = useAuth()
  const centerId = user?.administrator?.centerId
  
  // States for "My Psychologists"
  const [myData, setMyData] = useState<Psychologist[]>([])
  const [myTotal, setMyTotal] = useState(0)
  const [myPage, setMyPage] = useState(1)
  const [mySearch, setMySearch] = useState("")
  const [myLoading, setMyLoading] = useState(true)
  
  // States for "Platform Psychologists"
  const [platformData, setPlatformData] = useState<Psychologist[]>([])
  const [platformTotal, setPlatformTotal] = useState(0)
  const [platformPage, setPlatformPage] = useState(1)
  const [platformSearch, setPlatformSearch] = useState("")
  const [platformLoading, setPlatformLoading] = useState(true)

  const [selected, setSelected] = useState<Psychologist | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  
  const [createForm, setCreateForm] = useState({
    firstName: "", lastName: "", patronymic: "", 
    gender: "", dateOfBirth: "",
    email: "", phone: "",
    specialization: "", bio: "", education: "",
    licenseNumber: "", experienceYears: "", hourlyRate: "",
    avatarUrl: "",
  })
  
  const [editForm, setEditForm] = useState({
    firstName: "", lastName: "", patronymic: "",
    gender: "", dateOfBirth: "",
    specialization: "", bio: "", education: "",
    licenseNumber: "", experienceYears: "", hourlyRate: "",
    avatarUrl: "",
  })

  const fetchMyPsychologists = useCallback(async () => {
    if (!centerId) return
    setMyLoading(true)
    try {
      const res = await apiClient<PaginatedResponse<Psychologist>>("/psychologists", {
        params: { page: myPage, limit: 15, search: mySearch, centerId }
      })
      setMyData(res.data); setMyTotal(res.total)
    } catch (e: any) { toast.error(e.message) }
    finally { setMyLoading(false) }
  }, [centerId, myPage, mySearch])

  const fetchPlatformPsychologists = useCallback(async () => {
    setPlatformLoading(true)
    try {
      const res = await apiClient<PaginatedResponse<Psychologist>>("/psychologists", {
        params: { page: platformPage, limit: 15, search: platformSearch }
      })
      // Mark psychologists that are already in the center
      setPlatformData(res.data); setPlatformTotal(res.total)
    } catch (e: any) { toast.error(e.message) }
    finally { setPlatformLoading(false) }
  }, [platformPage, platformSearch])

  useEffect(() => { fetchMyPsychologists() }, [fetchMyPsychologists])
  useEffect(() => { fetchPlatformPsychologists() }, [fetchPlatformPsychologists])

  const handleAssign = async (id: number) => {
    if (!centerId) return
    setActionLoading(true)
    try {
      await apiClient(`/psychologists/${id}/assign/${centerId}`, { method: "POST" })
      toast.success("Psixolog markazga biriktirildi")
      fetchMyPsychologists()
      fetchPlatformPsychologists()
    } catch (e: any) { toast.error(e.message) }
    finally { setActionLoading(false) }
  }

  const handleUnassign = async (id: number) => {
    if (!centerId) return
    setActionLoading(true)
    try {
      await apiClient(`/psychologists/${id}/unassign/${centerId}`, { method: "DELETE" })
      toast.success("Psixolog markazdan olib tashlandi")
      fetchMyPsychologists()
      fetchPlatformPsychologists()
      if (selected?.id === id) setSelected(null)
    } catch (e: any) { toast.error(e.message) }
    finally { setActionLoading(false) }
  }

  const handleCreate = async () => {
    if (!centerId) return
    setActionLoading(true)
    try {
      const body = {
        ...createForm,
        centerId,
        experienceYears: createForm.experienceYears ? parseInt(createForm.experienceYears) : undefined,
        hourlyRate: createForm.hourlyRate ? parseInt(createForm.hourlyRate) : undefined,
      }
      await apiClient("/psychologists", { method: "POST", body })
      toast.success("Yangi psixolog qo'shildi")
      setCreateOpen(false)
      fetchMyPsychologists()
      setCreateForm({
        firstName: "", lastName: "", patronymic: "", gender: "", dateOfBirth: "",
        email: "", phone: "", specialization: "", bio: "", education: "",
        licenseNumber: "", experienceYears: "", hourlyRate: "", avatarUrl: "",
      })
    } catch (e: any) { toast.error(e.message) }
    finally { setActionLoading(false) }
  }

  const handleEdit = async () => {
    if (!selected || !centerId) return
    setActionLoading(true)
    try {
      const body = {
        ...editForm,
        experienceYears: editForm.experienceYears ? parseInt(editForm.experienceYears) : undefined,
        hourlyRate: editForm.hourlyRate ? parseInt(editForm.hourlyRate) : undefined,
      }
      await apiClient(`/psychologists/${selected.id}?centerId=${centerId}`, { method: "PATCH", body })
      toast.success("Psixolog ma'lumotlari yangilandi")
      setEditOpen(false)
      setSelected(null)
      fetchMyPsychologists()
    } catch (e: any) { toast.error(e.message) }
    finally { setActionLoading(false) }
  }

  const openEdit = (p: Psychologist) => {
    setSelected(p)
    setEditForm({
      firstName: p.firstName || "",
      lastName: p.lastName || "",
      patronymic: p.patronymic || "",
      gender: p.gender || "",
      dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : "",
      specialization: p.specialization || "",
      bio: p.bio || "",
      education: p.education || "",
      licenseNumber: p.licenseNumber || "",
      experienceYears: p.experienceYears?.toString() || "",
      hourlyRate: p.hourlyRate?.toString() || "",
      avatarUrl: p.user?.avatarUrl || "",
    })
    setEditOpen(true)
  }

  const columns = (isPlatform: boolean) => [
    {
      key: "name", title: "Ism",
      render: (p: Psychologist) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{p.firstName} {p.lastName}</span>
          <span className="text-[10px] text-muted-foreground">{p.specialization || "Psixolog"}</span>
        </div>
      ),
    },
    { 
      key: "experience", 
      title: "Tajriba", 
      render: (p: Psychologist) => <span className="text-xs">{p.experienceYears ? `${p.experienceYears} yil` : "—"}</span> 
    },
    {
      key: "rating", title: "Reyting",
      render: (p: Psychologist) => (
        <div className="flex items-center gap-1">
          <Star className="size-3 text-amber-500 fill-amber-500" />
          <span className="text-xs font-medium">{p.rating ? p.rating.toFixed(1) : "—"}</span>
        </div>
      ),
    },
    {
      key: "status", title: "Holat",
      render: (p: Psychologist) => (
        <div className="flex gap-1">
          {p.isVerified && <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 py-0 h-5 text-[10px]">Verify</Badge>}
          {p.isAvailable ? <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 py-0 h-5 text-[10px]">Mavjud</Badge> : <Badge variant="outline" className="bg-slate-50 py-0 h-5 text-[10px]">Band</Badge>}
        </div>
      ),
    },
    { 
      key: "actions", title: "", 
      render: (p: Psychologist) => (
        <div className="flex justify-end gap-2">
          {!isPlatform ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="size-8 p-0"><MoreHorizontal className="size-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelected(p)}><Eye className="mr-2 size-4" /> Ma'lumotlar</DropdownMenuItem>
                <DropdownMenuItem onClick={() => openEdit(p)}><Pencil className="mr-2 size-4" /> Tahrirlash</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUnassign(p.id)} className="text-red-500"><UserMinus className="mr-2 size-4" /> Markazdan olib tashlash</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelected(p)}>
                <Eye className="size-4" />
              </Button>
              {p.centerId === centerId ? (
                <Badge variant="secondary" className="text-[10px]">Biriktirilgan</Badge>
              ) : (
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleAssign(p.id)}>
                  <UserPlus className="size-3.5 mr-1.5" /> Taklif qilish
                </Button>
              )}
            </div>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Psixologlar"
        description="Markaz psixologlari va platforma mutaxassislari"
        icon={Brain}
        actions={[
          {
            label: "Yangi psixolog",
            icon: UserPlus,
            onClick: () => setCreateOpen(true)
          }
        ]}
      />

      <Tabs defaultValue="my" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
          <TabsTrigger value="my">Mening psixologlarim</TabsTrigger>
          <TabsTrigger value="platform">Platforma psixologlari</TabsTrigger>
        </TabsList>

        <TabsContent value="my" className="mt-0">
          <DataTable
            columns={columns(false)}
            data={myData}
            total={myTotal}
            page={myPage}
            limit={15}
            loading={myLoading}
            onPageChange={setMyPage}
            onSearchChange={setMySearch}
            searchPlaceholder="Ism yoki mutaxassislik bo'yicha qidirish..."
          />
        </TabsContent>

        <TabsContent value="platform" className="mt-0">
          <DataTable
            columns={columns(true)}
            data={platformData}
            total={platformTotal}
            page={platformPage}
            limit={15}
            loading={platformLoading}
            onPageChange={setPlatformPage}
            onSearchChange={setPlatformSearch}
            searchPlaceholder="Platformadan psixolog qidirish..."
          />
        </TabsContent>
      </Tabs>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center gap-5 mb-6">
              <Avatar className="size-20 border-2 border-primary/20 p-1 bg-background">
                <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold">
                  {selected?.firstName?.[0]}{selected?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-2xl font-black">{selected?.lastName} {selected?.firstName} {selected?.patronymic}</SheetTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none">{selected?.specialization || "Psixolog"}</Badge>
                  {selected?.isVerified && <Badge className="bg-emerald-500 text-white border-none text-[10px] h-5">VERIFIED</Badge>}
                </div>
              </div>
            </div>
          </SheetHeader>

          {selected && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-border/50 bg-muted/20">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Jinsi / Yoshi</p>
                  <p className="font-bold">
                    {selected.gender === 'male' ? 'Erkak' : selected.gender === 'female' ? 'Ayol' : '—'}
                    {selected.dateOfBirth ? ` / ${new Date().getFullYear() - new Date(selected.dateOfBirth).getFullYear()} yosh` : ''}
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-border/50 bg-muted/20">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Reyting</p>
                  <div className="flex items-center gap-1.5 font-black text-amber-500">
                    <Star className="size-4 fill-amber-500" />
                    {selected.rating ? selected.rating.toFixed(1) : "0.0"}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-border/50 bg-muted/20">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Tajriba</p>
                  <div className="flex items-center gap-2 mt-1 font-bold">
                    <GraduationCap className="size-4 text-primary" />
                    <span>{selected.experienceYears ? `${selected.experienceYears} yil` : "—"}</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl border border-border/50 bg-muted/20">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Seanslar</p>
                  <p className="font-bold">{selected.totalSessions} ta</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Aloqa ma'lumotlari</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail size={16} className="text-muted-foreground" />
                    <span>{selected.user?.email || "Email kiritilmagan"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone size={16} className="text-muted-foreground" />
                    <span>{selected.user?.phone || "Telefon kiritilmagan"}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Psixolog haqida</h4>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  {selected.bio || "Ushbu psixolog haqida ma'lumot kiritilmagan."}
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                {selected.centerId === centerId ? (
                  <>
                    <Button variant="outline" className="flex-1" onClick={() => openEdit(selected)}>
                      <Pencil className="size-4 mr-2" /> Tahrirlash
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => handleUnassign(selected.id)}>
                      <UserMinus className="size-4 mr-2" /> Olib tashlash
                    </Button>
                  </>
                ) : (
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => handleAssign(selected.id)}>
                    <UserPlus className="size-4 mr-2" /> Markazga biriktirish
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Yangi psixolog qo'shish</DialogTitle>
            <DialogDescription>Markazga yangi mutaxassisni ro'yxatdan o'tkazing</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Familiya *</Label>
                <Input value={createForm.lastName} onChange={e => setCreateForm({...createForm, lastName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Ism *</Label>
                <Input value={createForm.firstName} onChange={e => setCreateForm({...createForm, firstName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Sharifi</Label>
                <Input value={createForm.patronymic} onChange={e => setCreateForm({...createForm, patronymic: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Jinsi</Label>
                <Select value={createForm.gender} onValueChange={v => setCreateForm({...createForm, gender: v})}>
                  <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Erkak</SelectItem>
                    <SelectItem value="female">Ayol</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Tug'ilgan sana</Label>
                <Input type="date" value={createForm.dateOfBirth} onChange={e => setCreateForm({...createForm, dateOfBirth: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Email</Label>
                <Input value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Telefon</Label>
                <Input value={createForm.phone} onChange={e => setCreateForm({...createForm, phone: e.target.value})} placeholder="+998" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Mutaxassislik</Label>
              <Input value={createForm.specialization} onChange={e => setCreateForm({...createForm, specialization: e.target.value})} placeholder="Masalan: Klinik psixolog" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Tajriba (yil)</Label>
                <Input type="number" value={createForm.experienceYears} onChange={e => setCreateForm({...createForm, experienceYears: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Soatlik narx</Label>
                <Input type="number" value={createForm.hourlyRate} onChange={e => setCreateForm({...createForm, hourlyRate: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Biografiya</Label>
              <Textarea value={createForm.bio} onChange={e => setCreateForm({...createForm, bio: e.target.value})} className="h-24 resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="rounded-xl">Bekor qilish</Button>
            <Button onClick={handleCreate} disabled={actionLoading} className="rounded-xl px-8">
              {actionLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : <UserPlus className="size-4 mr-2" />} Qo'shish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Psixologni tahrirlash</DialogTitle>
            <DialogDescription>Mutaxassis ma'lumotlarini yangilang</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Familiya</Label>
                <Input value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Ism</Label>
                <Input value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Sharifi</Label>
                <Input value={editForm.patronymic} onChange={e => setEditForm({...editForm, patronymic: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Jinsi</Label>
                <Select value={editForm.gender} onValueChange={v => setEditForm({...editForm, gender: v})}>
                  <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Erkak</SelectItem>
                    <SelectItem value="female">Ayol</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Tug'ilgan sana</Label>
                <Input type="date" value={editForm.dateOfBirth} onChange={e => setEditForm({...editForm, dateOfBirth: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Mutaxassislik</Label>
              <Input value={editForm.specialization} onChange={e => setEditForm({...editForm, specialization: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Tajriba (yil)</Label>
                <Input type="number" value={editForm.experienceYears} onChange={e => setEditForm({...editForm, experienceYears: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Soatlik narx</Label>
                <Input type="number" value={editForm.hourlyRate} onChange={e => setEditForm({...editForm, hourlyRate: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Biografiya</Label>
              <Textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} className="h-24 resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} className="rounded-xl">Bekor qilish</Button>
            <Button onClick={handleEdit} disabled={actionLoading} className="rounded-xl px-8">
              {actionLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : <ShieldCheck className="size-4 mr-2" />} Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
