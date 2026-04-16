"use client"

import { useCallback, useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Layers, Loader2, Users, UserCog } from "lucide-react"

interface TariffPlan {
  id: number
  tier: string
  name: string
  description: string | null
  maxUsers: number | null
  maxPsychologists: number | null
  featureFlags: Record<string, boolean> | null
  sortOrder: number
  isActive: boolean
}

interface CenterPayload {
  id: number
  name: string
  subscriptionPlan: string | null
  centerTariffPlanId: number | null
  centerTariffPlan: TariffPlan | null
}

interface MyCenterResponse {
  center: CenterPayload
  availableTariffs: TariffPlan[]
}

export default function CenterTariffPage() {
  const [data, setData] = useState<MyCenterResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient<MyCenterResponse>("/monetization/my-center")
      setData(res)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Yuklashda xatolik")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <PageHeader title="Tarif va limitlar" description="Markaz rejangiz" icon={Layers} />
        <p className="text-sm text-destructive">{error || "Ma'lumot yo'q"}</p>
      </div>
    )
  }

  const current = data.center.centerTariffPlan

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tarif va limitlar"
        description={`${data.center.name} — joriy obuna rejasi va imkoniyatlar`}
        icon={Layers}
      />

      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Building2 className="size-5 text-primary" />
                Joriy tarif
              </CardTitle>
              <CardDescription>
                Tarifni faqat superadmin o‘zgartiradi. Bu yerda cheklovlar va nom ko‘rinadi.
              </CardDescription>
            </div>
            {current && (
              <Badge variant="default" className="shrink-0">
                {current.tier}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {current ? (
            <>
              <div>
                <p className="text-lg font-semibold">{current.name}</p>
                {current.description && (
                  <p className="text-sm text-muted-foreground mt-1">{current.description}</p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
                  <Users className="size-8 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Max. foydalanuvchilar</p>
                    <p className="text-2xl font-semibold tabular-nums">{current.maxUsers ?? "Cheksiz"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
                  <UserCog className="size-8 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Max. psixologlar</p>
                    <p className="text-2xl font-semibold tabular-nums">{current.maxPsychologists ?? "Cheksiz"}</p>
                  </div>
                </div>
              </div>
              {current.featureFlags && Object.keys(current.featureFlags).length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Qo‘shimcha funksiyalar</p>
                  <ul className="flex flex-wrap gap-2">
                    {Object.entries(current.featureFlags).map(([k, v]) =>
                      v ? (
                        <Badge key={k} variant="secondary">
                          {k}
                        </Badge>
                      ) : null
                    )}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Markazga hali tarif biriktirilmagan. Superadmin bilan bog‘laning.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mavjud tariflar (ma’lumot)</CardTitle>
          <CardDescription>Platformadagi boshqa tariflar — tanlash huquqi superadminda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.availableTariffs.map((t) => (
              <div
                key={t.id}
                className={`rounded-lg border p-4 ${current?.id === t.id ? "ring-2 ring-primary/40 bg-primary/5" : ""}`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-semibold">{t.name}</span>
                  <Badge variant="outline">{t.tier}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Foydalanuvchi: {t.maxUsers ?? "—"} · Psixolog: {t.maxPsychologists ?? "—"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
