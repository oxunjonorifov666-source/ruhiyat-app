"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  Shield,
  Key,
  Globe,
  Users,
  Activity,
  ArrowRight,
  Lock,
  Plug,
  ScrollText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { StatsGrid, StatsCard } from "@/components/stats-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"

type SecurityLog = {
  id: number
  event: string
  success: boolean
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

type SecurityPolicy = {
  passwordMinLength: number
  passwordRequireUpperLowerDigit: boolean
  passwordRequireSpecial: boolean
}

type IntegrationRow = { id: number; isActive: boolean }

const shortcuts = [
  {
    title: "Kirish nazorati",
    desc: "Sessiyalar, API kalitlar, IP ro'yxati",
    href: "/access-control",
    icon: Users,
    accent: "from-violet-500/20 to-purple-500/5",
  },
  {
    title: "Integratsiyalar",
    desc: "Tashqi provayderlar holati",
    href: "/integrations",
    icon: Plug,
    accent: "from-sky-500/20 to-blue-500/5",
  },
  {
    title: "Xavfsizlik",
    desc: "Parol siyosati va loglar",
    href: "/security",
    icon: Lock,
    accent: "from-amber-500/20 to-orange-500/5",
  },
  {
    title: "Audit loglari",
    desc: "Tizim bo'yicha audit yozuvlari",
    href: "/audit-logs",
    icon: ScrollText,
    accent: "from-emerald-500/20 to-teal-500/5",
  },
] as const

export default function SystemAccessPage() {
  const [loading, setLoading] = useState(true)
  const [policy, setPolicy] = useState<SecurityPolicy | null>(null)
  const [ipRestricted, setIpRestricted] = useState(false)
  const [metrics, setMetrics] = useState({
    integrationsActive: 0,
    integrationsTotal: 0,
    apiKeys: 0,
    sessions: 0,
  })
  const [logs, setLogs] = useState<SecurityLog[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [intRes, keysRes, sessRes, pol, settingsRes, logsRes] = await Promise.all([
        apiClient<{ data: IntegrationRow[]; total: number }>("/integrations").catch(() => ({ data: [], total: 0 })),
        apiClient<PaginatedResponse<{ id: number }>>("/api-keys", { params: { page: 1, limit: 1 } }).catch(() => ({
          data: [],
          total: 0,
        })),
        apiClient<PaginatedResponse<{ id: number }>>("/auth-sessions", { params: { page: 1, limit: 1 } }).catch(() => ({
          data: [],
          total: 0,
        })),
        apiClient<SecurityPolicy>("/security/policy").catch(() => null),
        apiClient<{ data: { key: string; value: string | null }[] }>("/settings").catch(() => ({ data: [] })),
        apiClient<PaginatedResponse<SecurityLog>>("/security/logs", { params: { page: 1, limit: 6 } }).catch(() => ({
          data: [],
          total: 0,
        })),
      ])

      const list = intRes.data ?? []
      const active = list.filter((x) => x.isActive).length
      setMetrics({
        integrationsActive: active,
        integrationsTotal: intRes.total ?? list.length,
        apiKeys: keysRes.total ?? 0,
        sessions: sessRes.total ?? 0,
      })
      setPolicy(pol)

      const ipRow = settingsRes.data?.find((s) => s.key === "access_control.allowed_ips")
      const raw = (ipRow?.value || "").trim()
      setIpRestricted(raw.length > 0)

      setLogs(logsRes.data ?? [])
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ma'lumot yuklanmadi")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-8">
      <PageHeader
        title="Access nazorati"
        description="Kirish, integratsiyalar va xavfsizlik bo'yicha markaziy ko'rinish — barcha ma'lumotlar API orqali"
        icon={Shield}
        badge="Superadmin"
        badgeVariant="outline"
        actions={[
          {
            label: "Yangilash",
            icon: Activity,
            variant: "outline",
            onClick: load,
          },
        ]}
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed bg-muted/20">
          <Loader2 className="size-9 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <StatsGrid columns={4}>
            <StatsCard
              title="Faol integratsiyalar"
              value={metrics.integrationsActive}
              icon={Plug}
              iconColor="bg-sky-500/10 text-sky-600"
              trend={
                metrics.integrationsTotal > 0
                  ? { value: metrics.integrationsTotal, label: "jami" }
                  : undefined
              }
            />
            <StatsCard
              title="API kalitlar"
              value={metrics.apiKeys}
              icon={Key}
              iconColor="bg-violet-500/10 text-violet-600"
            />
            <StatsCard
              title="Faol sessiyalar (yozuvlar)"
              value={metrics.sessions}
              icon={Users}
              iconColor="bg-emerald-500/10 text-emerald-600"
            />
            <StatsCard
              title="Parol min. uzunlik"
              value={policy?.passwordMinLength ?? "—"}
              icon={Lock}
              iconColor="bg-amber-500/10 text-amber-700"
            />
          </StatsGrid>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border-border/60 lg:col-span-2 overflow-hidden shadow-sm">
              <CardHeader className="border-b bg-muted/20 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">So'nggi xavfsizlik hodisalari</CardTitle>
                    <CardDescription>Login, sessiya va siyosat bilan bog'liq loglar</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/security">Barchasi</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {logs.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">Hodisalar hozircha yo'q</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[160px]">Vaqt</TableHead>
                        <TableHead>Voqea</TableHead>
                        <TableHead className="w-[90px]">Natija</TableHead>
                        <TableHead className="hidden md:table-cell">IP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((l) => (
                        <TableRow key={l.id} className="group">
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                            {new Date(l.createdAt).toLocaleString("uz-UZ")}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{l.event}</TableCell>
                          <TableCell>
                            {l.success ? (
                              <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15">OK</Badge>
                            ) : (
                              <Badge variant="destructive" className="font-normal">
                                Xato
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                            {l.ipAddress || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Tarmoq holati</CardTitle>
                <CardDescription>IP cheklovlari (white-list)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className={`flex items-start gap-3 rounded-xl border p-4 ${
                    ipRestricted ? "border-amber-200 bg-amber-500/5" : "border-emerald-200 bg-emerald-500/5"
                  }`}
                >
                  {ipRestricted ? (
                    <>
                      <AlertTriangle className="size-5 shrink-0 text-amber-600" />
                      <div className="space-y-1 text-sm">
                        <p className="font-medium text-amber-900 dark:text-amber-100">Cheklangan rejim</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Faqat ro'yxatdagi IP manzillardan kirish ruxsat etilgan. Batafsil: Kirish nazorati → IP.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                      <div className="space-y-1 text-sm">
                        <p className="font-medium">Standart kirish</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          IP ro'yxati bo'sh — barcha manzillardan kirish mumkin (boshqa siyosatlar amal qiladi).
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <Button className="w-full gap-2" variant="secondary" asChild>
                  <Link href="/access-control">
                    IP va sessiyalarni boshqarish
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-tight">Tezkor bo'limlar</h3>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {shortcuts.map((s) => (
                <Link key={s.href} href={s.href} className="group block">
                  <Card
                    className={`h-full overflow-hidden border-border/60 bg-gradient-to-br ${s.accent} transition-all hover:border-primary/30 hover:shadow-md`}
                  >
                    <CardContent className="flex h-full flex-col gap-3 p-5">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-background/90 shadow-sm ring-1 ring-border/40">
                        <s.icon className="size-5 text-foreground/85" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-semibold leading-tight group-hover:text-primary">{s.title}</p>
                        <p className="text-xs text-muted-foreground leading-snug">{s.desc}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                        Ochish
                        <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
