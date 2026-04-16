"use client"

import { useCallback, useEffect, useState } from "react"
import { Lock, Key, Eye, Server, CheckCircle2, XCircle, Loader2, Shield } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-provider"

type SecurityPolicy = {
  passwordMinLength: number
  passwordRequireUpperLowerDigit: boolean
  passwordRequireSpecial: boolean
  updatedAt: string | null
}

type SessionRow = {
  id: number
  ipAddress: string | null
  deviceInfo: string | null
  createdAt: string
  expiresAt: string
  isRevoked: boolean
}

type SecurityLog = {
  id: number
  event: string
  success: boolean
  ipAddress: string | null
  userAgent: string | null
  details: any
  createdAt: string
}

export default function SecurityPage() {
  const { user } = useAuth()
  const centerName = user?.administrator?.center?.name || "Markaz"
  const [tab, setTab] = useState("policy")

  const [policy, setPolicy] = useState<SecurityPolicy | null>(null)
  const [policyLoading, setPolicyLoading] = useState(true)

  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [sessionsTotal, setSessionsTotal] = useState(0)
  const [sessionsPage, setSessionsPage] = useState(1)
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [sessionsError, setSessionsError] = useState<string | null>(null)

  const [logs, setLogs] = useState<SecurityLog[]>([])
  const [logsTotal, setLogsTotal] = useState(0)
  const [logsPage, setLogsPage] = useState(1)
  const [logsLoading, setLogsLoading] = useState(true)
  const [logsError, setLogsError] = useState<string | null>(null)
  const [selectedLog, setSelectedLog] = useState<SecurityLog | null>(null)

  const fetchPolicy = useCallback(async () => {
    setPolicyLoading(true)
    try {
      const res = await apiClient<SecurityPolicy>("/security/policy")
      setPolicy(res)
    } finally {
      setPolicyLoading(false)
    }
  }, [])

  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true)
    setSessionsError(null)
    try {
      const res = await apiClient<PaginatedResponse<SessionRow>>("/security/sessions", {
        params: { page: sessionsPage, limit: 20, status: "all" }
      })
      setSessions(res.data)
      setSessionsTotal(res.total)
    } catch (e: any) {
      setSessionsError(e.message || "Sessiyalarni yuklab bo'lmadi")
    } finally {
      setSessionsLoading(false)
    }
  }, [sessionsPage])

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true)
    setLogsError(null)
    try {
      const res = await apiClient<PaginatedResponse<SecurityLog>>("/security/logs", {
        params: { page: logsPage, limit: 20 }
      })
      setLogs(res.data)
      setLogsTotal(res.total)
    } catch (e: any) {
      setLogsError(e.message || "Loglarni yuklab bo'lmadi")
    } finally {
      setLogsLoading(false)
    }
  }, [logsPage])

  useEffect(() => { fetchPolicy() }, [fetchPolicy])
  useEffect(() => { fetchSessions() }, [fetchSessions])
  useEffect(() => { fetchLogs() }, [fetchLogs])

  const sessionColumns = [
    { key: "createdAt", title: "Vaqt", render: (s: SessionRow) => <span className="text-sm">{new Date(s.createdAt).toLocaleString("uz-UZ")}</span> },
    { key: "ipAddress", title: "IP", render: (s: SessionRow) => <span className="font-mono text-xs text-muted-foreground">{s.ipAddress || "—"}</span> },
    { key: "deviceInfo", title: "Qurilma", render: (s: SessionRow) => <span className="text-xs text-muted-foreground line-clamp-1">{s.deviceInfo || "—"}</span> },
    { key: "expiresAt", title: "Tugash", render: (s: SessionRow) => <span className="text-sm">{new Date(s.expiresAt).toLocaleDateString("uz-UZ")}</span> },
    { key: "isRevoked", title: "Holat", render: (s: SessionRow) => (
      s.isRevoked
        ? <Badge variant="secondary" className="gap-1"><XCircle className="size-3" /> Revoked</Badge>
        : <Badge className="gap-1"><CheckCircle2 className="size-3" /> Active</Badge>
    )},
    { key: "actions", title: "", render: (s: SessionRow) => (
      <Button
        variant="outline"
        size="sm"
        disabled={s.isRevoked}
        onClick={async () => {
          try {
            await apiClient(`/security/sessions/${s.id}`, { method: "DELETE" })
            toast.success("Sessiya yopildi")
            fetchSessions()
          } catch (e: any) {
            toast.error(e.message || "Yopib bo'lmadi")
          }
        }}
      >
        Yopish
      </Button>
    )},
  ]

  const logColumns = [
    { key: "createdAt", title: "Vaqt", render: (l: SecurityLog) => <span className="text-sm">{new Date(l.createdAt).toLocaleString("uz-UZ")}</span> },
    { key: "event", title: "Event", render: (l: SecurityLog) => <span className="font-mono text-xs">{l.event}</span> },
    { key: "success", title: "Natija", render: (l: SecurityLog) => (
      l.success
        ? <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-200">OK</Badge>
        : <Badge className="bg-red-500/10 text-red-600 border border-red-200">FAIL</Badge>
    )},
    { key: "ipAddress", title: "IP", render: (l: SecurityLog) => <span className="font-mono text-xs text-muted-foreground">{l.ipAddress || "—"}</span> },
    { key: "userAgent", title: "Device", render: (l: SecurityLog) => <span className="text-xs text-muted-foreground line-clamp-1">{l.userAgent || "—"}</span> },
    { key: "details", title: "Tafsilot", render: (l: SecurityLog) => (
      <Button
        variant="ghost"
        size="sm"
        className="text-xs"
        onClick={async () => {
          const full = await apiClient<SecurityLog>(`/security/logs/${l.id}`)
          setSelectedLog(full)
        }}
      >
        Ko'rish
      </Button>
    )},
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Xavfsizlik"
        subtitle={`${centerName} uchun login tarix, sessiyalar va xavfsizlik loglari`}
        icon={Lock}
        badge="Real backend"
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="policy" className="gap-2"><Key className="size-4" /> Parol siyosati</TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2"><Eye className="size-4" /> Sessiyalar</TabsTrigger>
          <TabsTrigger value="logs" className="gap-2"><Shield className="size-4" /> Xavfsizlik loglari</TabsTrigger>
        </TabsList>

        <TabsContent value="policy" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Parol siyosati</CardTitle>
              <CardDescription>Parol tekshiruvi backend policy bo‘yicha ishlaydi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {policyLoading || !policy ? (
                <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Yuklanmoqda...</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase text-muted-foreground">Minimal uzunlik</div>
                    <Input type="number" value={policy.passwordMinLength} disabled />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border p-4">
                    <div>
                      <div className="font-medium">Upper/Lower/Digit</div>
                      <div className="text-xs text-muted-foreground">Katta+kichik harf va raqam</div>
                    </div>
                    <Switch checked={policy.passwordRequireUpperLowerDigit} disabled />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border p-4">
                    <div>
                      <div className="font-medium">Special char</div>
                      <div className="text-xs text-muted-foreground">Maxsus belgi</div>
                    </div>
                    <Switch checked={policy.passwordRequireSpecial} disabled />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Login tarix / Sessiyalar</CardTitle>
                <CardDescription>IP, qurilma, vaqt (real DB)</CardDescription>
              </div>
              <Button
                variant="destructive"
                className="gap-2"
                onClick={async () => {
                  try {
                    await apiClient("/security/sessions/logout-all", { method: "POST", body: {} })
                    toast.success("Barcha sessiyalar yopildi")
                    fetchSessions()
                  } catch (e: any) {
                    toast.error(e.message || "Bajarilmadi")
                  }
                }}
              >
                <Server className="size-4" /> Logout all
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={sessionColumns as any}
                data={sessions}
                total={sessionsTotal}
                page={sessionsPage}
                limit={20}
                loading={sessionsLoading}
                error={sessionsError}
                onPageChange={setSessionsPage}
                searchPlaceholder="Sessiya qidirish..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Xavfsizlik loglari</CardTitle>
              <CardDescription>Login/refresh/logout hodisalari</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={logColumns as any}
                data={logs}
                total={logsTotal}
                page={logsPage}
                limit={20}
                loading={logsLoading}
                error={logsError}
                onPageChange={setLogsPage}
                searchPlaceholder="Log qidirish..."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedLog} onOpenChange={(o) => !o && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Xavfsizlik log tafsiloti</DialogTitle>
            <DialogDescription>ID: #{selectedLog?.id}</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <pre className="flex-1 overflow-auto p-4 rounded-lg bg-slate-950 text-slate-200 text-xs whitespace-pre-wrap">
              {JSON.stringify(selectedLog.details, null, 2)}
            </pre>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
