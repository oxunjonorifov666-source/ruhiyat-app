"use client"

import { useEffect, useState, useCallback } from "react"
import { ScrollText, User, Shield, Clock } from "lucide-react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"

interface AuditLog {
  id: number
  action: string
  resource: string
  resourceId: string | null
  details: string | null
  ipAddress: string | null
  createdAt: string
  user: { id: number; email: string | null; firstName: string | null; lastName: string | null } | null
}

const actionLabels: Record<string, string> = {
  CREATE: "Yaratish", UPDATE: "Yangilash", DELETE: "O'chirish",
  LOGIN: "Kirish", LOGOUT: "Chiqish", BLOCK: "Bloklash", UNBLOCK: "Blokdan chiqarish",
}

const actionColors: Record<string, string> = {
  CREATE: "default", UPDATE: "secondary", DELETE: "destructive",
  LOGIN: "default", LOGOUT: "secondary",
}

export default function AuditLogsPage() {
  const [data, setData] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await apiClient<PaginatedResponse<AuditLog>>("/audit-logs", {
        params: { page, limit: 20, search },
      })
      setData(res.data); setTotal(res.total)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { fetchData() }, [fetchData])

  const columns = [
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
      <span className="text-sm text-muted-foreground line-clamp-1">{log.details || "—"}</span>
    )},
    { key: "ipAddress", title: "IP", render: (log: AuditLog) => (
      <span className="text-xs font-mono text-muted-foreground">{log.ipAddress || "—"}</span>
    )},
    { key: "createdAt", title: "Vaqt", render: (log: AuditLog) => (
      <span className="text-sm">{new Date(log.createdAt).toLocaleString("uz-UZ")}</span>
    )},
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Audit loglari" subtitle="Tizimdagi barcha o'zgarishlar jurnali" icon={ScrollText} />

      <DataTable
        title="O'zgarishlar tarixi" description="Barcha amallar qayd etiladi"
        columns={columns} data={data} total={total} page={page} limit={20}
        loading={loading} error={error} searchPlaceholder="Log qidirish..."
        onPageChange={setPage} onSearch={setSearch}
      />
    </div>
  )
}
