"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useAuth } from "@/components/auth-provider"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Edit, Eye, Trash2, UserPlus, Mail, Phone, Calendar, ShieldCheck, ShieldAlert, Loader2, Users } from "lucide-react"
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

interface Student {
  id: number
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  isActive: boolean
  createdAt: string
  dateOfBirth: string | null
  enrollments?: { id: number; course?: { name: string } | null }[]
}

export default function StudentsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const centerCtx = useSuperadminCenter(user)
  const centerId = centerCtx.effectiveCenterId
  
  const [data, setData] = useState<Student[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  
  // Form state
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [saving, setSaving] = useState(false)
  const [sheetApiError, setSheetApiError] = useState<EmbeddedApiErrorDescription | null>(null)
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    isActive: true
  })

  const fetchData = useCallback(async () => {
    if (!centerId) return
    setLoading(true)
    setError(null)
    setPermissionDenied(false)
    try {
      const endpoint = buildCenterEndpoint("students", centerId)
      const res = await apiClient<any>(endpoint, {
        params: { page, limit: 15, search }
      })
      const respData = res.data || (Array.isArray(res) ? res : [])
      const respTotal = res.total ?? (Array.isArray(res) ? res.length : 0)
      setData(respData); setTotal(respTotal)
    } catch (e: unknown) {
      const { permissionDenied: denied } = classifyApiError(e)
      setError(formatEmbeddedApiError(e))
      setPermissionDenied(denied)
    }
    finally { setLoading(false) }
  }, [centerId, page, search])

  useEffect(() => { fetchData() }, [fetchData])

  const openForm = (student: Student | null = null) => {
    setSheetApiError(null)
    if (student) {
      setSelectedStudent(student)
      setForm({
        firstName: student.firstName || "",
        lastName: student.lastName || "",
        email: student.email || "",
        phone: student.phone || "",
        dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : "",
        isActive: student.isActive
      })
    } else {
      setSelectedStudent(null)
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
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
      dateOfBirth: form.dateOfBirth
        ? new Date(`${form.dateOfBirth}T12:00:00`).toISOString()
        : null,
      isActive: form.isActive,
    }
    try {
      if (selectedStudent) {
        await apiClient(`/students/${selectedStudent.id}`, {
          method: "PATCH",
          body,
          params,
        })
        toast.success("O'quvchi yangilandi")
      } else {
        await apiClient("/students", {
          method: "POST",
          body,
          params,
        })
        toast.success("O'quvchi qo'shildi")
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

  const handleDelete = async (studentId: number) => {
    if (!centerId || !confirm("Haqiqatan ham ushbu o'quvchini o'chirmoqchimisiz?")) return
    try {
      await apiClient(`/students/${studentId}`, {
        method: "DELETE",
        params: centerIdQuery(centerId),
      })
      toast.success("O'quvchi o'chirildi")
      fetchData()
    } catch (err: unknown) {
      const d = describeEmbeddedApiError(err)
      toast.error(d.title, { description: d.description })
    }
  }

  const columns = [
    {
      key: "name", 
      title: "O'quvchi",
      render: (s: Student) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {s.firstName || s.lastName ? `${s.firstName || ''} ${s.lastName || ''}`.trim() : "Ismsiz"}
          </span>
          <div className="flex items-center gap-2 mt-1">
            {s.email && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Mail size={10} />{s.email}</span>}
            {s.phone && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Phone size={10} />{s.phone}</span>}
          </div>
        </div>
      ),
    },
    { 
      key: "courses", 
      title: "Kurslar", 
      render: (s: Student) => (
        <div className="flex flex-wrap gap-1">
          {s.enrollments && s.enrollments.length > 0 ? (
            s.enrollments.map((e, i) => (
              <Badge key={i} variant="outline" className="text-[10px] py-0 h-5 font-normal">
                {e.course?.name ?? "—"}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">Kurslar yo'q</span>
          )}
        </div>
      )
    },
    { 
      key: "isActive", 
      title: "Holat", 
      render: (s: Student) => (
        <Badge 
          variant="outline" 
          className={s.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"}
        >
          {s.isActive ? "Faol" : "Nofaol"}
        </Badge>
      ) 
    },
    { 
      key: "createdAt", 
      title: "Qo'shilgan", 
      render: (s: Student) => (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar size={12} />
          {new Date(s.createdAt).toLocaleDateString("uz-UZ")}
        </span>
      )
    },
    { 
      key: "actions", 
      title: "", 
      render: (s: Student) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0"><MoreHorizontal className="size-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => openForm(s)}><Edit className="mr-2 size-4" /> Tahrirlash</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(withCenterQuery(`/students/${s.id}`, centerId))}><Eye className="mr-2 size-4" /> Ma'lumotlar</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDelete(s.id)} className="text-red-600"><Trash2 className="mr-2 size-4" /> O'chirish</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ]

  if (centerCtx.needsCenterSelection) {
    return (
      <SuperadminCenterRequiredScreen
        title="O'quvchilar"
        description="Markaz bo'yicha o'quvchilar ro'yxati va boshqaruv"
        icon={Users}
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
          title="O'quvchilar"
          description="Markaz o'quvchilari va ularning kurslardagi ishtirokini boshqaring"
          icon={Users}
        />
        <AccessDeniedPlaceholder
          title="O'quvchilarga ruxsat yo'q"
          description="O'quvchilar ro'yxati odatda students.read / students.write ruxsatlarini talab qiladi."
          detail={error}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="O'quvchilar"
        description={`${centerCtx.centerDisplayName} — o'quvchilar va kurslardagi ishtirok`}
        icon={Users}
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
              Yangi o&apos;quvchi
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
        searchPlaceholder="Ism, telefon yoki email bo'yicha qidirish..."
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
            <SheetTitle>{selectedStudent ? "O'quvchini tahrirlash" : "Yangi o'quvchi qo'shish"}</SheetTitle>
            <SheetDescription>
              O'quvchining shaxsiy ma'lumotlarini kiriting.
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

            <div className="space-y-2">
              <Label htmlFor="dob">Tug'ilgan sana</Label>
              <Input 
                id="dob" 
                type="date"
                value={form.dateOfBirth} 
                onChange={(e) => setForm({...form, dateOfBirth: e.target.value})} 
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <Label>Faollik holati</Label>
                <p className="text-[10px] text-muted-foreground">O'quvchi tizimda faolmi?</p>
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
                {selectedStudent ? "Yangilash" : "Qo'shish"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
