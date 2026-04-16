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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CreditCard, DollarSign, CheckCircle, XCircle, RotateCcw, Download, Filter, X, Eye } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

interface Payment {
  id: number
  userId: number
  psychologistId: number | null
  sessionId: number | null
  amount: number
  currency: string
  status: string
  method: string
  kind?: string
  platformFeePercent?: number | null
  platformFeeAmount?: number | null
  netAmount?: number | null
  provider: string | null
  providerPaymentId: string | null
  description: string | null
  metadata: string | null
  createdAt: string
  updatedAt: string
  user: { id: number; email: string | null; firstName: string | null; lastName: string | null; phone: string | null }
  transactions?: any[]
}

interface FinanceStats {
  totalPayments: number
  completedPayments: number
  failedPayments: number
  refundedPayments: number
  totalRevenue: number
  monthlyRevenue: number
}

const statusLabels: Record<string, string> = {
  PENDING: "Kutilmoqda",
  COMPLETED: "Muvaffaqiyatli",
  FAILED: "Xatolik",
  REFUNDED: "Qaytarilgan",
  CANCELLED: "Bekor qilingan",
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  COMPLETED: "default",
  FAILED: "destructive",
  REFUNDED: "secondary",
  CANCELLED: "secondary",
}

const methodLabels: Record<string, string> = {
  CARD: "Karta",
  CLICK: "Click",
  PAYME: "Payme",
  CASH: "Naqd",
  TRANSFER: "O'tkazma",
}

const kindLabels: Record<string, string> = {
  SESSION: "Seans",
  MOBILE_PREMIUM: "Mobil Premium",
  CENTER_SUBSCRIPTION: "Markaz obunasi",
  OTHER: "Boshqa",
}

function formatMoney(amount: number, currency = "UZS") {
  return `${amount.toLocaleString("uz-UZ")} ${currency}`
}

function exportCSV(data: Payment[]) {
  const headers = ["ID", "Foydalanuvchi", "Summa", "Valyuta", "Turi", "Komissiya", "Sof tushum", "Holat", "Usul", "Tavsif", "Sana"]
  const rows = data.map(p => [
    p.id,
    p.user?.firstName ? `${p.user.firstName} ${p.user.lastName || ""}` : p.user?.email || "",
    p.amount,
    p.currency,
    kindLabels[p.kind || ""] || p.kind || "",
    p.platformFeeAmount ?? "",
    p.netAmount ?? "",
    statusLabels[p.status] || p.status,
    methodLabels[p.method] || p.method,
    p.description || "",
    new Date(p.createdAt).toLocaleDateString("uz-UZ"),
  ])
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n")
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = `tolovlar_${new Date().toISOString().split("T")[0]}.csv`
  link.click()
}

export default function PaymentsPage() {
  const [data, setData] = useState<Payment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<FinanceStats | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetLoading, setSheetLoading] = useState(false)

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
      if (filterStatus) params.status = filterStatus
      if (filterMethod) params.method = filterMethod
      if (filterDateFrom) params.dateFrom = filterDateFrom
      if (filterDateTo) params.dateTo = filterDateTo
      const res = await apiClient<PaginatedResponse<Payment>>("/payments", { params })
      setData(res.data)
      setTotal(res.total)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, search, filterStatus, filterMethod, filterDateFrom, filterDateTo])

  const fetchStats = useCallback(async () => {
    try {
      const s = await apiClient<FinanceStats>("/finance/stats")
      setStats(s)
    } catch {}
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchStats() }, [fetchStats])

  const openDetail = async (payment: Payment) => {
    setSheetOpen(true)
    setSheetLoading(true)
    try {
      const detail = await apiClient<Payment>(`/payments/${payment.id}`)
      setSelectedPayment(detail)
    } catch {
      setSelectedPayment(payment)
    } finally {
      setSheetLoading(false)
    }
  }

  const clearFilters = () => {
    setFilterStatus("")
    setFilterMethod("")
    setFilterDateFrom("")
    setFilterDateTo("")
    setPage(1)
  }

  const hasFilters = filterStatus || filterMethod || filterDateFrom || filterDateTo

  const columns = [
    {
      key: "user",
      title: "Foydalanuvchi",
      render: (p: Payment) =>
        p.user?.firstName ? `${p.user.firstName} ${p.user.lastName || ""}` : p.user?.email || `#${p.user?.id}`,
    },
    {
      key: "amount",
      title: "Summa",
      render: (p: Payment) => <span className="font-medium">{formatMoney(p.amount, p.currency)}</span>,
    },
    {
      key: "kind",
      title: "Turi",
      render: (p: Payment) => (
        <Badge variant="outline" className="font-normal">
          {kindLabels[p.kind || ""] || p.kind || "—"}
        </Badge>
      ),
    },
    {
      key: "platformFeeAmount",
      title: "Komissiya",
      render: (p: Payment) =>
        p.platformFeeAmount != null && p.platformFeeAmount > 0 ? (
          <span className="text-sm tabular-nums text-emerald-700 dark:text-emerald-400">
            {formatMoney(p.platformFeeAmount, p.currency)}
            {p.platformFeePercent != null ? (
              <span className="text-muted-foreground ml-1">({p.platformFeePercent}%)</span>
            ) : null}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      key: "netAmount",
      title: "Sof",
      render: (p: Payment) =>
        p.netAmount != null ? (
          <span className="text-sm tabular-nums">{formatMoney(p.netAmount, p.currency)}</span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      key: "method",
      title: "Usul",
      render: (p: Payment) => <Badge variant="outline">{methodLabels[p.method] || p.method}</Badge>,
    },
    {
      key: "status",
      title: "Holat",
      render: (p: Payment) => (
        <Badge variant={statusColors[p.status] || "secondary"}>
          {statusLabels[p.status] || p.status}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      title: "Sana",
      render: (p: Payment) => new Date(p.createdAt).toLocaleDateString("uz-UZ"),
    },
    {
      key: "actions",
      title: "",
      render: (p: Payment) => (
        <Button variant="ghost" size="sm" onClick={() => openDetail(p)}>
          <Eye className="size-4" />
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="To'lovlar"
        description="Barcha to'lovlarni boshqarish va kuzatish"
        icon={CreditCard}
        actions={[
          { label: "CSV yuklash", icon: Download, variant: "outline", onClick: () => exportCSV(data) },
          { label: showFilters ? "Filtrni yopish" : "Filtr", icon: showFilters ? X : Filter, variant: "outline", onClick: () => setShowFilters(!showFilters) },
        ]}
      />

      {stats && (
        <StatsGrid columns={4}>
          <StatsCard title="Jami to'lovlar" value={stats.totalPayments} icon={CreditCard} iconColor="bg-blue-500/10 text-blue-600" />
          <StatsCard title="Muvaffaqiyatli" value={stats.completedPayments} icon={CheckCircle} iconColor="bg-emerald-500/10 text-emerald-600" />
          <StatsCard title="Xatoliklar" value={stats.failedPayments} icon={XCircle} iconColor="bg-red-500/10 text-red-600" />
          <StatsCard title="Qaytarilgan" value={stats.refundedPayments} icon={RotateCcw} iconColor="bg-amber-500/10 text-amber-600" />
        </StatsGrid>
      )}

      {stats && (stats.completedPayments > 0 || stats.failedPayments > 0 || stats.refundedPayments > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">To'lov holatlari taqsimoti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Muvaffaqiyatli", value: stats.completedPayments },
                      { name: "Xatolik", value: stats.failedPayments },
                      { name: "Qaytarilgan", value: stats.refundedPayments },
                      { name: "Kutilmoqda", value: Math.max(0, stats.totalPayments - stats.completedPayments - stats.failedPayments - stats.refundedPayments) },
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {[
                      "hsl(142, 76%, 36%)",
                      "hsl(0, 84%, 60%)",
                      "hsl(38, 92%, 50%)",
                      "hsl(221, 83%, 53%)",
                    ].map((color, i) => (
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
                <label className="text-xs font-medium text-muted-foreground">Holat</label>
                <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v === "all" ? "" : v); setPage(1) }}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Barchasi" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">To'lov usuli</label>
                <Select value={filterMethod} onValueChange={(v) => { setFilterMethod(v === "all" ? "" : v); setPage(1) }}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Barchasi" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    {Object.entries(methodLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Boshlanish sanasi</label>
                <Input type="date" value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1) }} className="w-[160px]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Tugash sanasi</label>
                <Input type="date" value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); setPage(1) }} className="w-[160px]" />
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
        searchPlaceholder="To'lov qidirish..."
        onPageChange={setPage}
        onSearch={(s) => { setSearch(s); setPage(1) }}
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>To'lov tafsilotlari</SheetTitle>
            <SheetDescription>To'lov #{selectedPayment?.id} haqida ma'lumot</SheetDescription>
          </SheetHeader>
          {sheetLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full size-8 border-b-2 border-primary" />
            </div>
          ) : selectedPayment && (
            <div className="space-y-6 mt-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Asosiy ma'lumot</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-muted-foreground">ID</p><p className="font-medium">#{selectedPayment.id}</p></div>
                  <div><p className="text-xs text-muted-foreground">Holat</p><Badge variant={statusColors[selectedPayment.status] || "secondary"}>{statusLabels[selectedPayment.status] || selectedPayment.status}</Badge></div>
                  <div><p className="text-xs text-muted-foreground">Summa</p><p className="font-medium text-lg">{formatMoney(selectedPayment.amount, selectedPayment.currency)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Usul</p><p className="font-medium">{methodLabels[selectedPayment.method] || selectedPayment.method}</p></div>
                  <div><p className="text-xs text-muted-foreground">To‘lov turi</p><p className="font-medium">{kindLabels[selectedPayment.kind || ""] || selectedPayment.kind || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Platforma komissiyasi</p><p className="font-medium">{selectedPayment.platformFeeAmount != null ? formatMoney(selectedPayment.platformFeeAmount, selectedPayment.currency) : "—"}{selectedPayment.platformFeePercent != null ? ` (${selectedPayment.platformFeePercent}%)` : ""}</p></div>
                  <div className="col-span-2"><p className="text-xs text-muted-foreground">Sof tushum (markaz / qabul qiluvchi)</p><p className="font-medium">{selectedPayment.netAmount != null ? formatMoney(selectedPayment.netAmount, selectedPayment.currency) : "—"}</p></div>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Foydalanuvchi</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-muted-foreground">Ism</p><p className="font-medium">{selectedPayment.user?.firstName || "—"} {selectedPayment.user?.lastName || ""}</p></div>
                  <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{selectedPayment.user?.email || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Telefon</p><p className="font-medium">{selectedPayment.user?.phone || "—"}</p></div>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Qo'shimcha</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-muted-foreground">Provayder</p><p className="font-medium">{selectedPayment.provider || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Provayder ID</p><p className="font-medium text-xs break-all">{selectedPayment.providerPaymentId || "—"}</p></div>
                  <div className="col-span-2"><p className="text-xs text-muted-foreground">Tavsif</p><p className="font-medium">{selectedPayment.description || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Yaratilgan</p><p className="font-medium">{new Date(selectedPayment.createdAt).toLocaleString("uz-UZ")}</p></div>
                  <div><p className="text-xs text-muted-foreground">Yangilangan</p><p className="font-medium">{new Date(selectedPayment.updatedAt).toLocaleString("uz-UZ")}</p></div>
                </div>
              </div>
              {selectedPayment.transactions && selectedPayment.transactions.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tranzaksiyalar ({selectedPayment.transactions.length})</h3>
                    <div className="space-y-2">
                      {selectedPayment.transactions.map((t: any) => (
                        <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="text-sm font-medium">{t.type}</p>
                            <p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString("uz-UZ")}</p>
                          </div>
                          <p className="font-medium">{formatMoney(t.amount, t.currency)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
