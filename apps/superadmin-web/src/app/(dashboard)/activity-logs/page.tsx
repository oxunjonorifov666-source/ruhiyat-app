"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Activity,
  Download,
  User as UserIcon,
  Globe,
  Monitor,
  Building2,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AuditLog {
  id: number
  userId: number | null
  centerId?: number | null
  action: string
  resource: string
  resourceId: string | null
  details: unknown
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user?: {
    firstName: string | null
    lastName: string | null
    email: string | null
    role?: string | null
  }
  center?: { name: string } | null
}

function getActionColor(action: string) {
  switch (action) {
    case "CREATE":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-200"
    case "UPDATE":
      return "bg-blue-500/10 text-blue-600 border-blue-200"
    case "DELETE":
      return "bg-red-500/10 text-red-600 border-red-200"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function exportAuditCsv(rows: AuditLog[]) {
  const headers = ["ID", "Sana", "Markaz", "Foydalanuvchi", "Email", "Amal", "Resurs", "Resource ID"]
  const lines = rows.map((log) => [
    log.id,
    new Date(log.createdAt).toISOString(),
    log.center?.name ?? "",
    log.user ? `${log.user.firstName || ""} ${log.user.lastName || ""}`.trim() || "Tizim" : "Tizim",
    log.user?.email ?? "",
    log.action,
    log.resource,
    log.resourceId ?? "",
  ])
  const csv = [headers, ...lines].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = `faollik_jurnali_${new Date().toISOString().split("T")[0]}.csv`
  link.click()
}

export default function ActivityLogsPage() {
  const [data, setData] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [action, setAction] = useState<string>("all")
  const [resource, setResource] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient<PaginatedResponse<AuditLog>>("/audit-logs", {
        params: {
          page,
          limit: 20,
          search: search || undefined,
          action: action === "all" ? undefined : action,
          resource: resource.trim() || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        },
      })
      setData(res.data || [])
      setTotal(res.total || 0)
    } catch (e: any) {
      setError(e.message || "Loglarni yuklashda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }, [page, search, action, resource, dateFrom, dateTo])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const openDetails = async (log: AuditLog) => {
    try {
      const full = await apiClient<AuditLog>(`/audit-logs/${log.id}`)
      setSelectedLog(full)
    } catch (e: any) {
      setError(e.message || "Log tafsilotlarini yuklab bo'lmadi")
    }
  }

  const columns = [
    {
      key: "createdAt",
      title: "Sana va vaqt",
      render: (log: AuditLog) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{new Date(log.createdAt).toLocaleDateString("uz-UZ")}</span>
          <span className="text-[11px] text-muted-foreground">{new Date(log.createdAt).toLocaleTimeString("uz-UZ")}</span>
        </div>
      ),
    },
    {
      key: "center",
      title: "Markaz",
      render: (log: AuditLog) => (
        <div className="flex max-w-[160px] items-center gap-2">
          <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm" title={log.center?.name}>
            {log.center?.name || "—"}
          </span>
        </div>
      ),
    },
    {
      key: "user",
      title: "Foydalanuvchi",
      render: (log: AuditLog) => (
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-muted">
            <UserIcon className="size-4 text-muted-foreground" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">
              {log.user ? `${log.user.firstName || ""} ${log.user.lastName || ""}`.trim() || "—" : "Tizim"}
            </span>
            <span className="truncate text-[11px] text-muted-foreground">{log.user?.email || "—"}</span>
          </div>
        </div>
      ),
    },
    {
      key: "action",
      title: "Amal",
      render: (log: AuditLog) => (
        <Badge variant="outline" className={getActionColor(log.action)}>
          {log.action}
        </Badge>
      ),
    },
    {
      key: "resource",
      title: "Resurs",
      render: (log: AuditLog) => (
        <div className="flex flex-col gap-0.5">
          <span className="rounded border bg-muted/50 px-1.5 py-0.5 font-mono text-xs capitalize">{log.resource}</span>
          {log.resourceId && <span className="font-mono text-[11px] text-muted-foreground">ID: {log.resourceId}</span>}
        </div>
      ),
    },
    {
      key: "details",
      title: "",
      render: (log: AuditLog) => (
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => openDetails(log)}>
          Ko'rish
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faollik jurnali"
        description="Audit yozuvlari — tizimdagi amallar va o'zgarishlar (PostgreSQL audit jurnali)"
        icon={Activity}
        actions={[
          {
            label: "Eksport (joriy sahifa)",
            icon: Download,
            variant: "outline",
            onClick: () => exportAuditCsv(data),
          },
          {
            label: "Yangilash",
            icon: RefreshCw,
            variant: "outline",
            onClick: fetchLogs,
          },
        ]}
      />

      <Card className="overflow-hidden border-border/60 shadow-sm">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Amal turi</label>
              <Select
                value={action}
                onValueChange={(v) => {
                  setAction(v)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Amal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="CREATE">CREATE</SelectItem>
                  <SelectItem value="UPDATE">UPDATE</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="lg:col-span-3">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Resurs (masalan, User)</label>
              <Input
                placeholder="resource"
                value={resource}
                onChange={(e) => {
                  setResource(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <div className="lg:col-span-3">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Dan</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <div className="lg:col-span-3">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Gacha</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setPage(1)
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data}
            total={total}
            page={page}
            limit={20}
            loading={loading}
            error={error}
            search={search}
            onSearchChange={(v) => {
              setSearch(v)
              setPage(1)
            }}
            onPageChange={setPage}
            searchPlaceholder="Foydalanuvchi, resurs yoki amal bo'yicha qidirish..."
          />
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col">
          <DialogHeader>
            <DialogTitle>Faollik yozuvi #{selectedLog?.id}</DialogTitle>
            <DialogDescription>Audit log — to'liq tafsilotlar</DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="min-h-0 flex-1 space-y-5 overflow-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Building2 className="size-3" /> Markaz
                  </div>
                  <span className="text-sm font-medium">{selectedLog.center?.name || "—"}</span>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="mb-1 text-xs font-medium text-muted-foreground">Vaqt</div>
                  <span className="text-sm">{new Date(selectedLog.createdAt).toLocaleString("uz-UZ")}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Globe className="size-3" /> IP manzil
                  </div>
                  <span className="font-mono text-sm">{selectedLog.ipAddress || "Mavjud emas"}</span>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Monitor className="size-3" /> User-Agent
                  </div>
                  <span className="line-clamp-3 break-all font-mono text-[11px]" title={selectedLog.userAgent || ""}>
                    {selectedLog.userAgent || "Mavjud emas"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">So'rov / tafsilotlar (JSON)</h4>
                <div className="max-h-48 overflow-auto rounded-lg bg-slate-950 p-4 font-mono text-xs text-slate-300 whitespace-pre">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
