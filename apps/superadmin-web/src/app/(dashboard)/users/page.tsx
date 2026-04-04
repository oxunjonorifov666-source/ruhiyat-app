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
  Users, UserPlus, UserCheck, UserX, Search, MoreHorizontal,
  Eye, Pencil, Ban, CheckCircle2, XCircle, Shield, ShieldAlert,
  ChevronLeft, ChevronRight, Loader2, RefreshCw,
  Mail, Phone, Calendar, Clock,
} from "lucide-react"

interface User {
  id: number
  email: string | null
  phone: string | null
  firstName: string | null
  lastName: string | null
  role: string
  isActive: boolean
  isBlocked: boolean
  blockedAt: string | null
  blockedReason: string | null
  isVerified: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt?: string
}

interface UserStats {
  total: number
  active: number
  blocked: number
  newUsers: number
}

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: "Superadmin",
  ADMINISTRATOR: "Administrator",
  MOBILE_USER: "Foydalanuvchi",
}

const ROLE_COLORS: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
  SUPERADMIN: "destructive",
  ADMINISTRATOR: "default",
  MOBILE_USER: "secondary",
}

function getInitials(user: User): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
  }
  if (user.firstName) return user.firstName[0].toUpperCase()
  if (user.email) return user.email[0].toUpperCase()
  return "?"
}

function getUserDisplayName(user: User): string {
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
  if (user.firstName) return user.firstName
  return user.email || user.phone || `#${user.id}`
}

function getStatusBadge(user: User) {
  if (user.isBlocked) {
    return <Badge variant="destructive" className="gap-1"><Ban className="size-3" />Bloklangan</Badge>
  }
  if (!user.isActive) {
    return <Badge variant="secondary" className="gap-1"><XCircle className="size-3" />Nofaol</Badge>
  }
  return <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-700"><CheckCircle2 className="size-3" />Faol</Badge>
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

export default function UsersPage() {
  const [data, setData] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)

  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [detailUser, setDetailUser] = useState<User | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const [unblockOpen, setUnblockOpen] = useState(false)
  const [activateOpen, setActivateOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [roleChangeOpen, setRoleChangeOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [blockReason, setBlockReason] = useState("")
  const [newRole, setNewRole] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const [createForm, setCreateForm] = useState({
    email: "", phone: "", password: "", firstName: "", lastName: "", role: "MOBILE_USER",
  })
  const [editForm, setEditForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string | number | undefined> = { page, limit, search }
      if (roleFilter) params.role = roleFilter
      if (statusFilter) params.status = statusFilter
      const res = await apiClient<PaginatedResponse<User>>("/users", { params })
      setData(res.data)
      setTotal(res.total)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, roleFilter, statusFilter])

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient<UserStats>("/users/stats")
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

  const handleFilterChange = (key: string, value: string) => {
    if (key === "role") setRoleFilter(value === "all" ? "" : value)
    if (key === "status") setStatusFilter(value === "all" ? "" : value)
    setPage(1)
  }

  const clearFilters = () => {
    setRoleFilter("")
    setStatusFilter("")
    setSearch("")
    setSearchInput("")
    setPage(1)
  }

  const openDetail = async (user: User) => {
    try {
      const full = await apiClient<User>(`/users/${user.id}`)
      setDetailUser(full)
      setDetailOpen(true)
    } catch {
      setDetailUser(user)
      setDetailOpen(true)
    }
  }

  const openEdit = (user: User) => {
    setSelectedUser(user)
    setEditForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
    })
    setEditOpen(true)
    setActionError(null)
  }

  const openRoleChange = (user: User) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setRoleChangeOpen(true)
    setActionError(null)
  }

  const handleCreate = async () => {
    setActionLoading(true)
    setActionError(null)
    try {
      await apiClient("/users", { method: "POST", body: createForm })
      setCreateOpen(false)
      setCreateForm({ email: "", phone: "", password: "", firstName: "", lastName: "", role: "MOBILE_USER" })
      refreshAll()
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedUser) return
    setActionLoading(true)
    setActionError(null)
    try {
      await apiClient(`/users/${selectedUser.id}`, { method: "PATCH", body: editForm })
      setEditOpen(false)
      refreshAll()
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleBlock = async () => {
    if (!selectedUser) return
    setActionLoading(true)
    setActionError(null)
    try {
      await apiClient(`/users/${selectedUser.id}/block`, {
        method: "PATCH", body: { reason: blockReason || undefined },
      })
      setBlockOpen(false)
      setBlockReason("")
      refreshAll()
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnblock = async () => {
    if (!selectedUser) return
    setActionLoading(true)
    try {
      await apiClient(`/users/${selectedUser.id}/unblock`, { method: "PATCH" })
      setUnblockOpen(false)
      refreshAll()
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleActivate = async () => {
    if (!selectedUser) return
    setActionLoading(true)
    try {
      await apiClient(`/users/${selectedUser.id}`, {
        method: "PATCH", body: { isActive: true },
      })
      setActivateOpen(false)
      refreshAll()
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeactivate = async () => {
    if (!selectedUser) return
    setActionLoading(true)
    try {
      await apiClient(`/users/${selectedUser.id}`, {
        method: "PATCH", body: { isActive: false },
      })
      setDeactivateOpen(false)
      refreshAll()
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRoleChange = async () => {
    if (!selectedUser || newRole === selectedUser.role) return
    setActionLoading(true)
    setActionError(null)
    try {
      await apiClient(`/users/${selectedUser.id}`, {
        method: "PATCH", body: { role: newRole },
      })
      setRoleChangeOpen(false)
      refreshAll()
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return
    setActionLoading(true)
    try {
      await apiClient(`/users/${selectedUser.id}`, { method: "DELETE" })
      setDeleteOpen(false)
      refreshAll()
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const totalPages = Math.ceil(total / limit)
  const hasActiveFilters = !!roleFilter || !!statusFilter || !!search

  return (
    <div className="space-y-6">
      <PageHeader
        title="Foydalanuvchilar"
        description="Barcha foydalanuvchilarni boshqarish, qidirish va nazorat qilish"
        icon={Users}
        badge={stats ? `${stats.total} ta` : undefined}
        actions={[
          { label: "Yangilash", onClick: refreshAll, icon: RefreshCw, variant: "outline" },
          { label: "Foydalanuvchi qo'shish", onClick: () => { setCreateOpen(true); setActionError(null) }, icon: UserPlus },
        ]}
      />

      <StatsGrid columns={4}>
        <StatsCard
          title="Jami foydalanuvchilar"
          value={stats?.total ?? "—"}
          icon={Users}
          iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatsCard
          title="Faol foydalanuvchilar"
          value={stats?.active ?? "—"}
          icon={UserCheck}
          iconColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatsCard
          title="Bloklangan"
          value={stats?.blocked ?? "—"}
          icon={UserX}
          iconColor="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        />
        <StatsCard
          title="Yangi (30 kun)"
          value={stats?.newUsers ?? "—"}
          icon={UserPlus}
          iconColor="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
        />
      </StatsGrid>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Ism, email yoki telefon bo'yicha qidirish..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={roleFilter || "all"} onValueChange={(v) => handleFilterChange("role", v)}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha rollar</SelectItem>
                  <SelectItem value="SUPERADMIN">Superadmin</SelectItem>
                  <SelectItem value="ADMINISTRATOR">Administrator</SelectItem>
                  <SelectItem value="MOBILE_USER">Foydalanuvchi</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter || "all"} onValueChange={(v) => handleFilterChange("status", v)}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="Holat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha holatlar</SelectItem>
                  <SelectItem value="active">Faol</SelectItem>
                  <SelectItem value="inactive">Nofaol</SelectItem>
                  <SelectItem value="blocked">Bloklangan</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleSearch} className="h-9">
                <Search className="size-4 mr-1" />Qidirish
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-muted-foreground">
                  <XCircle className="size-4 mr-1" />Tozalash
                </Button>
              )}
            </div>
          </div>
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Filtrlar:</span>
              {roleFilter && (
                <Badge variant="secondary" className="text-xs">{ROLE_LABELS[roleFilter] || roleFilter}</Badge>
              )}
              {statusFilter && (
                <Badge variant="secondary" className="text-xs capitalize">{
                  statusFilter === "active" ? "Faol" : statusFilter === "inactive" ? "Nofaol" : "Bloklangan"
                }</Badge>
              )}
              {search && (
                <Badge variant="secondary" className="text-xs">&quot;{search}&quot;</Badge>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400 mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="size-12 mb-3 opacity-40" />
              <p className="text-lg font-medium">Foydalanuvchi topilmadi</p>
              <p className="text-sm mt-1">Qidiruv yoki filtrlarni o&apos;zgartiring</p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
                  Filtrlarni tozalash
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[280px]">Foydalanuvchi</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead>Tasdiqlangan</TableHead>
                      <TableHead>Ro&apos;yxatdan o&apos;tgan</TableHead>
                      <TableHead>Oxirgi kirish</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((user) => (
                      <TableRow
                        key={user.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openDetail(user)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9">
                              <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                                {getInitials(user)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{getUserDisplayName(user)}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {user.email || user.phone || "—"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={ROLE_COLORS[user.role] || "secondary"}>
                            {ROLE_LABELS[user.role] || user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(user)}</TableCell>
                        <TableCell>
                          <span className={user.isVerified ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
                            {user.isVerified ? "Ha" : "Yo&apos;q"}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(user.lastLoginAt)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem onClick={() => openDetail(user)}>
                                <Eye className="size-4 mr-2" />Ko&apos;rish
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(user)}>
                                <Pencil className="size-4 mr-2" />Tahrirlash
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openRoleChange(user)}>
                                <Shield className="size-4 mr-2" />Rolni o&apos;zgartirish
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.isBlocked ? (
                                <DropdownMenuItem onClick={() => { setSelectedUser(user); setUnblockOpen(true) }}>
                                  <CheckCircle2 className="size-4 mr-2" />Blokdan chiqarish
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => { setSelectedUser(user); setBlockOpen(true); setBlockReason(""); setActionError(null) }}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Ban className="size-4 mr-2" />Bloklash
                                </DropdownMenuItem>
                              )}
                              {user.isActive ? (
                                <DropdownMenuItem
                                  onClick={() => { setSelectedUser(user); setDeactivateOpen(true) }}
                                  className="text-orange-600 focus:text-orange-600"
                                >
                                  <XCircle className="size-4 mr-2" />Nofaol qilish
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => { setSelectedUser(user); setActivateOpen(true) }}>
                                  <CheckCircle2 className="size-4 mr-2" />Faollashtirish
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => { setSelectedUser(user); setDeleteOpen(true); setActionError(null) }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <ShieldAlert className="size-4 mr-2" />O&apos;chirish
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Jami: <span className="font-medium">{total}</span> ta foydalanuvchi
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="text-sm font-medium px-2">{page} / {totalPages || 1}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Foydalanuvchi ma&apos;lumotlari</SheetTitle>
            <SheetDescription>To&apos;liq profil ma&apos;lumotlari</SheetDescription>
          </SheetHeader>
          {detailUser && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
                    {getInitials(detailUser)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{getUserDisplayName(detailUser)}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={ROLE_COLORS[detailUser.role] || "secondary"}>
                      {ROLE_LABELS[detailUser.role] || detailUser.role}
                    </Badge>
                    {getStatusBadge(detailUser)}
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-lg border p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Aloqa</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="size-4 text-muted-foreground" />
                      <span>{detailUser.email || "Kiritilmagan"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="size-4 text-muted-foreground" />
                      <span>{detailUser.phone || "Kiritilmagan"}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Holat</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Faollik</p>
                      <p className="text-sm font-medium">{detailUser.isActive ? "Faol" : "Nofaol"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tasdiqlangan</p>
                      <p className="text-sm font-medium">{detailUser.isVerified ? "Ha" : "Yo'q"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Bloklangan</p>
                      <p className="text-sm font-medium">{detailUser.isBlocked ? "Ha" : "Yo'q"}</p>
                    </div>
                    {detailUser.isBlocked && detailUser.blockedReason && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Bloklash sababi</p>
                        <p className="text-sm font-medium text-red-600">{detailUser.blockedReason}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Vaqtlar</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Ro&apos;yxatdan o&apos;tgan:</span>
                      <span>{formatDateTime(detailUser.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Oxirgi kirish:</span>
                      <span>{formatDateTime(detailUser.lastLoginAt)}</span>
                    </div>
                    {detailUser.isBlocked && detailUser.blockedAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <Ban className="size-4 text-red-500" />
                        <span className="text-muted-foreground">Bloklangan:</span>
                        <span className="text-red-600">{formatDateTime(detailUser.blockedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => { setDetailOpen(false); openEdit(detailUser) }}>
                  <Pencil className="size-4 mr-1" />Tahrirlash
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setDetailOpen(false); openRoleChange(detailUser) }}>
                  <Shield className="size-4 mr-1" />Rolni o&apos;zgartirish
                </Button>
                {detailUser.isBlocked ? (
                  <Button variant="outline" size="sm" onClick={() => {
                    setDetailOpen(false); setSelectedUser(detailUser); setUnblockOpen(true)
                  }}>
                    <CheckCircle2 className="size-4 mr-1" />Blokdan chiqarish
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => {
                    setDetailOpen(false); setSelectedUser(detailUser); setBlockOpen(true); setBlockReason(""); setActionError(null)
                  }}>
                    <Ban className="size-4 mr-1" />Bloklash
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yangi foydalanuvchi</DialogTitle>
            <DialogDescription>Yangi foydalanuvchi yaratish</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {actionError && (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-3 text-sm text-red-600">{actionError}</div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ism</Label>
                <Input value={createForm.firstName} onChange={(e) => setCreateForm(f => ({ ...f, firstName: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Familiya</Label>
                <Input value={createForm.lastName} onChange={(e) => setCreateForm(f => ({ ...f, lastName: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={createForm.email} onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefon</Label>
              <Input placeholder="+998901234567" value={createForm.phone} onChange={(e) => setCreateForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Parol</Label>
              <Input type="password" value={createForm.password} onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Kamida 8 ta belgi</p>
            </div>
            <div className="space-y-1.5">
              <Label>Rol</Label>
              <Select value={createForm.role} onValueChange={(v) => setCreateForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MOBILE_USER">Foydalanuvchi</SelectItem>
                  <SelectItem value="ADMINISTRATOR">Administrator</SelectItem>
                  <SelectItem value="SUPERADMIN">Superadmin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleCreate} disabled={actionLoading || !createForm.password}>
              {actionLoading && <Loader2 className="size-4 mr-1 animate-spin" />}
              Yaratish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Foydalanuvchini tahrirlash</DialogTitle>
            <DialogDescription>{selectedUser ? getUserDisplayName(selectedUser) : ""}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {actionError && (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-3 text-sm text-red-600">{actionError}</div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ism</Label>
                <Input value={editForm.firstName} onChange={(e) => setEditForm(f => ({ ...f, firstName: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Familiya</Label>
                <Input value={editForm.lastName} onChange={(e) => setEditForm(f => ({ ...f, lastName: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefon</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleEdit} disabled={actionLoading}>
              {actionLoading && <Loader2 className="size-4 mr-1 animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={blockOpen} onOpenChange={setBlockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Foydalanuvchini bloklash</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{selectedUser ? getUserDisplayName(selectedUser) : ""}</strong> bloklansinnmi?
              Bloklangan foydalanuvchi tizimga kira olmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label>Sabab (ixtiyoriy)</Label>
            <Textarea
              placeholder="Bloklash sababini kiriting..."
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              rows={3}
            />
            {actionError && (
              <p className="text-sm text-red-600">{actionError}</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlock}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading && <Loader2 className="size-4 mr-1 animate-spin" />}
              Bloklash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={unblockOpen} onOpenChange={setUnblockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Blokdan chiqarish</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{selectedUser ? getUserDisplayName(selectedUser) : ""}</strong> blokdan chiqarilsinmi?
              Foydalanuvchi yana tizimga kira oladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {actionError && <p className="text-sm text-red-600 px-6">{actionError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnblock} disabled={actionLoading}>
              {actionLoading && <Loader2 className="size-4 mr-1 animate-spin" />}
              Blokdan chiqarish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={activateOpen} onOpenChange={setActivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Faollashtirish</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{selectedUser ? getUserDisplayName(selectedUser) : ""}</strong> faollashtirilsinmi?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {actionError && <p className="text-sm text-red-600 px-6">{actionError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleActivate} disabled={actionLoading}>
              {actionLoading && <Loader2 className="size-4 mr-1 animate-spin" />}
              Faollashtirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nofaol qilish</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{selectedUser ? getUserDisplayName(selectedUser) : ""}</strong> nofaol qilinsinmi?
              Foydalanuvchi tizimga kira olmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {actionError && <p className="text-sm text-red-600 px-6">{actionError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={actionLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {actionLoading && <Loader2 className="size-4 mr-1 animate-spin" />}
              Nofaol qilish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={roleChangeOpen} onOpenChange={setRoleChangeOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rolni o&apos;zgartirish</DialogTitle>
            <DialogDescription>{selectedUser ? getUserDisplayName(selectedUser) : ""}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {actionError && (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-3 text-sm text-red-600">{actionError}</div>
            )}
            <div className="space-y-1.5">
              <Label>Yangi rol</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MOBILE_USER">Foydalanuvchi</SelectItem>
                  <SelectItem value="ADMINISTRATOR">Administrator</SelectItem>
                  <SelectItem value="SUPERADMIN">Superadmin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleChangeOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleRoleChange} disabled={actionLoading || newRole === selectedUser?.role}>
              {actionLoading && <Loader2 className="size-4 mr-1 animate-spin" />}
              O&apos;zgartirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Foydalanuvchini o&apos;chirish</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{selectedUser ? getUserDisplayName(selectedUser) : ""}</strong> butunlay o&apos;chirilsinmi?
              Bu amalni qaytarib bo&apos;lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {actionError && <p className="text-sm text-red-600 px-6">{actionError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading && <Loader2 className="size-4 mr-1 animate-spin" />}
              O&apos;chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
