"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/components/auth-provider"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CreditCard, Plus, MoreHorizontal, Edit, CheckCircle, RefreshCcw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { FilterField } from "@/components/filter-bar"

interface Payment {
  id: number
  amount: number
  currency: string
  status: string
  method: string
  paymentDate: string | null
  createdAt: string
  student: { firstName: string; lastName: string; phone: string | null }
  enrollment: {
    course: { name: string } | null
    group: { name: string } | null
  } | null
}

export default function PaymentsPage() {
  const { user } = useAuth()
  const centerId = user?.administrator?.centerId

  const [data, setData] = useState<Payment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<{ status: string; method: string; dateFrom: string; dateTo: string }>({
    status: "all",
    method: "all",
    dateFrom: "",
    dateTo: "",
  })

  const [sheetOpen, setSheetOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  
  const [studentId, setStudentId] = useState("")
  const [amount, setAmount] = useState("")
  const [status, setStatus] = useState("PENDING")
  const [method, setMethod] = useState("CASH")
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    if (!centerId) return
    setLoading(true)
    try {
      const res = await apiClient<PaginatedResponse<Payment>>("/payments", {
        params: {
          centerId,
          page,
          limit: 15,
          search,
          status: filters.status === "all" ? undefined : filters.status,
          method: filters.method === "all" ? undefined : filters.method,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
        },
      })
      setData(res.data)
      setTotal(res.total)
    } catch (e: any) {
      setError(e.message)
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [centerId, page, search, filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openCreate = () => {
    setIsEditing(false)
    setEditId(null)
    setStudentId("")
    setAmount("")
    setStatus("PENDING")
    setMethod("CASH")
    setSheetOpen(true)
  }

  const openEdit = (p: Payment) => {
    setIsEditing(true)
    setEditId(p.id)
    setStudentId("") // Not editable usually
    setAmount(p.amount.toString())
    setStatus(p.status)
    setMethod(p.method)
    setSheetOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!centerId) return
    setSaving(true)
    try {
      if (isEditing && editId) {
        await apiClient(`/payments/${editId}`, {
          method: "PATCH",
          body: {
            amount: parseInt(amount),
            status,
            method,
            paymentDate: status === "PAID" ? new Date().toISOString() : undefined
          },
        })
        toast.success("To'lov yangilandi")
      } else {
        await apiClient("/payments", {
          method: "POST",
          body: {
            centerId,
            studentId: parseInt(studentId),
            amount: parseInt(amount),
            status,
            method,
            paymentDate: status === "PAID" ? new Date().toISOString() : undefined
          },
        })
        toast.success("Yangi to'lov ro'yxatga olindi")
      }
      setSheetOpen(false)
      fetchData()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await apiClient(`/payments/${id}`, {
        method: "PATCH",
        body: { 
          status: newStatus,
          paymentDate: newStatus === "PAID" ? new Date().toISOString() : undefined
        },
      })
      toast.success("Holat o'zgardi")
      fetchData()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const columns = [
    {
      key: "student",
      title: "O'quvchi",
      render: (p: Payment) => (
        <div className="flex flex-col">
          <span className="font-medium">{p.student?.firstName} {p.student?.lastName}</span>
          <span className="text-xs text-muted-foreground">{p.student?.phone || "Telefon yo'q"}</span>
        </div>
      ),
    },
    {
      key: "amount",
      title: "Summa",
      render: (p: Payment) => (
        <span className="font-semibold">
          {new Intl.NumberFormat("uz-UZ").format(p.amount)} {p.currency}
        </span>
      ),
    },
    {
      key: "method",
      title: "To'lov turi",
      render: (p: Payment) => (
        <Badge variant="outline" className="text-xs">{p.method}</Badge>
      ),
    },
    {
      key: "status",
      title: "Holat",
      render: (p: Payment) => (
        <Badge variant={p.status === "PAID" ? "default" : p.status === "FAILED" ? "destructive" : "secondary"}
               className={p.status === "PAID" ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
          {p.status}
        </Badge>
      ),
    },
    {
      key: "target",
      title: "Maqsad",
      render: (p: Payment) => (
        <span className="text-sm">
          {p.enrollment ? (
            `${p.enrollment.course?.name || ""} / ${p.enrollment.group?.name || ""}`
          ) : (
            "Umumiy (Qo'lda kiritilgan)"
          )}
        </span>
      ),
    },
    {
      key: "date",
      title: "Sana",
      render: (p: Payment) => p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("uz-UZ") : "-",
    },
    {
      key: "actions",
      title: "",
      render: (p: Payment) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {p.status !== "PAID" && (
                <DropdownMenuItem onClick={() => handleStatusChange(p.id, "PAID")} className="text-emerald-600 focus:text-emerald-600">
                  <CheckCircle className="mr-2 size-4" /> Qabul qilish (Paid)
                </DropdownMenuItem>
              )}
              {p.status === "PAID" && (
                <DropdownMenuItem onClick={() => handleStatusChange(p.id, "PENDING")} className="text-amber-600 focus:text-amber-600">
                  <RefreshCcw className="mr-2 size-4" /> Qaytarish (Pending)
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => openEdit(p)}>
                <Edit className="mr-2 size-4" /> Tahrirlash
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  if (!centerId) return <div className="p-8 text-center">Markaz topilmadi</div>

  return (
    <div className="space-y-6">
      <PageHeader
        title="To'lovlar Boshqaruvi"
        description="Markazning moliyaviy aylanmasi va o'quvchilar to'lovlari"
        icon={CreditCard}
        actions={[{ label: "Yangi to'lov", icon: Plus, onClick: openCreate }]}
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
        searchPlaceholder="To'lov qidirish..."
        onSearchChange={(q) => { setSearch(q); setPage(1) }}
        filterFields={[
          {
            id: "status",
            placeholder: "Holat",
            options: [
              { label: "PENDING", value: "PENDING" },
              { label: "PAID", value: "PAID" },
              { label: "FAILED", value: "FAILED" },
            ],
          },
          {
            id: "method",
            placeholder: "Usul",
            options: [
              { label: "CASH", value: "CASH" },
              { label: "CARD", value: "CARD" },
              { label: "TRANSFER", value: "TRANSFER" },
              { label: "CLICK", value: "CLICK" },
            ],
          },
        ] as FilterField[]}
        activeFilters={{ status: filters.status, method: filters.method }}
        onFilterChange={(id, value) => {
          if (id === "status") setFilters((p) => ({ ...p, status: value }))
          if (id === "method") setFilters((p) => ({ ...p, method: value }))
          setPage(1)
        }}
        onResetFilters={() => {
          setFilters({ status: "all", method: "all", dateFrom: "", dateTo: "" })
          setSearch("")
          setPage(1)
        }}
        filters={
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Boshlanish</div>
              <Input type="date" value={filters.dateFrom} onChange={(e) => { setFilters((p) => ({ ...p, dateFrom: e.target.value })); setPage(1) }} />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Tugash</div>
              <Input type="date" value={filters.dateTo} onChange={(e) => { setFilters((p) => ({ ...p, dateTo: e.target.value })); setPage(1) }} />
            </div>
            <div className="flex items-end justify-end" />
          </div>
        }
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{isEditing ? "To'lovni tahrirlash" : "Yangi to'lov ro'yxatdan o'tkazish"}</SheetTitle>
            <SheetDescription>O'quvchi uchun naqd yoki boshqa to'lov turini belgilang.</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSave} className="space-y-5 mt-6">
            {!isEditing && (
              <div className="space-y-2">
                <Label>O'quvchi ID</Label>
                <Input
                  type="number"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Masalan: 42"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Summa (UZS)</Label>
              <Input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Masalan: 350000"
              />
            </div>

            <div className="space-y-2">
              <Label>To'lov turi</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Naqd pul (Cash)</SelectItem>
                  <SelectItem value="CARD">Plastik Karta (Card)</SelectItem>
                  <SelectItem value="TRANSFER">O'tkazma (Transfer)</SelectItem>
                  <SelectItem value="CLICK">Click / Payme</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Holat</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Kutilmoqda (Pending)</SelectItem>
                  <SelectItem value="PAID">To'landi (Paid)</SelectItem>
                  <SelectItem value="FAILED">Xato / Bekor Qilingan (Failed)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <SheetFooter className="mt-8">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} className="flex-1">
                Bekor qilish
              </Button>
              <Button type="submit" disabled={saving} className="flex-1">
                {saving && <Loader2 className="size-4 animate-spin mr-2" />} Saqlash
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
