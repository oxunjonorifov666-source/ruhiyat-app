"use client"

import { useEffect, useState, useCallback } from "react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { StatsGrid, StatsCard } from "@/components/stats-card"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeftRight, ArrowDownRight, ArrowUpRight, Clock, Download, Filter, X, Eye } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

interface Transaction {
  id: number
  paymentId: number | null
  userId: number
  psychologistId: number | null
  administratorId: number | null
  type: string
  status: string
  amount: number
  currency: string
  method: string | null
  description: string | null
  referenceId: string | null
  createdAt: string
  user: { id: number; email: string | null; firstName: string | null; lastName: string | null }
}

const typeLabels: Record<string, string> = {
  PAYMENT: "To'lov",
  REFUND: "Qaytarish",
  COMMISSION: "Komissiya",
  SUBSCRIPTION: "Obuna",
  PAYOUT: "Chiqim",
}

const typeColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PAYMENT: "default",
  REFUND: "destructive",
  COMMISSION: "secondary",
  SUBSCRIPTION: "outline",
  PAYOUT: "secondary",
}

const statusLabels: Record<string, string> = {
  PENDING: "Kutilmoqda",
  COMPLETED: "Bajarildi",
  FAILED: "Xatolik",
  CANCELLED: "Bekor qilindi",
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  COMPLETED: "default",
  FAILED: "destructive",
  CANCELLED: "secondary",
}

const methodLabels: Record<string, string> = {
  CARD: "Karta",
  CLICK: "Click",
  PAYME: "Payme",
  CASH: "Naqd",
  TRANSFER: "O'tkazma",
}

function formatMoney(amount: number, currency = "UZS") {
  return `${amount.toLocaleString("uz-UZ")} ${currency}`
}

function exportCSV(data: Transaction[]) {
  const headers = ["ID", "Foydalanuvchi", "Tur", "Holat", "Summa", "Valyuta", "Usul", "Tavsif", "Sana"]
  const rows = data.map(t => [
    t.id,
    t.user?.firstName ? `${t.user.firstName} ${t.user.lastName || ""}` : t.user?.email || "",
    typeLabels[t.type] || t.type,
    statusLabels[t.status] || t.status,
    t.amount,
    t.currency,
    t.method ? methodLabels[t.method] || t.method : "",
    t.description || "",
    new Date(t.createdAt).toLocaleDateString("uz-UZ"),
  ])
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n")
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = `tranzaksiyalar_${new Date().toISOString().split("T")[0]}.csv`
  link.click()
}

export default function TransactionsPage() {
  const [data, setData] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [selected, setSelected] = useState<Transaction | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const [filterType, setFilterType] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterMethod, setFilterMethod] = useState("")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string | number | undefined> = { page, limit: 20 }
      if (search) params.search = search
      if (filterType) params.type = filterType
      if (filterStatus) params.status = filterStatus
      if (filterMethod) params.method = filterMethod
      if (filterDateFrom) params.dateFrom = filterDateFrom
      if (filterDateTo) params.dateTo = filterDateTo
      const res = await apiClient<PaginatedResponse<Transaction>>("/transactions", { params })
      setData(res.data)
      setTotal(res.total)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, search, filterType, filterStatus, filterMethod, filterDateFrom, filterDateTo])

  const fetchStats = useCallback(async () => {
    try {
      const s = await apiClient<any>("/finance/stats")
      setStats(s)
    } catch {}
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchStats() }, [fetchStats])

  const clearFilters = () => {
    setFilterType("")
    setFilterStatus("")
    setFilterMethod("")
    setFilterDateFrom("")
    setFilterDateTo("")
    setPage(1)
  }

  const hasFilters = filterType || filterStatus || filterMethod || filterDateFrom || filterDateTo

  const columns = [
    {
      key: "user",
      title: "Foydalanuvchi",
      render: (t: Transaction) =>
        t.user?.firstName ? `${t.user.firstName} ${t.user.lastName || ""}` : t.user?.email || `#${t.user?.id}`,
    },
    {
      key: "type",
      title: "Tur",
      render: (t: Transaction) => <Badge variant={typeColors[t.type] || "secondary"}>{typeLabels[t.type] || t.type}</Badge>,
    },
    {
      key: "status",
      title: "Holat",
      render: (t: Transaction) => <Badge variant={statusColors[t.status] || "secondary"}>{statusLabels[t.status] || t.status}</Badge>,
    },
    {
      key: "amount",
      title: "Summa",
      render: (t: Transaction) => <span className="font-medium">{formatMoney(t.amount, t.currency)}</span>,
    },
    {
      key: "method",
      title: "Usul",
      render: (t: Transaction) => t.method ? <Badge variant="outline">{methodLabels[t.method] || t.method}</Badge> : <span className="text-muted-foreground">—</span>,
    },
    {
      key: "createdAt",
      title: "Sana",
      render: (t: Transaction) => new Date(t.createdAt).toLocaleDateString("uz-UZ"),
    },
    {
      key: "actions",
      title: "",
      render: (t: Transaction) => (
        <Button variant="ghost" size="sm" onClick={() => { setSelected(t); setSheetOpen(true) }}>
          <Eye className="size-4" />
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tranzaksiyalar"
        description="Barcha moliyaviy tranzaksiyalar"
        icon={ArrowLeftRight}
        actions={[
          { label: "CSV yuklash", icon: Download, variant: "outline", onClick: () => exportCSV(data) },
          { label: showFilters ? "Filtrni yopish" : "Filtr", icon: showFilters ? X : Filter, variant: "outline", onClick: () => setShowFilters(!showFilters) },
        ]}
      />

      {stats && (
        <StatsGrid columns={4}>
          <StatsCard title="Jami tranzaksiyalar" value={stats.totalTransactions} icon={ArrowLeftRight} iconColor="bg-blue-500/10 text-blue-600" />
          <StatsCard title="Umumiy daromad" value={formatMoney(stats.totalRevenue)} icon={ArrowUpRight} iconColor="bg-emerald-500/10 text-emerald-600" />
          <StatsCard title="Oylik daromad" value={formatMoney(stats.monthlyRevenue)} icon={ArrowDownRight} iconColor="bg-violet-500/10 text-violet-600" />
          <StatsCard title="Muvaffaqiyatli" value={stats.completedPayments} icon={Clock} iconColor="bg-amber-500/10 text-amber-600" />
        </StatsGrid>
      )}

      {stats && stats.totalTransactions > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Muvaffaqiyatli", value: stats.completedPayments },
                      { name: "Xatolik", value: stats.failedPayments },
                      { name: "Qaytarilgan", value: stats.refundedPayments },
                    ].filter((d: any) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {["hsl(142, 76%, 36%)", "hsl(0, 84%, 60%)", "hsl(38, 92%, 50%)"].map((color, i) => (
                      <Cell key={i} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [value, name]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Tur</label>
                <Select value={filterType} onValueChange={(v) => { setFilterType(v === "all" ? "" : v); setPage(1) }}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Barchasi" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Holat</label>
                <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v === "all" ? "" : v); setPage(1) }}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Barchasi" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Usul</label>
                <Select value={filterMethod} onValueChange={(v) => { setFilterMethod(v === "all" ? "" : v); setPage(1) }}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Barchasi" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    {Object.entries(methodLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Boshlanish</label>
                <Input type="date" value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1) }} className="w-[150px]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Tugash</label>
                <Input type="date" value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); setPage(1) }} className="w-[150px]" />
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="size-4 mr-1" /> Tozalash
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable
        title=""
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={20}
        loading={loading}
        error={error}
        searchPlaceholder="Tranzaksiya qidirish..."
        onPageChange={setPage}
        onSearch={(s) => { setSearch(s); setPage(1) }}
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Tranzaksiya tafsilotlari</SheetTitle>
            <SheetDescription>Tranzaksiya #{selected?.id} haqida ma'lumot</SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="space-y-6 mt-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Asosiy ma'lumot</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-muted-foreground">ID</p><p className="font-medium">#{selected.id}</p></div>
                  <div><p className="text-xs text-muted-foreground">Tur</p><Badge variant={typeColors[selected.type] || "secondary"}>{typeLabels[selected.type] || selected.type}</Badge></div>
                  <div><p className="text-xs text-muted-foreground">Holat</p><Badge variant={statusColors[selected.status] || "secondary"}>{statusLabels[selected.status] || selected.status}</Badge></div>
                  <div><p className="text-xs text-muted-foreground">Summa</p><p className="font-medium text-lg">{formatMoney(selected.amount, selected.currency)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Usul</p><p className="font-medium">{selected.method ? (methodLabels[selected.method] || selected.method) : "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Reference</p><p className="font-medium text-xs break-all">{selected.referenceId || "—"}</p></div>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Foydalanuvchi</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-muted-foreground">Ism</p><p className="font-medium">{selected.user?.firstName || "—"} {selected.user?.lastName || ""}</p></div>
                  <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{selected.user?.email || "—"}</p></div>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Qo'shimcha</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-muted-foreground">To'lov ID</p><p className="font-medium">{selected.paymentId || "—"}</p></div>
                  <div className="col-span-2"><p className="text-xs text-muted-foreground">Tavsif</p><p className="font-medium">{selected.description || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Sana</p><p className="font-medium">{new Date(selected.createdAt).toLocaleString("uz-UZ")}</p></div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
