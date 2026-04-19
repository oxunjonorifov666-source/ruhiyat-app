"use client"

import { useEffect, useState, useCallback } from "react"
import { Activity, Loader2 } from "lucide-react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import type { FilterField } from "@/components/filter-bar"
import { SuperadminRouteGate } from "@/components/superadmin-route-gate"
import {
  classifyApiError,
  describeEmbeddedApiError,
  formatEmbeddedApiError,
  type EmbeddedApiErrorDescription,
} from "@/lib/api-error"
import { EmbeddedApiErrorBanner } from "@/components/embedded-api-error-banner"
import { AccessDeniedPlaceholder } from "@/components/access-denied-placeholder"

interface AuditLog {
  id: number
  action: string
  resource: string
  resourceId: string | null
  details: unknown
  ipAddress: string | null
  createdAt: string
  user: { id: number; email: string | null; firstName: string | null; lastName: string | null } | null
  center?: { name: string } | null
}

const actionLabels: Record<string, string> = {
  CREATE: "Yaratish", UPDATE: "Yangilash", DELETE: "O'chirish",
  LOGIN: "Kirish", LOGOUT: "Chiqish", BLOCK: "Bloklash", UNBLOCK: "Blokdan chiqarish",
}

const actionColors: Record<string, string> = {
  CREATE: "default", UPDATE: "secondary", DELETE: "destructive",
  LOGIN: "default", LOGOUT: "secondary",
}

function AuditLogsPageContent() {
  const [data, setData] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<{ action: string; userId: string; dateFrom: string; dateTo: string }>({
    action: "all",
    userId: "",
    dateFrom: "",
    dateTo: "",
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [logDialogOpen, setLogDialogOpen] = useState(false)
  const [logDetailLoading, setLogDetailLoading] = useState(false)
  const [logDetailError, setLogDetailError] = useState<EmbeddedApiErrorDescription | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    setPermissionDenied(false)
    try {
      const res = await apiClient<any>("/audit-logs", {
        params: {
          page,
          limit: 20,
          search,
          action: filters.action === "all" ? undefined : filters.action,
          userId: filters.userId || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
        },
      })
      setData(res.data)
      setTotal(res.total)
    } catch (e: unknown) {
      const { permissionDenied: denied } = classifyApiError(e)
      if (denied) setPermissionDenied(true)
      else setError(formatEmbeddedApiError(e))
    }
    finally { setLoading(false) }
  }, [page, search, filters])

  useEffect(() => { fetchData() }, [fetchData])

  const filterFields: FilterField[] = [
    {
      id: "action",
      placeholder: "Amal",
      options: [
        { label: "CREATE", value: "CREATE" },
        { label: "UPDATE", value: "UPDATE" },
        { label: "DELETE", value: "DELETE" },
      ],
    },
  ]

  function formatDetails(d: unknown): string {
    if (d == null) return "—"
    if (typeof d === "string") return d
    try {
      return JSON.stringify(d, null, 2)
    } catch {
      return String(d)
    }
  }

  const columns = [
    {
      key: "center",
      title: "Markaz",
      render: (log: AuditLog) => (
        <span className="text-sm text-muted-foreground">{log.center?.name || "—"}</span>
      ),
    },
    {
      key: "user", title: "Foydalanuvchi",
      render: (log: AuditLog) => (
        <div>
          <span className="font-medium">
            {log.user?.firstName ? `${log.user.firstName} ${log.user.lastName || ""}` : log.user?.email || "Tizim"}
          </span>
          {log.user?.email && <div className="text-xs text-muted-foreground">{log.user.email}</div>}
        </div>
      ),
    },
    { key: "action", title: "Amal", render: (log: AuditLog) => (
      <Badge variant={(actionColors[log.action] as any) || "outline"}>
        {actionLabels[log.action] || log.action}
      </Badge>
    )},
    { key: "resource", title: "Resurs", render: (log: AuditLog) => (
      <div>
        <span className="text-sm">{log.resource}</span>
        {log.resourceId && <span className="text-xs text-muted-foreground ml-1">#{log.resourceId}</span>}
      </div>
    )},
    { key: "details", title: "Tafsilotlar", render: (log: AuditLog) => (
      <Button
        variant="ghost"
        size="sm"
        className="text-xs"
        onClick={async () => {
          setLogDetailError(null)
          setSelectedLog(null)
          setLogDetailLoading(true)
          setLogDialogOpen(true)
          try {
            const full = await apiClient<AuditLog>(`/audit-logs/${log.id}`)
            setSelectedLog(full)
          } catch (e: unknown) {
            setLogDetailError(describeEmbeddedApiError(e))
          } finally {
            setLogDetailLoading(false)
          }
        }}
      >
        Ko'rish
      </Button>
    )},
    { key: "ipAddress", title: "IP", render: (log: AuditLog) => (
      <span className="text-xs font-mono text-muted-foreground">{log.ipAddress || "—"}</span>
    )},
    { key: "createdAt", title: "Vaqt", render: (log: AuditLog) => (
      <span className="text-sm">{new Date(log.createdAt).toLocaleString("uz-UZ")}</span>
    )},
  ]

  if (permissionDenied) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Faollik jurnali"
          description="Tizimdagi amallar va o'zgarishlar — real vaqt rejimida bazadan"
          icon={Activity}
        />
        <AccessDeniedPlaceholder
          title="Audit jurnaliga ruxsat yo'q"
          description="Audit loglar odatda faqat superadmin yoki xavfsizlik rollari uchun."
          detail={error}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faollik jurnali"
        description="Tizimdagi amallar va o'zgarishlar — real vaqt rejimida bazadan"
        icon={Activity}
      />

      <DataTable
        title="O'zgarishlar tarixi" description="Barcha amallar qayd etiladi"
        columns={columns} data={data} total={total} page={page} limit={20}
        loading={loading} error={error} searchPlaceholder="Log qidirish..."
        onPageChange={setPage}
        onSearchChange={(q) => { setSearch(q); setPage(1) }}
        filterFields={filterFields}
        activeFilters={{ action: filters.action }}
        onFilterChange={(id, value) => {
          if (id === "action") setFilters((p) => ({ ...p, action: value }));
          setPage(1);
        }}
        onResetFilters={() => {
          setFilters({ action: "all", userId: "", dateFrom: "", dateTo: "" });
          setSearch("");
          setPage(1);
        }}
        filters={
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-1">
              <Input
                placeholder="User ID"
                value={filters.userId}
                onChange={(e) => { setFilters((p) => ({ ...p, userId: e.target.value.replace(/[^\d]/g, "") })); setPage(1) }}
              />
            </div>
            <div className="md:col-span-1">
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => { setFilters((p) => ({ ...p, dateFrom: e.target.value })); setPage(1) }}
              />
            </div>
            <div className="md:col-span-1">
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => { setFilters((p) => ({ ...p, dateTo: e.target.value })); setPage(1) }}
              />
            </div>
            <div className="md:col-span-1 flex items-center justify-end">
              <Button variant="outline" size="sm" onClick={fetchData}>Yangilash</Button>
            </div>
          </div>
        }
      />

      <Dialog
        open={logDialogOpen}
        onOpenChange={(open) => {
          setLogDialogOpen(open)
          if (!open) {
            setSelectedLog(null)
            setLogDetailError(null)
            setLogDetailLoading(false)
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Log tafsilotlari</DialogTitle>
            <DialogDescription>
              {selectedLog ? `Amal ID: #${selectedLog.id}` : "Yuklanmoqda yoki xato"}
            </DialogDescription>
          </DialogHeader>
          {logDetailLoading ? (
            <div className="flex flex-1 items-center justify-center py-12" role="status" aria-live="polite">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : logDetailError ? (
            <EmbeddedApiErrorBanner error={logDetailError} className="flex-1" />
          ) : selectedLog ? (
            <div className="flex-1 overflow-auto space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-1">IP</div>
                  <div className="font-mono text-sm">{selectedLog.ipAddress || "—"}</div>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-1">Vaqt</div>
                  <div className="text-sm">{new Date(selectedLog.createdAt).toLocaleString("uz-UZ")}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase text-muted-foreground">Tafsilotlar</div>
                <pre className="p-4 rounded-lg bg-slate-950 text-slate-200 text-xs overflow-auto whitespace-pre-wrap">
                  {formatDetails(selectedLog.details)}
                </pre>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AuditLogsPage() {
  return (
    <SuperadminRouteGate title="Faollik jurnali">
      <AuditLogsPageContent />
    </SuperadminRouteGate>
  )
}
