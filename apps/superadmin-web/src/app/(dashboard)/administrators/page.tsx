"use client"

import { useEffect, useState, useCallback } from "react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { PageHeader } from "@/components/page-header"
import { StatsCard, StatsGrid } from "@/components/stats-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Building2, UserPlus, CheckCircle2, XCircle, Search, MoreHorizontal,
  Eye, Pencil, Power, PowerOff, Crown, Users,
  ChevronLeft, ChevronRight, Loader2, RefreshCw,
  Mail, Phone, Calendar, Clock, Trash2, MapPin,
  GraduationCap, BookOpen, Activity,
} from "lucide-react"

interface AdminCenter {
  id: number
  name: string
  phone: string | null
  subscriptionPlan: string
  isActive: boolean
  logoUrl: string | null
  address?: string | null
  email?: string | null
  description?: string | null
  createdAt?: string
  updatedAt?: string
  _count?: {
    students: number
    teachers: number
    courses: number
    psychologists?: number
    staff?: number
  }
}

interface Administrator {
  id: number
  userId: number
  firstName: string
  lastName: string
  position: string | null
  createdAt: string
  updatedAt?: string
  user?: {
    id?: number
    email: string | null
    phone: string | null
    isActive?: boolean
    isBlocked?: boolean
    role?: string
  }
  center: AdminCenter
}

interface AdminStats {
  total: number
  active: number
  inactive: number
  premium: number
}

function getInitials(a: Administrator): string {
  return `${a.firstName[0] || ""}${a.lastName[0] || ""}`.toUpperCase() || "?"
}

function getDisplayName(a: Administrator): string {
  return `${a.firstName} ${a.lastName}`
}

function getStatusBadge(a: Administrator) {
  if (a.center.isActive) {
    return <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-700"><CheckCircle2 className="size-3" />Faol</Badge>
  }
  return <Badge variant="secondary" className="gap-1"><XCircle className="size-3" />Nofaol</Badge>
}

function getPlanBadge(plan: string) {
  if (plan === "PREMIUM") {
    return <Badge className="gap-1 bg-amber-500 hover:bg-amber-600"><Crown className="size-3" />Premium</Badge>
  }
  return <Badge variant="outline" className="gap-1"><Activity className="size-3" />Basic</Badge>
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("uz-UZ", {
    year: "numeric", month: "short", day: "numeric",
  })
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleString("uz-UZ", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export default function AdministratorsPage() {
  const [data, setData] = useState<Administrator[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [planFilter, setPlanFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<AdminStats | null>(null)

  const [selectedAdmin, setSelectedAdmin] = useState<Administrator | null>(null)
  const [detailAdmin, setDetailAdmin] = useState<Administrator | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [activateOpen, setActivateOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const [createForm, setCreateForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    centerName: "", centerDescription: "", address: "",
    centerPhone: "", centerEmail: "", position: "",
    subscriptionPlan: "BASIC",
  })
  const [editForm, setEditForm] = useState({
    firstName: "", lastName: "", position: "",
    centerName: "", centerDescription: "", address: "",
    centerPhone: "", centerEmail: "", subscriptionPlan: "BASIC",
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string | number | undefined> = { page, limit, search }
      if (statusFilter) params.status = statusFilter
      if (planFilter) params.plan = planFilter
      const res = await apiClient<PaginatedResponse<Administrator>>("/administrators", { params })
      setData(res.data)
      setTotal(res.total)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, statusFilter, planFilter])

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient<AdminStats>("/administrators/stats")
      setStats(res)
    } catch {}
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchStats() }, [fetchStats])

  const refreshAll = () => {
    fetchData()
    fetchStats()
  }

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const clearFilters = () => {
    setStatusFilter("")
    setPlanFilter("")
    setSearch("")
    setSearchInput("")
    setPage(1)
  }

  const openDetail = async (a: Administrator) => {
    try {
      const full = await apiClient<Administrator>(`/administrators/${a.id}`)
      setDetailAdmin(full)
      setDetailOpen(true)
    } catch {
      setDetailAdmin(a)
      setDetailOpen(true)
    }
  }

  const openEdit = (a: Administrator) => {
    setSelectedAdmin(a)
    setEditForm({
      firstName: a.firstName || "",
      lastName: a.lastName || "",
      position: a.position || "",
      centerName: a.center.name || "",
      centerDescription: a.center.description || "",
      address: a.center.address || "",
      centerPhone: a.center.phone || "",
      centerEmail: a.center.email || "",
      subscriptionPlan: a.center.subscriptionPlan || "BASIC",
    })
    setEditOpen(true)
    setActionError(null)
  }

  const handleCreate = async () => {
    setActionLoading(true)
    setActionError(null)
    try {
      const body: any = {
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        centerName: createForm.centerName,
        subscriptionPlan: createForm.subscriptionPlan,
      }
      if (createForm.email) body.email = createForm.email
      if (createForm.phone) body.phone = createForm.phone
      if (createForm.centerDescription) body.centerDescription = createForm.centerDescription
      if (createForm.address) body.address = createForm.address
      if (createForm.centerPhone) body.centerPhone = createForm.centerPhone
      if (createForm.centerEmail) body.centerEmail = createForm.centerEmail
      if (createForm.position) body.position = createForm.position
      await apiClient("/administrators", { method: "POST", body })
      setCreateOpen(false)
      setCreateForm({
        firstName: "", lastName: "", email: "", phone: "",
        centerName: "", centerDescription: "", address: "",
        centerPhone: "", centerEmail: "", position: "",
        subscriptionPlan: "BASIC",
      })
      refreshAll()
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedAdmin) return
    setActionLoading(true)
    setActionError(null)
    try {
      const body: any = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        centerName: editForm.centerName,
        subscriptionPlan: editForm.subscriptionPlan,
      }
      if (editForm.position) body.position = editForm.position
      if (editForm.centerDescription) body.centerDescription = editForm.centerDescription
      if (editForm.address) body.address = editForm.address
      if (editForm.centerPhone) body.centerPhone = editForm.centerPhone
      if (editForm.centerEmail) body.centerEmail = editForm.centerEmail
      await apiClient(`/administrators/${selectedAdmin.id}`, { method: "PATCH", body })
      setEditOpen(false)
      refreshAll()
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleActivate = async () => {
    if (!selectedAdmin) return
    setActionLoading(true)
    try {
      await apiClient(`/administrators/${selectedAdmin.id}/activate`, { method: "PATCH" })
      setActivateOpen(false)
      refreshAll()
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeactivate = async () => {
    if (!selectedAdmin) return
    setActionLoading(true)
    try {
      await apiClient(`/administrators/${selectedAdmin.id}/deactivate`, { method: "PATCH" })
      setDeactivateOpen(false)
      refreshAll()
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedAdmin) return
    setActionLoading(true)
    try {
      await apiClient(`/administrators/${selectedAdmin.id}`, { method: "DELETE" })
      setDeleteOpen(false)
      refreshAll()
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const totalPages = Math.ceil(total / limit)
  const hasFilters = statusFilter || planFilter || search

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administratorlar"
        description="Ta'lim markaz administratorlarini boshqarish"
        action={
          <Button onClick={() => { setCreateOpen(true); setActionError(null) }}>
            <UserPlus className="mr-2 size-4" />Yangi administrator
          </Button>
        }
      />

      <StatsGrid>
        <StatsCard title="Jami markazlar" value={stats?.total ?? "—"} icon={Building2} />
        <StatsCard title="Faol markazlar" value={stats?.active ?? "—"} icon={CheckCircle2} variant="success" />
        <StatsCard title="Nofaol markazlar" value={stats?.inactive ?? "—"} icon={XCircle} variant="warning" />
        <StatsCard title="Premium markazlar" value={stats?.premium ?? "—"} icon={Crown} variant="info" />
      </StatsGrid>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Qidirish..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-9 w-[250px]"
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleSearch}>
                <Search className="size-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1) }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Holat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha holatlar</SelectItem>
                  <SelectItem value="active">Faol</SelectItem>
                  <SelectItem value="inactive">Nofaol</SelectItem>
                </SelectContent>
              </Select>
              <Select value={planFilter || "all"} onValueChange={(v) => { setPlanFilter(v === "all" ? "" : v); setPage(1) }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Tarif" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha tariflar</SelectItem>
                  <SelectItem value="BASIC">Basic</SelectItem>
                  <SelectItem value="PREMIUM">Premium</SelectItem>
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Tozalash
                </Button>
              )}
              <Button variant="outline" size="icon" onClick={refreshAll}>
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4 mb-4 text-red-600 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="mx-auto size-12 mb-3 opacity-30" />
              <p className="text-lg font-medium">Administratorlar topilmadi</p>
              <p className="text-sm">Yangi administrator qo'shish uchun tugmani bosing</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Markaz</TableHead>
                    <TableHead>Administrator</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Tarif</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Ro'yxatdan</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((a) => (
                    <TableRow key={a.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(a)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarFallback className="text-xs font-medium bg-blue-100 text-blue-700">
                              {a.center.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{a.center.name}</p>
                            {a.center._count && (
                              <p className="text-xs text-muted-foreground">
                                {a.center._count.students} talaba, {a.center._count.teachers} o'qituvchi
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{getDisplayName(a)}</p>
                          <p className="text-xs text-muted-foreground">{a.user?.email || a.user?.phone || ""}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {a.center.phone || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>{getPlanBadge(a.center.subscriptionPlan)}</TableCell>
                      <TableCell>{getStatusBadge(a)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(a.createdAt)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetail(a)}>
                              <Eye className="mr-2 size-4" />Batafsil ko'rish
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(a)}>
                              <Pencil className="mr-2 size-4" />Tahrirlash
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {a.center.isActive ? (
                              <DropdownMenuItem onClick={() => { setSelectedAdmin(a); setDeactivateOpen(true); setActionError(null) }}>
                                <PowerOff className="mr-2 size-4 text-orange-600" />O'chirish (deaktivatsiya)
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => { setSelectedAdmin(a); setActivateOpen(true); setActionError(null) }}>
                                <Power className="mr-2 size-4 text-emerald-600" />Faollashtirish
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setSelectedAdmin(a); setDeleteOpen(true) }} className="text-red-600">
                              <Trash2 className="mr-2 size-4" />O'chirish
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Jami: {total} ta administrator
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="text-sm">
                      {page} / {totalPages}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Administrator ma'lumotlari</SheetTitle>
            <SheetDescription>To'liq markaz profili</SheetDescription>
          </SheetHeader>
          {detailAdmin && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarFallback className="text-lg font-bold bg-blue-100 text-blue-700">
                    {detailAdmin.center.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{detailAdmin.center.name}</h3>
                  <p className="text-muted-foreground">{getDisplayName(detailAdmin)} {detailAdmin.position ? `— ${detailAdmin.position}` : ""}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(detailAdmin)}
                    {getPlanBadge(detailAdmin.center.subscriptionPlan)}
                  </div>
                </div>
              </div>

              {detailAdmin.center._count && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <Users className="size-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-semibold">{detailAdmin.center._count.students}</p>
                    <p className="text-xs text-muted-foreground">Talabalar</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <GraduationCap className="size-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-semibold">{detailAdmin.center._count.teachers}</p>
                    <p className="text-xs text-muted-foreground">O'qituvchilar</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <BookOpen className="size-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-semibold">{detailAdmin.center._count.courses}</p>
                    <p className="text-xs text-muted-foreground">Kurslar</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {detailAdmin.user?.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="size-4 text-muted-foreground" />
                    <span>{detailAdmin.user.email}</span>
                  </div>
                )}
                {detailAdmin.user?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="size-4 text-muted-foreground" />
                    <span>{detailAdmin.user.phone}</span>
                  </div>
                )}
                {detailAdmin.center.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="size-4 text-muted-foreground" />
                    <span>Markaz: {detailAdmin.center.phone}</span>
                  </div>
                )}
                {detailAdmin.center.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="size-4 text-muted-foreground" />
                    <span>Markaz: {detailAdmin.center.email}</span>
                  </div>
                )}
                {detailAdmin.center.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="size-4 text-muted-foreground" />
                    <span>{detailAdmin.center.address}</span>
                  </div>
                )}
              </div>

              {detailAdmin.center.description && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Markaz haqida</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{detailAdmin.center.description}</p>
                </div>
              )}

              <div className="border-t pt-3 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  Ro'yxatdan o'tgan: {formatDateTime(detailAdmin.createdAt)}
                </div>
                {detailAdmin.center.updatedAt && (
                  <div className="flex items-center gap-1">
                    <Clock className="size-3" />
                    Yangilangan: {formatDateTime(detailAdmin.center.updatedAt)}
                  </div>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => { setDetailOpen(false); openEdit(detailAdmin) }}>
                  <Pencil className="mr-1 size-3" />Tahrirlash
                </Button>
                {detailAdmin.center.isActive ? (
                  <Button size="sm" variant="outline" onClick={() => { setDetailOpen(false); setSelectedAdmin(detailAdmin); setDeactivateOpen(true); setActionError(null) }}
                    className="border-orange-300 text-orange-600 hover:bg-orange-50">
                    <PowerOff className="mr-1 size-3" />Deaktivatsiya
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => { setDetailOpen(false); setSelectedAdmin(detailAdmin); setActivateOpen(true); setActionError(null) }}
                    className="bg-emerald-600 hover:bg-emerald-700">
                    <Power className="mr-1 size-3" />Faollashtirish
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yangi administrator qo'shish</DialogTitle>
            <DialogDescription>Administrator va markaz ma'lumotlarini kiriting</DialogDescription>
          </DialogHeader>
          {actionError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-red-600 text-sm">{actionError}</div>
          )}
          <div className="grid gap-4 py-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Administrator</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ism *</Label>
                <Input value={createForm.firstName} onChange={(e) => setCreateForm(f => ({ ...f, firstName: e.target.value }))} />
              </div>
              <div>
                <Label>Familiya *</Label>
                <Input value={createForm.lastName} onChange={(e) => setCreateForm(f => ({ ...f, lastName: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input type="email" value={createForm.email} onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input value={createForm.phone} onChange={(e) => setCreateForm(f => ({ ...f, phone: e.target.value }))} placeholder="+998901234567" />
              </div>
            </div>
            <div>
              <Label>Lavozim</Label>
              <Input value={createForm.position} onChange={(e) => setCreateForm(f => ({ ...f, position: e.target.value }))} placeholder="Direktor" />
            </div>
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">Markaz</h4>
            </div>
            <div>
              <Label>Markaz nomi *</Label>
              <Input value={createForm.centerName} onChange={(e) => setCreateForm(f => ({ ...f, centerName: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Markaz telefon</Label>
                <Input value={createForm.centerPhone} onChange={(e) => setCreateForm(f => ({ ...f, centerPhone: e.target.value }))} />
              </div>
              <div>
                <Label>Markaz email</Label>
                <Input type="email" value={createForm.centerEmail} onChange={(e) => setCreateForm(f => ({ ...f, centerEmail: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Manzil</Label>
              <Input value={createForm.address} onChange={(e) => setCreateForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div>
              <Label>Tarif rejasi</Label>
              <Select value={createForm.subscriptionPlan} onValueChange={(v) => setCreateForm(f => ({ ...f, subscriptionPlan: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BASIC">Basic</SelectItem>
                  <SelectItem value="PREMIUM">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Markaz haqida</Label>
              <Textarea value={createForm.centerDescription} onChange={(e) => setCreateForm(f => ({ ...f, centerDescription: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleCreate} disabled={actionLoading || !createForm.firstName || !createForm.lastName || !createForm.centerName || (!createForm.email && !createForm.phone)}>
              {actionLoading && <Loader2 className="mr-2 size-4 animate-spin" />}Qo'shish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Administratorni tahrirlash</DialogTitle>
            <DialogDescription>{selectedAdmin && `${getDisplayName(selectedAdmin)} — ${selectedAdmin.center.name}`}</DialogDescription>
          </DialogHeader>
          {actionError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-red-600 text-sm">{actionError}</div>
          )}
          <div className="grid gap-4 py-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Administrator</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ism</Label>
                <Input value={editForm.firstName} onChange={(e) => setEditForm(f => ({ ...f, firstName: e.target.value }))} />
              </div>
              <div>
                <Label>Familiya</Label>
                <Input value={editForm.lastName} onChange={(e) => setEditForm(f => ({ ...f, lastName: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Lavozim</Label>
              <Input value={editForm.position} onChange={(e) => setEditForm(f => ({ ...f, position: e.target.value }))} />
            </div>
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">Markaz</h4>
            </div>
            <div>
              <Label>Markaz nomi</Label>
              <Input value={editForm.centerName} onChange={(e) => setEditForm(f => ({ ...f, centerName: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Markaz telefon</Label>
                <Input value={editForm.centerPhone} onChange={(e) => setEditForm(f => ({ ...f, centerPhone: e.target.value }))} />
              </div>
              <div>
                <Label>Markaz email</Label>
                <Input type="email" value={editForm.centerEmail} onChange={(e) => setEditForm(f => ({ ...f, centerEmail: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Manzil</Label>
              <Input value={editForm.address} onChange={(e) => setEditForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div>
              <Label>Tarif rejasi</Label>
              <Select value={editForm.subscriptionPlan} onValueChange={(v) => setEditForm(f => ({ ...f, subscriptionPlan: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BASIC">Basic</SelectItem>
                  <SelectItem value="PREMIUM">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Markaz haqida</Label>
              <Textarea value={editForm.centerDescription} onChange={(e) => setEditForm(f => ({ ...f, centerDescription: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleEdit} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 size-4 animate-spin" />}Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={activateOpen} onOpenChange={setActivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Markazni faollashtirish</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAdmin && `${selectedAdmin.center.name} markazini faollashtirishni xohlaysizmi?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleActivate} disabled={actionLoading} className="bg-emerald-600 hover:bg-emerald-700">
              {actionLoading && <Loader2 className="mr-2 size-4 animate-spin" />}Faollashtirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Markazni o'chirish (deaktivatsiya)</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAdmin && `${selectedAdmin.center.name} markazini o'chirishni xohlaysizmi? Markaz nofaol holatga o'tadi.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate} disabled={actionLoading} className="bg-orange-600 hover:bg-orange-700">
              {actionLoading && <Loader2 className="mr-2 size-4 animate-spin" />}Deaktivatsiya
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Administratorni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAdmin && `${getDisplayName(selectedAdmin)} (${selectedAdmin.center.name}) administratorini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={actionLoading} className="bg-red-600 hover:bg-red-700">
              {actionLoading && <Loader2 className="mr-2 size-4 animate-spin" />}O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
