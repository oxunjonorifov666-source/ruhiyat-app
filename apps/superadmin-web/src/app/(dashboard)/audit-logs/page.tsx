"use client"

import { useEffect, useState, useCallback } from "react"
import { ScrollText, Search, Filter, Download, User as UserIcon, Activity, Globe, Monitor } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  action: string
  resource: string
  resourceId: string | null
  details: any
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user?: {
    firstName: string | null
    lastName: string | null
    email: string | null
  }
}

export default function AuditLogsPage() {
  const [data, setData] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [action, setAction] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient<any>("/audit-logs", {
        params: {
          page,
          limit: 20,
          search,
          action: action === "all" ? undefined : action,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        }
      })
      setData(res.data || [])
      setTotal(res.total || 0)
    } catch (e: any) {
      setError(e.message || "Loglarni yuklashda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }, [page, search, action, dateFrom, dateTo])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE": return "bg-emerald-500/10 text-emerald-600 border-emerald-200"
      case "UPDATE": return "bg-blue-500/10 text-blue-600 border-blue-200"
      case "DELETE": return "bg-red-500/10 text-red-600 border-red-200"
      default: return "bg-muted text-muted-foreground"
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
      )
    },
    { 
      key: "user", 
      title: "Foydalanuvchi", 
      render: (log: AuditLog) => (
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-muted flex items-center justify-center">
            <UserIcon className="size-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {log.user ? `${log.user.firstName || ""} ${log.user.lastName || ""}` : "Tizim"}
            </span>
            <span className="text-[11px] text-muted-foreground">{log.user?.email || "System/Bot"}</span>
          </div>
        </div>
      )
    },
    { 
      key: "action", 
      title: "Amal", 
      render: (log: AuditLog) => (
        <Badge variant="outline" className={getActionColor(log.action)}>
          {log.action}
        </Badge>
      )
    },
    { 
      key: "resource", 
      title: "Resurs", 
      render: (log: AuditLog) => (
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-mono bg-muted/50 px-1.5 py-0.5 rounded border capitalize">{log.resource}</span>
          {log.resourceId && <span className="text-[11px] text-muted-foreground font-mono">ID: {log.resourceId}</span>}
        </div>
      )
    },
    {
      key: "details",
      title: "Tafsilotlar",
      render: (log: AuditLog) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            try {
              const full = await apiClient<AuditLog>(`/audit-logs/${log.id}`)
              setSelectedLog(full)
            } catch (e: any) {
              setError(e.message || "Log tafsilotlarini yuklab bo'lmadi")
            }
          }}
          className="text-xs"
        >
          Ko'rish
        </Button>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit loglari"
        description="Tizimda bajarilgan barcha amallar va o'zgarishlar tarixi"
        icon={ScrollText}
        actions={[
          { label: "Eksport", icon: Download, variant: "outline" },
          { label: "Yangilash", icon: Activity, variant: "outline", onClick: fetchLogs },
        ]}
      />

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Qidirish (user, action, resource)..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
            <Select value={action} onValueChange={(v) => { setAction(v); setPage(1) }}>
              <SelectTrigger><SelectValue placeholder="Amal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="CREATE">CREATE</SelectItem>
                <SelectItem value="UPDATE">UPDATE</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} />
              <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} />
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
            onPageChange={setPage}
            searchPlaceholder="Loglardan qidirish..."
          />
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Log tafsilotlari</DialogTitle>
            <DialogDescription>
              Amal ID: #{selectedLog?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="flex-1 overflow-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                    <Globe className="size-3" /> IP Manzil
                  </div>
                  <span className="font-mono text-sm">{selectedLog.ipAddress || "Mavjud emas"}</span>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                    <Monitor className="size-3" /> User Agent
                  </div>
                  <span className="text-[11px] font-mono break-all line-clamp-2" title={selectedLog.userAgent || ""}>
                    {selectedLog.userAgent || "Mavjud emas"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">O'zgarishlar (Request Body)</h4>
                <div className="p-4 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 overflow-auto whitespace-pre">
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