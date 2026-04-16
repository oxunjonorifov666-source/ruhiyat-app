"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Blocks,
  Loader2,
  CheckCircle2,
  XCircle,
  Settings2,
  CreditCard,
  MessageSquare,
  Video,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { StatsGrid, StatsCard } from "@/components/stats-card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import Link from "next/link"

interface IntegrationRow {
  id: number
  name: string
  provider: string
  config: Record<string, unknown> | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

interface IntegrationsApiResponse {
  data: IntegrationRow[]
  total: number
}

function providerIcon(provider: string) {
  const p = provider.toLowerCase()
  if (p.includes("pay") || p.includes("click") || p.includes("stripe")) return CreditCard
  if (p.includes("sms") || p.includes("eskiz") || p.includes("telegram") || p.includes("bot")) return MessageSquare
  if (p.includes("zoom") || p.includes("meet") || p.includes("video")) return Video
  if (p.includes("auth") || p.includes("oauth")) return ShieldCheck
  return Blocks
}

const catalog = [
  { name: "Payme", region: "O'zbekiston", desc: "Mobil va kartalar orqali to'lov", icon: CreditCard, tone: "from-violet-500/15 to-fuchsia-500/10" },
  { name: "Click", region: "O'zbekiston", desc: "Internet banking integratsiyasi", icon: CreditCard, tone: "from-sky-500/15 to-blue-500/10" },
  { name: "Eskiz SMS", region: "SMS", desc: "OTP va bildirishnomalar", icon: MessageSquare, tone: "from-emerald-500/15 to-teal-500/10" },
  { name: "Zoom / Meet", region: "Video", desc: "Video seanslar va uchrashuvlar", icon: Video, tone: "from-amber-500/15 to-orange-500/10" },
] as const

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true)
  const [integrations, setIntegrations] = useState<IntegrationRow[]>([])
  const [total, setTotal] = useState(0)
  const [detail, setDetail] = useState<IntegrationRow | null>(null)

  const fetchIntegrations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient<IntegrationsApiResponse>("/integrations")
      setIntegrations(res.data ?? [])
      setTotal(res.total ?? 0)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Yuklashda xatolik"
      toast.error(msg)
      setIntegrations([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchIntegrations()
  }, [fetchIntegrations])

  const toggleIntegration = async (id: number, isActive: boolean) => {
    try {
      await apiClient(`/integrations/${id}`, {
        method: "PATCH",
        body: { isActive },
      })
      toast.success(isActive ? "Integratsiya yoqildi" : "Integratsiya o'chirildi")
      fetchIntegrations()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Saqlanmadi")
    }
  }

  const activeCount = integrations.filter((i) => i.isActive).length

  return (
    <div className="space-y-8">
      <PageHeader
        title="Integratsiyalar"
        description="Tashqi xizmatlar va provayderlar bilan ulanish — bazadagi yozuvlar bo'yicha"
        icon={Blocks}
        badge="Live"
        badgeVariant="secondary"
        actions={[
          {
            label: "Yangilash",
            icon: RefreshCw,
            variant: "outline",
            onClick: fetchIntegrations,
          },
          {
            element: (
              <Button variant="outline" size="sm" asChild>
                <Link href="/api-keys" className="gap-1.5">
                  <ExternalLink className="size-3.5" />
                  API kalitlar
                </Link>
              </Button>
            ),
          },
        ]}
      />

      {loading && integrations.length === 0 ? (
        <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed bg-muted/20">
          <Loader2 className="size-9 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <StatsGrid columns={3}>
            <StatsCard
              title="Jami ulanishlar"
              value={total}
              icon={Blocks}
              iconColor="bg-primary/10 text-primary"
            />
            <StatsCard
              title="Faol"
              value={activeCount}
              icon={CheckCircle2}
              iconColor="bg-emerald-500/10 text-emerald-600"
            />
            <StatsCard
              title="Kutish rejimida"
              value={Math.max(0, total - activeCount)}
              icon={XCircle}
              iconColor="bg-muted text-muted-foreground"
            />
          </StatsGrid>

          {integrations.length === 0 ? (
            <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-muted/40 via-background to-background shadow-sm">
              <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="size-8" />
                </div>
                <div className="max-w-md space-y-2">
                  <h3 className="text-lg font-semibold tracking-tight">Hozircha bazada integratsiya yozuvi yo'q</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Yangi ulanishlar `integration_settings` jadvaliga qo'shilganda shu yerda ko'rinadi. Tashqi API uchun{" "}
                    <Link href="/api-keys" className="font-medium text-primary underline-offset-4 hover:underline">
                      API kalitlar
                    </Link>{" "}
                    bo'limidan foydalaning.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {integrations.map((integration) => {
                const Icon = providerIcon(integration.provider)
                return (
                  <Card
                    key={integration.id}
                    className="group relative overflow-hidden border-border/60 bg-card/80 shadow-sm transition-all hover:border-primary/25 hover:shadow-md"
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/50 via-primary/20 to-transparent opacity-80" />
                    <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                      <div className="flex items-start gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/10">
                          <Icon className="size-5" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <CardTitle className="text-base font-semibold leading-tight">{integration.name}</CardTitle>
                          <CardDescription className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                            {integration.provider}
                          </CardDescription>
                        </div>
                      </div>
                      <Switch
                        checked={integration.isActive}
                        onCheckedChange={(checked) => toggleIntegration(integration.id, checked)}
                        aria-label="Faollik"
                      />
                    </CardHeader>
                    <CardContent className="space-y-4 pt-0">
                      <div className="flex items-center justify-between gap-2">
                        {integration.isActive ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                            <CheckCircle2 className="size-3.5" /> Faol
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <XCircle className="size-3.5" /> O'chirilgan
                          </span>
                        )}
                        <Badge variant="secondary" className="text-[10px]">
                          ID {integration.id}
                        </Badge>
                      </div>
                      {integration.updatedAt && (
                        <p className="text-[11px] text-muted-foreground">
                          Yangilangan: {new Date(integration.updatedAt).toLocaleString("uz-UZ")}
                        </p>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => setDetail(integration)}
                      >
                        <Settings2 className="size-3.5" />
                        Tafsilotlar
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold tracking-tight text-foreground">Tavsiya etilgan yo'nalishlar</h3>
              <span className="text-[11px] text-muted-foreground">Reja bo'yicha ulash</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {catalog.map((item) => (
                <Card
                  key={item.name}
                  className={`border-border/50 bg-gradient-to-br ${item.tone} transition-transform hover:-translate-y-0.5`}
                >
                  <CardContent className="flex flex-col gap-3 p-5">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-background/80 shadow-sm ring-1 ring-border/50">
                      <item.icon className="size-5 text-foreground/80" />
                    </div>
                    <div>
                      <p className="font-semibold leading-none">{item.name}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{item.region}</p>
                    </div>
                    <p className="text-xs leading-snug text-muted-foreground">{item.desc}</p>
                    <Badge variant="outline" className="w-fit text-[10px]">
                      Rejalashtirilgan
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{detail?.name}</SheetTitle>
            <SheetDescription>Provayder: {detail?.provider}</SheetDescription>
          </SheetHeader>
          {detail && (
            <div className="mt-6 space-y-4 text-sm">
              <div className="flex gap-2">
                <Badge variant={detail.isActive ? "default" : "secondary"}>{detail.isActive ? "Faol" : "O'chirilgan"}</Badge>
                <Badge variant="outline">#{detail.id}</Badge>
              </div>
              <Separator />
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Config (JSON)</p>
                <pre className="max-h-64 overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-[11px] leading-relaxed">
                  {JSON.stringify(detail.config ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
