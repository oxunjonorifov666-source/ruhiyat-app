"use client"

import { useCallback, useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Wallet,
  Percent,
  Building2,
  Smartphone,
  Loader2,
  Save,
  TrendingUp,
  Landmark,
} from "lucide-react"
import { toast } from "sonner"

interface Overview {
  defaultCommissionPercent: number
  totalCompletedPayments: number
  totalGrossRevenue: number
  totalPlatformFees: number
  activeMobileSubscriptions: number
  educationCenters: number
}

interface PlatformSettings {
  id: number
  defaultCommissionPercent: number
  updatedAt: string
}

interface CenterTariffPlan {
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

interface ConsumerPlan {
  id: number
  code: string
  name: string
  description: string | null
  monthlyPriceUzs: number
  featurePsychChat: boolean
  featureVideoConsultation: boolean
  featureCourses: boolean
  featurePremiumContent: boolean
  sortOrder: number
  isActive: boolean
}

function formatUzs(n: number) {
  return `${n.toLocaleString("uz-UZ")} UZS`
}

export default function MonetizationPage() {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [platform, setPlatform] = useState<PlatformSettings | null>(null)
  const [commissionInput, setCommissionInput] = useState("")
  const [savingCommission, setSavingCommission] = useState(false)

  const [centerPlans, setCenterPlans] = useState<CenterTariffPlan[]>([])
  const [editingCenter, setEditingCenter] = useState<CenterTariffPlan | null>(null)
  const [savingCenter, setSavingCenter] = useState(false)

  const [consumerPlans, setConsumerPlans] = useState<ConsumerPlan[]>([])
  const [editingConsumer, setEditingConsumer] = useState<ConsumerPlan | null>(null)
  const [savingConsumer, setSavingConsumer] = useState(false)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [ov, plat, ct, cp] = await Promise.all([
        apiClient<Overview>("/monetization/superadmin/overview"),
        apiClient<PlatformSettings>("/monetization/platform-settings"),
        apiClient<CenterTariffPlan[]>("/monetization/center-tariffs"),
        apiClient<ConsumerPlan[]>("/monetization/consumer-plans"),
      ])
      setOverview(ov)
      setPlatform(plat)
      setCommissionInput(String(plat.defaultCommissionPercent))
      setCenterPlans(ct)
      setConsumerPlans(cp)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Yuklashda xatolik")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const saveCommission = async () => {
    const n = Math.round(Number(commissionInput))
    if (Number.isNaN(n) || n < 0 || n > 100) {
      toast.error("Komissiya 0–100 orasida bo‘lishi kerak")
      return
    }
    setSavingCommission(true)
    try {
      const p = await apiClient<PlatformSettings>("/monetization/platform-settings", {
        method: "PATCH",
        body: { defaultCommissionPercent: n },
      })
      setPlatform(p)
      toast.success("Platforma komissiyasi saqlandi")
      loadAll()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Xatolik")
    } finally {
      setSavingCommission(false)
    }
  }

  const saveCenterTariff = async () => {
    if (!editingCenter) return
    setSavingCenter(true)
    try {
      await apiClient("/monetization/center-tariffs", {
        method: "PUT",
        body: {
          tier: editingCenter.tier,
          name: editingCenter.name,
          description: editingCenter.description || undefined,
          maxUsers: editingCenter.maxUsers,
          maxPsychologists: editingCenter.maxPsychologists,
          featureFlags: editingCenter.featureFlags ?? undefined,
          sortOrder: editingCenter.sortOrder,
          isActive: editingCenter.isActive,
        },
      })
      toast.success("Markaz tarifi yangilandi")
      setEditingCenter(null)
      const ct = await apiClient<CenterTariffPlan[]>("/monetization/center-tariffs")
      setCenterPlans(ct)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Xatolik")
    } finally {
      setSavingCenter(false)
    }
  }

  const saveConsumerPlan = async () => {
    if (!editingConsumer) return
    setSavingConsumer(true)
    try {
      await apiClient("/monetization/consumer-plans", {
        method: "PUT",
        body: {
          code: editingConsumer.code,
          name: editingConsumer.name,
          description: editingConsumer.description || undefined,
          monthlyPriceUzs: editingConsumer.monthlyPriceUzs,
          featurePsychChat: editingConsumer.featurePsychChat,
          featureVideoConsultation: editingConsumer.featureVideoConsultation,
          featureCourses: editingConsumer.featureCourses,
          featurePremiumContent: editingConsumer.featurePremiumContent,
          sortOrder: editingConsumer.sortOrder,
          isActive: editingConsumer.isActive,
        },
      })
      toast.success("Mobil reja saqlandi")
      setEditingConsumer(null)
      const cp = await apiClient<ConsumerPlan[]>("/monetization/consumer-plans")
      setConsumerPlans(cp)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Xatolik")
    } finally {
      setSavingConsumer(false)
    }
  }

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monetizatsiya"
        description="Komissiya, markaz va mobil tariflar, moliyaviy ko‘rsatkichlar"
        icon={Wallet}
      />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Ko‘rsatkichlar</TabsTrigger>
          <TabsTrigger value="commission">Platforma komissiyasi</TabsTrigger>
          <TabsTrigger value="centers">Markaz tariflari</TabsTrigger>
          <TabsTrigger value="mobile">Mobil rejalar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {overview && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Percent className="size-4" /> Joriy komissiya
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold tabular-nums">{overview.defaultCommissionPercent}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="size-4" /> Yakunlangan to‘lovlar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold tabular-nums">{overview.totalCompletedPayments}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Landmark className="size-4" /> Umumiy tushum (gross)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-semibold tabular-nums">{formatUzs(overview.totalGrossRevenue)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Platforma komissiyasi (jami)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {formatUzs(overview.totalPlatformFees)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Smartphone className="size-4" /> Faol mobil obunalar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold tabular-nums">{overview.activeMobileSubscriptions}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Building2 className="size-4" /> Ta‘lim markazlari
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold tabular-nums">{overview.educationCenters}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="commission" className="space-y-4 mt-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Standart komissiya foizi</CardTitle>
              <CardDescription>
                Yangi yakunlangan to‘lovlarga qo‘llaniladi (0–100). O‘zgarishlar faqat keyingi operatsiyalarga ta‘sir qiladi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {platform && (
                <p className="text-xs text-muted-foreground">
                  Oxirgi yangilanish: {new Date(platform.updatedAt).toLocaleString("uz-UZ")}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="commission">Foiz (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  min={0}
                  max={100}
                  value={commissionInput}
                  onChange={(e) => setCommissionInput(e.target.value)}
                />
              </div>
              <Button onClick={saveCommission} disabled={savingCommission}>
                {savingCommission ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4 mr-2" />}
                Saqlash
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="centers" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic, Pro, Premium</CardTitle>
              <CardDescription>Har bir tarif uchun foydalanuvchi/psixolog limitlari va funksiyalar (JSON)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead>Nomi</TableHead>
                    <TableHead>Max o‘quvchi</TableHead>
                    <TableHead>Max psixolog</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {centerPlans.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Badge variant="outline">{p.tier}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.maxUsers ?? "—"}</TableCell>
                      <TableCell>{p.maxPsychologists ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={p.isActive ? "default" : "secondary"}>
                          {p.isActive ? "Faol" : "O‘chirilgan"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setEditingCenter({ ...p })}>
                          Tahrirlash
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {editingCenter && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle>Tarif: {editingCenter.tier}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-w-lg">
                <div className="space-y-2">
                  <Label>Nomi</Label>
                  <Input
                    value={editingCenter.name}
                    onChange={(e) => setEditingCenter({ ...editingCenter, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tavsif</Label>
                  <Textarea
                    value={editingCenter.description ?? ""}
                    onChange={(e) => setEditingCenter({ ...editingCenter, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Max foydalanuvchilar</Label>
                    <Input
                      type="number"
                      value={editingCenter.maxUsers ?? ""}
                      onChange={(e) =>
                        setEditingCenter({
                          ...editingCenter,
                          maxUsers: e.target.value === "" ? null : parseInt(e.target.value, 10),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max psixologlar</Label>
                    <Input
                      type="number"
                      value={editingCenter.maxPsychologists ?? ""}
                      onChange={(e) =>
                        setEditingCenter({
                          ...editingCenter,
                          maxPsychologists: e.target.value === "" ? null : parseInt(e.target.value, 10),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tartib</Label>
                  <Input
                    type="number"
                    value={editingCenter.sortOrder}
                    onChange={(e) =>
                      setEditingCenter({ ...editingCenter, sortOrder: parseInt(e.target.value, 10) || 0 })
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingCenter.isActive}
                    onCheckedChange={(v) => setEditingCenter({ ...editingCenter, isActive: v })}
                  />
                  <Label>Faol</Label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveCenterTariff} disabled={savingCenter}>
                    {savingCenter ? <Loader2 className="size-4 animate-spin" /> : null}
                    Saqlash
                  </Button>
                  <Button variant="ghost" onClick={() => setEditingCenter(null)}>
                    Bekor qilish
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="mobile" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Freemium / Premium</CardTitle>
              <CardDescription>Mobil ilova funksiyalari va oylik narx</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kod</TableHead>
                    <TableHead>Nomi</TableHead>
                    <TableHead>Oylik</TableHead>
                    <TableHead>Chat</TableHead>
                    <TableHead>Video</TableHead>
                    <TableHead>Kurslar</TableHead>
                    <TableHead>Kontent</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consumerPlans.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Badge variant="secondary">{p.code}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{formatUzs(p.monthlyPriceUzs)}</TableCell>
                      <TableCell>{p.featurePsychChat ? "✓" : "—"}</TableCell>
                      <TableCell>{p.featureVideoConsultation ? "✓" : "—"}</TableCell>
                      <TableCell>{p.featureCourses ? "✓" : "—"}</TableCell>
                      <TableCell>{p.featurePremiumContent ? "✓" : "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setEditingConsumer({ ...p })}>
                          Tahrirlash
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {editingConsumer && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle>Reja: {editingConsumer.code}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-w-lg">
                <div className="space-y-2">
                  <Label>Nomi</Label>
                  <Input
                    value={editingConsumer.name}
                    onChange={(e) => setEditingConsumer({ ...editingConsumer, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Oylik narx (UZS)</Label>
                  <Input
                    type="number"
                    value={editingConsumer.monthlyPriceUzs}
                    onChange={(e) =>
                      setEditingConsumer({
                        ...editingConsumer,
                        monthlyPriceUzs: parseInt(e.target.value, 10) || 0,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      ["featurePsychChat", "Psixolog chat"],
                      ["featureVideoConsultation", "Video konsultatsiya"],
                      ["featureCourses", "Kurslar"],
                      ["featurePremiumContent", "Maxsus kontent"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                      <Label className="text-sm">{label}</Label>
                      <Switch
                        checked={editingConsumer[key]}
                        onCheckedChange={(v) => setEditingConsumer({ ...editingConsumer, [key]: v })}
                      />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>Tartib</Label>
                  <Input
                    type="number"
                    value={editingConsumer.sortOrder}
                    onChange={(e) =>
                      setEditingConsumer({
                        ...editingConsumer,
                        sortOrder: parseInt(e.target.value, 10) || 0,
                      })
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingConsumer.isActive}
                    onCheckedChange={(v) => setEditingConsumer({ ...editingConsumer, isActive: v })}
                  />
                  <Label>Faol</Label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveConsumerPlan} disabled={savingConsumer}>
                    {savingConsumer ? <Loader2 className="size-4 animate-spin" /> : null}
                    Saqlash
                  </Button>
                  <Button variant="ghost" onClick={() => setEditingConsumer(null)}>
                    Bekor qilish
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
