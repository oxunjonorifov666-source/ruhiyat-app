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
  Brain, UserPlus, ShieldCheck, ShieldX, Search, MoreHorizontal,
  Eye, Pencil, CheckCircle2, XCircle, Clock, Star,
  ChevronLeft, ChevronRight, Loader2, RefreshCw,
  Mail, Phone, Calendar, Trash2, GraduationCap, Award,
  Building2, Activity, Users,
} from "lucide-react"

interface Psychologist {
  id: number
  userId: number
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
  updatedAt?: string
  avatarUrl?: string | null
  user?: {
    id?: number
    email: string | null
    phone: string | null
    isActive?: boolean
    isBlocked?: boolean
  }
  center?: {
    id: number
    name: string
  } | null
}

interface PsychStats {
  total: number
  approved: number
  pending: number
  rejected: number
}

function getInitials(p: Psychologist): string {
  return `${p.firstName[0] || ""}${p.lastName[0] || ""}`.toUpperCase() || "?"
}

function getDisplayName(p: Psychologist): string {
  return `${p.firstName} ${p.lastName}`
}

function getStatusBadge(p: Psychologist) {
  switch (p.verificationStatus) {
    case "APPROVED":
      return <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-700"><CheckCircle2 className="size-3" />Tasdiqlangan</Badge>
    case "REJECTED":
      return <Badge variant="destructive" className="gap-1"><XCircle className="size-3" />Rad etilgan</Badge>
    default:
      return <Badge variant="secondary" className="gap-1"><Clock className="size-3" />Kutilmoqda</Badge>
  }
}

function getAvailabilityBadge(p: Psychologist) {
  if (p.isAvailable) {
    return <Badge variant="outline" className="gap-1 border-emerald-500 text-emerald-600"><Activity className="size-3" />Faol</Badge>
  }
  return <Badge variant="outline" className="gap-1 border-gray-400 text-gray-500"><XCircle className="size-3" />Nofaol</Badge>
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

function renderStars(rating: number | null) {
  if (rating === null || rating === undefined) return <span className="text-muted-foreground text-sm">—</span>
  return (
    <span className="flex items-center gap-1">
      <Star className="size-3.5 fill-amber-400 text-amber-400" />
      <span className="text-sm font-medium">{rating.toFixed(1)}</span>
    </span>
  )
}

export default function PsychologistsPage() {
  const [data, setData] = useState<Psychologist[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<PsychStats | null>(null)

  const [selectedPsych, setSelectedPsych] = useState<Psychologist | null>(null)
  const [detailPsych, setDetailPsych] = useState<Psychologist | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [rejectReason, setRejectReason] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const [createForm, setCreateForm] = useState({
    firstName: "", lastName: "", patronymic: "", 
    gender: "", dateOfBirth: "",
    email: "", phone: "",
    specialization: "", bio: "", education: "",
    licenseNumber: "", experienceYears: "", hourlyRate: "",
    certifications: [] as string[], certInput: "", avatarUrl: "",
  })
  const [editForm, setEditForm] = useState({
    firstName: "", lastName: "", patronymic: "",
    gender: "", dateOfBirth: "",
    specialization: "", avatarUrl: "",
    bio: "", education: "", licenseNumber: "",
    experienceYears: "", hourlyRate: "",
    certifications: [] as string[], certInput: "",
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string | number | undefined> = { page, limit, search }
      if (statusFilter) params.status = statusFilter
      const res = await apiClient<PaginatedResponse<Psychologist>>("/psychologists", { params })
      setData(res.data)
      setTotal(res.total)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, statusFilter])

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient<PsychStats>("/psychologists/stats")
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

  const handleFilterChange = (value: string) => {
    setStatusFilter(value === "all" ? "" : value)
    setPage(1)
  }

  const clearFilters = () => {
    setStatusFilter("")
    setSearch("")
    setSearchInput("")
    setPage(1)
  }

  const openDetail = async (p: Psychologist) => {
    try {
      const full = await apiClient<Psychologist>(`/psychologists/${p.id}`)
      setDetailPsych(full)
      setDetailOpen(true)
    } catch {
      setDetailPsych(p)
      setDetailOpen(true)
    }
  }

  const openEdit = (p: Psychologist) => {
    setSelectedPsych(p)
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
      avatarUrl: p.avatarUrl || "",
      certifications: p.certifications || [],
      certInput: "",
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
        patronymic: createForm.patronymic || undefined,
        gender: createForm.gender || undefined,
        dateOfBirth: createForm.dateOfBirth || undefined,
      }
      if (createForm.email) body.email = createForm.email
      if (createForm.phone) body.phone = createForm.phone
      if (createForm.specialization) body.specialization = createForm.specialization
      if (createForm.bio) body.bio = createForm.bio
      if (createForm.education) body.education = createForm.education
      if (createForm.licenseNumber) body.licenseNumber = createForm.licenseNumber
      if (createForm.experienceYears) body.experienceYears = parseInt(createForm.experienceYears)
      if (createForm.hourlyRate) body.hourlyRate = parseInt(createForm.hourlyRate)
      if (createForm.avatarUrl) body.avatarUrl = createForm.avatarUrl
      if (createForm.certifications.length > 0) body.certifications = createForm.certifications
      await apiClient("/psychologists", { method: "POST", body })
      setCreateOpen(false)
      setCreateForm({
        firstName: "", lastName: "", patronymic: "",
        gender: "", dateOfBirth: "",
        email: "", phone: "",
        specialization: "", bio: "", education: "",
        licenseNumber: "", experienceYears: "", hourlyRate: "",
        certifications: [], certInput: "", avatarUrl: "",
      })
      refreshAll()
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedPsych) return
    setActionLoading(true)
    setActionError(null)
    try {
      const body: any = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        patronymic: editForm.patronymic || null,
        gender: editForm.gender || null,
        dateOfBirth: editForm.dateOfBirth || null,
      }
      if (editForm.specialization) body.specialization = editForm.specialization
      if (editForm.bio) body.bio = editForm.bio
      if (editForm.education) body.education = editForm.education
      if (editForm.licenseNumber) body.licenseNumber = editForm.licenseNumber
      if (editForm.experienceYears) body.experienceYears = parseInt(editForm.experienceYears)
      if (editForm.hourlyRate) body.hourlyRate = parseInt(editForm.hourlyRate)
      if (editForm.avatarUrl !== undefined) body.avatarUrl = editForm.avatarUrl
      body.certifications = editForm.certifications
      await apiClient(`/psychologists/${selectedPsych.id}`, { method: "PATCH", body })
      setEditOpen(false)
      refreshAll()
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!selectedPsych) return
    setActionLoading(true)
    try {
      await apiClient(`/psychologists/${selectedPsych.id}/verify`, { method: "PATCH" })
      setVerifyOpen(false)
      refreshAll()
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedPsych) return
    setActionLoading(true)
    setActionError(null)
    try {
      await apiClient(`/psychologists/${selectedPsych.id}/reject`, {
        method: "PATCH", body: { reason: rejectReason || undefined },
      })
      setRejectOpen(false)
      setRejectReason("")
      refreshAll()
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedPsych) return
    setActionLoading(true)
    try {
      await apiClient(`/psychologists/${selectedPsych.id}`, { method: "DELETE" })
      setDeleteOpen(false)
      refreshAll()
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const totalPages = Math.ceil(total / limit)
  const hasFilters = statusFilter || search

  return (
    <div className="space-y-6">
      <PageHeader
        title="Psixologlar"
        description="Barcha psixologlarni boshqarish"
        actions={
          <Button onClick={() => { setCreateOpen(true); setActionError(null) }}>
            <UserPlus className="mr-2 size-4" />Yangi psixolog
          </Button>
        }
      />

      <StatsGrid>
        <StatsCard title="Jami psixologlar" value={stats?.total ?? "—"} icon={Users} />
        <StatsCard title="Tasdiqlangan" value={stats?.approved ?? "—"} icon={CheckCircle2} iconColor="bg-emerald-500/10 text-emerald-600" />
        <StatsCard title="Kutilmoqda" value={stats?.pending ?? "—"} icon={Clock} iconColor="bg-amber-500/10 text-amber-600" />
        <StatsCard title="Rad etilgan" value={stats?.rejected ?? "—"} icon={XCircle} iconColor="bg-red-500/10 text-red-600" />
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
              <Select value={statusFilter || "all"} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Holat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha holatlar</SelectItem>
                  <SelectItem value="PENDING">Kutilmoqda</SelectItem>
                  <SelectItem value="APPROVED">Tasdiqlangan</SelectItem>
                  <SelectItem value="REJECTED">Rad etilgan</SelectItem>
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
              <Brain className="mx-auto size-12 mb-3 opacity-30" />
              <p className="text-lg font-medium">Psixologlar topilmadi</p>
              <p className="text-sm">Yangi psixolog qo'shish uchun tugmani bosing</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Psixolog</TableHead>
                    <TableHead>Mutaxassislik</TableHead>
                    <TableHead>Tajriba</TableHead>
                    <TableHead>Reyting</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Mavjudlik</TableHead>
                    <TableHead>Ro'yxatdan</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((p) => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(p)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarFallback className="text-xs font-medium bg-violet-100 text-violet-700">
                              {getInitials(p)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{getDisplayName(p)}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.user?.email || p.user?.phone || `ID: ${p.userId}`}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {p.specialization ? (
                          <span className="text-sm">{p.specialization}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {p.experienceYears !== null ? (
                          <span className="text-sm">{p.experienceYears} yil</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>{renderStars(p.rating)}</TableCell>
                      <TableCell>{getStatusBadge(p)}</TableCell>
                      <TableCell>{getAvailabilityBadge(p)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(p.createdAt)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetail(p)}>
                              <Eye className="mr-2 size-4" />Batafsil ko'rish
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(p)}>
                              <Pencil className="mr-2 size-4" />Tahrirlash
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {p.verificationStatus !== "APPROVED" && (
                              <DropdownMenuItem onClick={() => { setSelectedPsych(p); setVerifyOpen(true); setActionError(null) }}>
                                <CheckCircle2 className="mr-2 size-4 text-emerald-600" />Tasdiqlash
                              </DropdownMenuItem>
                            )}
                            {p.verificationStatus !== "REJECTED" && (
                              <DropdownMenuItem onClick={() => { setSelectedPsych(p); setRejectOpen(true); setActionError(null); setRejectReason("") }}>
                                <XCircle className="mr-2 size-4 text-orange-600" />Rad etish
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setSelectedPsych(p); setDeleteOpen(true) }} className="text-red-600">
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
                    Jami: {total} ta psixolog
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
            <SheetTitle>Psixolog ma'lumotlari</SheetTitle>
            <SheetDescription>To'liq profil</SheetDescription>
          </SheetHeader>
          {detailPsych && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  {detailPsych.avatarUrl ? (
                    <img src={detailPsych.avatarUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <AvatarFallback className="text-lg font-bold bg-violet-100 text-violet-700">
                      {getInitials(detailPsych)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">
                    {detailPsych.lastName} {detailPsych.firstName} {detailPsych.patronymic}
                  </h3>
                  <p className="text-muted-foreground font-medium">{detailPsych.specialization || "Mutaxassislik ko'rsatilmagan"}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusBadge(detailPsych)}
                    {getAvailabilityBadge(detailPsych)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-muted/30 p-4 border border-border/50">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Jinsi / Yoshi</p>
                  <p className="font-semibold text-sm">
                    {detailPsych.gender === 'male' ? 'Erkak' : detailPsych.gender === 'female' ? 'Ayol' : '—'} 
                    {detailPsych.dateOfBirth ? ` / ${new Date().getFullYear() - new Date(detailPsych.dateOfBirth).getFullYear()} yosh` : ''}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/30 p-4 border border-border/50">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Reyting</p>
                  <div className="flex items-center gap-1.5 font-bold text-amber-600">
                    <Star className="size-4 fill-amber-500" />
                    {detailPsych.rating?.toFixed(1) ?? "0.0"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-muted/30 p-4 border border-border/50">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Seanslar</p>
                  <p className="font-semibold">{detailPsych.totalSessions} ta</p>
                </div>
                <div className="rounded-2xl bg-muted/30 p-4 border border-border/50">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Tajriba</p>
                  <p className="font-semibold text-emerald-600">{detailPsych.experienceYears ? `${detailPsych.experienceYears} yil` : "—"}</p>
                </div>
              </div>

              <div className="space-y-3">
                {detailPsych.user?.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="size-4 text-muted-foreground" />
                    <span>{detailPsych.user.email}</span>
                  </div>
                )}
                {detailPsych.user?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="size-4 text-muted-foreground" />
                    <span>{detailPsych.user.phone}</span>
                  </div>
                )}
                {detailPsych.center && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="size-4 text-muted-foreground" />
                    <span>{detailPsych.center.name}</span>
                  </div>
                )}
                {detailPsych.licenseNumber && (
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="size-4 text-muted-foreground" />
                    <span>Litsenziya: {detailPsych.licenseNumber}</span>
                  </div>
                )}
                {detailPsych.education && (
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="size-4 text-muted-foreground" />
                    <span>{detailPsych.education}</span>
                  </div>
                )}
              </div>

              {detailPsych.certifications && detailPsych.certifications.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Sertifikatlar</h4>
                  <div className="flex flex-wrap gap-2">
                    {detailPsych.certifications.map((cert, i) => (
                      <Badge key={i} variant="outline">{cert}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {detailPsych.bio && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Biografiya</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{detailPsych.bio}</p>
                </div>
              )}

              {detailPsych.verificationStatus === "REJECTED" && detailPsych.rejectionReason && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <h4 className="text-sm font-medium text-red-700 mb-1">Rad etish sababi</h4>
                  <p className="text-sm text-red-600">{detailPsych.rejectionReason}</p>
                </div>
              )}

              <div className="border-t pt-3 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  Ro'yxatdan o'tgan: {formatDateTime(detailPsych.createdAt)}
                </div>
                {detailPsych.updatedAt && (
                  <div className="flex items-center gap-1">
                    <Clock className="size-3" />
                    Yangilangan: {formatDateTime(detailPsych.updatedAt)}
                  </div>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => { setDetailOpen(false); openEdit(detailPsych) }}>
                  <Pencil className="mr-1 size-3" />Tahrirlash
                </Button>
                {detailPsych.verificationStatus !== "APPROVED" && (
                  <Button size="sm" onClick={() => { setDetailOpen(false); setSelectedPsych(detailPsych); setVerifyOpen(true); setActionError(null) }}
                    className="bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle2 className="mr-1 size-3" />Tasdiqlash
                  </Button>
                )}
                {detailPsych.verificationStatus !== "REJECTED" && (
                  <Button size="sm" variant="outline" onClick={() => { setDetailOpen(false); setSelectedPsych(detailPsych); setRejectOpen(true); setActionError(null); setRejectReason("") }}
                    className="border-orange-300 text-orange-600 hover:bg-orange-50">
                    <XCircle className="mr-1 size-3" />Rad etish
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
            <DialogTitle>Yangi psixolog qo'shish</DialogTitle>
            <DialogDescription>Psixolog ma'lumotlarini kiriting</DialogDescription>
          </DialogHeader>
          {actionError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-red-600 text-sm">{actionError}</div>
          )}
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase text-muted-foreground">Familiya *</Label>
                <Input value={createForm.lastName} onChange={(e) => setCreateForm(f => ({ ...f, lastName: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase text-muted-foreground">Ism *</Label>
                <Input value={createForm.firstName} onChange={(e) => setCreateForm(f => ({ ...f, firstName: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase text-muted-foreground">Sharifi</Label>
                <Input value={createForm.patronymic} onChange={(e) => setCreateForm(f => ({ ...f, patronymic: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase text-muted-foreground">Jinsi</Label>
                <Select value={createForm.gender} onValueChange={(v) => setCreateForm(f => ({ ...f, gender: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Erkak</SelectItem>
                    <SelectItem value="female">Ayol</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase text-muted-foreground">Tug'ilgan sana</Label>
                <Input type="date" value={createForm.dateOfBirth} onChange={(e) => setCreateForm(f => ({ ...f, dateOfBirth: e.target.value }))} className="mt-1" />
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
              <Label>Mutaxassislik</Label>
              <Input value={createForm.specialization} onChange={(e) => setCreateForm(f => ({ ...f, specialization: e.target.value }))} placeholder="Klinik psixologiya" />
            </div>
            <div>
              <Label>Ta'lim</Label>
              <Input value={createForm.education} onChange={(e) => setCreateForm(f => ({ ...f, education: e.target.value }))} placeholder="Toshkent Davlat Universiteti" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Litsenziya raqami</Label>
                <Input value={createForm.licenseNumber} onChange={(e) => setCreateForm(f => ({ ...f, licenseNumber: e.target.value }))} />
              </div>
              <div>
                <Label>Tajriba (yil)</Label>
                <Input type="number" min="0" max="60" value={createForm.experienceYears} onChange={(e) => setCreateForm(f => ({ ...f, experienceYears: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Soatlik narx (so'm)</Label>
              <Input type="number" min="0" value={createForm.hourlyRate} onChange={(e) => setCreateForm(f => ({ ...f, hourlyRate: e.target.value }))} />
            </div>
            <div>
              <Label>Sertifikatlar</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={createForm.certInput}
                  onChange={(e) => setCreateForm(f => ({ ...f, certInput: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && createForm.certInput.trim()) {
                      e.preventDefault()
                      setCreateForm(f => ({ ...f, certifications: [...f.certifications, f.certInput.trim()], certInput: "" }))
                    }
                  }}
                  placeholder="Sertifikat nomini kiriting va Enter bosing"
                />
              </div>
              {createForm.certifications.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {createForm.certifications.map((c, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 cursor-pointer" onClick={() => setCreateForm(f => ({ ...f, certifications: f.certifications.filter((_, idx) => idx !== i) }))}>
                      {c} <XCircle className="size-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label>Biografiya</Label>
              <Textarea value={createForm.bio} onChange={(e) => setCreateForm(f => ({ ...f, bio: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleCreate} disabled={actionLoading || !createForm.firstName || !createForm.lastName || (!createForm.email && !createForm.phone)}>
              {actionLoading && <Loader2 className="mr-2 size-4 animate-spin" />}Qo'shish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Psixologni tahrirlash</DialogTitle>
            <DialogDescription>{selectedPsych && getDisplayName(selectedPsych)}</DialogDescription>
          </DialogHeader>
          {actionError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-red-600 text-sm">{actionError}</div>
          )}
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase text-muted-foreground">Familiya</Label>
                <Input value={editForm.lastName} onChange={(e) => setEditForm(f => ({ ...f, lastName: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase text-muted-foreground">Ism</Label>
                <Input value={editForm.firstName} onChange={(e) => setEditForm(f => ({ ...f, firstName: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase text-muted-foreground">Sharifi</Label>
                <Input value={editForm.patronymic} onChange={(e) => setEditForm(f => ({ ...f, patronymic: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase text-muted-foreground">Jinsi</Label>
                <Select value={editForm.gender} onValueChange={(v) => setEditForm(f => ({ ...f, gender: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Erkak</SelectItem>
                    <SelectItem value="female">Ayol</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase text-muted-foreground">Tug'ilgan sana</Label>
                <Input type="date" value={editForm.dateOfBirth} onChange={(e) => setEditForm(f => ({ ...f, dateOfBirth: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Mutaxassislik</Label>
              <Input value={editForm.specialization} onChange={(e) => setEditForm(f => ({ ...f, specialization: e.target.value }))} />
            </div>
            <div>
              <Label>Ta'lim</Label>
              <Input value={editForm.education} onChange={(e) => setEditForm(f => ({ ...f, education: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Litsenziya raqami</Label>
                <Input value={editForm.licenseNumber} onChange={(e) => setEditForm(f => ({ ...f, licenseNumber: e.target.value }))} />
              </div>
              <div>
                <Label>Tajriba (yil)</Label>
                <Input type="number" min="0" max="60" value={editForm.experienceYears} onChange={(e) => setEditForm(f => ({ ...f, experienceYears: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Soatlik narx (so'm)</Label>
              <Input type="number" min="0" value={editForm.hourlyRate} onChange={(e) => setEditForm(f => ({ ...f, hourlyRate: e.target.value }))} />
            </div>
            <div>
              <Label>Sertifikatlar</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={editForm.certInput}
                  onChange={(e) => setEditForm(f => ({ ...f, certInput: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && editForm.certInput.trim()) {
                      e.preventDefault()
                      setEditForm(f => ({ ...f, certifications: [...f.certifications, f.certInput.trim()], certInput: "" }))
                    }
                  }}
                  placeholder="Sertifikat nomini kiriting va Enter bosing"
                />
              </div>
              {editForm.certifications.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {editForm.certifications.map((c, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 cursor-pointer" onClick={() => setEditForm(f => ({ ...f, certifications: f.certifications.filter((_, idx) => idx !== i) }))}>
                      {c} <XCircle className="size-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label>Biografiya</Label>
              <Textarea value={editForm.bio} onChange={(e) => setEditForm(f => ({ ...f, bio: e.target.value }))} rows={3} />
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

      <AlertDialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Psixologni tasdiqlash</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedPsych && `${getDisplayName(selectedPsych)} psixologini tasdiqlashni xohlaysizmi? Bu psixolog platformada faoliyat yurita oladi.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleVerify} disabled={actionLoading} className="bg-emerald-600 hover:bg-emerald-700">
              {actionLoading && <Loader2 className="mr-2 size-4 animate-spin" />}Tasdiqlash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Psixologni rad etish</DialogTitle>
            <DialogDescription>
              {selectedPsych && `${getDisplayName(selectedPsych)} psixologini rad etishni xohlaysizmi?`}
            </DialogDescription>
          </DialogHeader>
          {actionError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-red-600 text-sm">{actionError}</div>
          )}
          <div>
            <Label>Rad etish sababi</Label>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Sabab kiriting (ixtiyoriy)" rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Bekor qilish</Button>
            <Button variant="destructive" onClick={handleReject} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 size-4 animate-spin" />}Rad etish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Psixologni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedPsych && `${getDisplayName(selectedPsych)} psixologini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`}
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
