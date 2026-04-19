"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/components/auth-provider"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Edit, Eye, Trash2, UserPlus, Mail, Phone, BookOpen, Calendar, Loader2, GraduationCap } from "lucide-react"
import { RoleGuard } from "@/components/role-guard"
import { buildCenterEndpoint, centerIdQuery, withCenterQuery } from "@/lib/endpoints"
import { useSuperadminCenter } from "@/hooks/use-superadmin-center"
import { SuperadminCenterRequiredScreen, SuperadminCenterSelect } from "@/components/superadmin-center-select"
import { PageHeader } from "@/components/page-header"
import { toast } from "sonner"
import {
  classifyApiError,
  describeEmbeddedApiError,
  formatEmbeddedApiError,
  type EmbeddedApiErrorDescription,
} from "@/lib/api-error"
import { EmbeddedApiErrorBanner } from "@/components/embedded-api-error-banner"
import { AccessDeniedPlaceholder } from "@/components/access-denied-placeholder"
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

interface Teacher {
  id: number
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  subject: string | null
  isActive: boolean
  createdAt: string
}

export default function TeachersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const centerCtx = useSuperadminCenter(user)
  const centerId = centerCtx.effectiveCenterId
  
  const [data, setData] = useState<Teacher[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  
  // Form state
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [saving, setSaving] = useState(false)
  const [sheetApiError, setSheetApiError] = useState<EmbeddedApiErrorDescription | null>(null)
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    isActive: true
  })

  const fetchData = useCallback(async () => {
    if (!centerId) return
    setLoading(true)
    setError(null)
    setPermissionDenied(false)
    try {
      const endpoint = buildCenterEndpoint("teachers", centerId)
      const res = await apiClient<PaginatedResponse<Teacher>>(endpoint, {
        params: { page, limit: 15, search }
      })
      setData(res.data); setTotal(res.total)
    } catch (e: unknown) {
      const { permissionDenied: denied } = classifyApiError(e)
      setError(formatEmbeddedApiError(e))
      setPermissionDenied(denied)
    }
    finally { setLoading(false) }
  }, [centerId, page, search])

  useEffect(() => { fetchData() }, [fetchData])

  const openForm = (teacher: Teacher | null = null) => {
    setSheetApiError(null)
    if (teacher) {
      setSelectedTeacher(teacher)
      setForm({
        firstName: teacher.firstName || "",
        lastName: teacher.lastName || "",
        email: teacher.email || "",
        phone: teacher.phone || "",
        subject: teacher.subject || "",
        isActive: teacher.isActive
      })
    } else {
      setSelectedTeacher(null)
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        subject: "",
        isActive: true
      })
    }
    setIsSheetOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!centerId) return
    setSaving(true)
    const params = centerIdQuery(centerId)
    const body = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      subject: form.subject.trim() || null,
      isActive: form.isActive,
    }
    try {
      if (selectedTeacher) {
        await apiClient(`/teachers/${selectedTeacher.id}`, {
          method: "PATCH",
          body,
          params,
        })
        toast.success("O'qituvchi yangilandi")
      } else {
        await apiClient("/teachers", {
          method: "POST",
          body,
          params,
        })
        toast.success("O'qituvchi qo'shildi")
      }
      setIsSheetOpen(false)
      fetchData()
    } catch (err: unknown) {
      const d = describeEmbeddedApiError(err)
      setSheetApiError(d)
      toast.error(d.title, { description: d.description })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (teacherId: number) => {
    if (!centerId || !confirm("Haqiqatan ham ushbu o'qituvchini o'chirmoqchimisiz?")) return
    try {
      await apiClient(`/teachers/${teacherId}`, {
        method: "DELETE",
        params: centerIdQuery(centerId),
      })
      toast.success("O'qituvchi o'chirildi")
      fetchData()
    } catch (err: unknown) {
      const d = describeEmbeddedApiError(err)
      toast.error(d.title, { description: d.description })
    }
  }

  const columns = [
    {
      key: "name", 
      title: "O'qituvchi",
      render: (t: Teacher) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {t.firstName || t.lastName ? `${t.firstName || ''} ${t.lastName || ''}`.trim() : "Ismsiz"}
          </span>
          <div className="flex items-center gap-2 mt-1">
            {t.email && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Mail size={10} />{t.email}</span>}
            {t.phone && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Phone size={10} />{t.phone}</span>}
          </div>
        </div>
      ),
    },
    { 
      key: "subject", 
      title: "Mutaxassislik", 
      render: (t: Teacher) => (
        <div className="flex items-center gap-1.5">
          <BookOpen size={14} className="text-muted-foreground" />
          <span className="text-sm">{t.subject || "Belgilanmagan"}</span>
        </div>
      )
    },
    { 
      key: "isActive", 
      title: "Holat", 
      render: (t: Teacher) => (
        <Badge 
          variant="outline" 
          className={t.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"}
        >
          {t.isActive ? "Faol" : "Nofaol"}
        </Badge>
      ) 
    },
    { 
      key: "createdAt", 
      title: "Qo'shilgan", 
      render: (t: Teacher) => (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar size={12} />
          {new Date(t.createdAt).toLocaleDateString("uz-UZ")}
        </span>
      )
    },
    { 
      key: "actions", 
      title: "", 
      render: (t: Teacher) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0"><MoreHorizontal className="size-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => openForm(t)}><Edit className="mr-2 size-4" /> Tahrirlash</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(withCenterQuery(`/teachers/${t.id}`, centerId))}><Eye className="mr-2 size-4" /> Ma'lumotlar</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDelete(t.id)} className="text-red-600"><Trash2 className="mr-2 size-4" /> O'chirish</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ]

  if (centerCtx.needsCenterSelection) {
    return (
      <SuperadminCenterRequiredScreen
        title="O'qituvchilar"
        description="Markaz bo'yicha o'qituvchilar ro'yxati va boshqaruv"
        icon={GraduationCap}
        centers={centerCtx.centers}
        centersLoading={centerCtx.centersLoading}
        setCenterId={centerCtx.setCenterId}
      />
    )
  }

  if (!centerId) {
    return <div className="p-8 text-center text-muted-foreground">Markaz topilmadi</div>
  }

  if (permissionDenied) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="O'qituvchilar"
          description="Markaz o'qituvchilari va ularning mutaxassisliklarini boshqaring"
          icon={GraduationCap}
        />
        <AccessDeniedPlaceholder
          title="O'qituvchilarga ruxsat yo'q"
          description="O'qituvchilar ro'yxati odatda teachers.read / teachers.write ruxsatlarini talab qiladi."
          detail={error}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="O'qituvchilar"
        description={`${centerCtx.centerDisplayName} — o'qituvchilar va mutaxassisliklar`}
        icon={GraduationCap}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {centerCtx.isSuperadmin && (
              <SuperadminCenterSelect
                centers={centerCtx.centers}
                centersLoading={centerCtx.centersLoading}
                value={centerCtx.effectiveCenterId}
                onChange={centerCtx.setCenterId}
              />
            )}
            <Button size="sm" onClick={() => openForm()}>
              <UserPlus className="mr-2 size-4" />
              Yangi o&apos;qituvchi
            </Button>
          </div>
        }
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
        searchPlaceholder="Ism, fan yoki aloqa ma'lumotlari..."
      />

      <Sheet
        open={isSheetOpen}
        onOpenChange={(o) => {
          setIsSheetOpen(o)
          if (!o) setSheetApiError(null)
        }}
      >
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{selectedTeacher ? "O'qituvchini tahrirlash" : "Yangi o'qituvchi qo'shish"}</SheetTitle>
            <SheetDescription>
              O'qituvchining shaxsiy va professional ma'lumotlarini kiriting.
            </SheetDescription>
          </SheetHeader>

          <EmbeddedApiErrorBanner error={sheetApiError} className="mt-4" />

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
              <Label htmlFor="subject">Dars beradigan fani / Mutaxassislik</Label>
              <Input 
                id="subject" 
                value={form.subject} 
                onChange={(e) => setForm({...form, subject: e.target.value})} 
                placeholder="Masalan: Matematika, Psixologiya"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email manzili</Label>
              <Input 
                id="email" 
                type="email"
                value={form.email} 
                onChange={(e) => setForm({...form, email: e.target.value})} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon raqami</Label>
              <Input 
                id="phone" 
                value={form.phone} 
                onChange={(e) => setForm({...form, phone: e.target.value})} 
                placeholder="+998"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <Label>Faollik holati</Label>
                <p className="text-[10px] text-muted-foreground">O'qituvchi dars o'tish imkoniyatiga egami?</p>
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
                {selectedTeacher ? "Yangilash" : "Qo'shish"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
