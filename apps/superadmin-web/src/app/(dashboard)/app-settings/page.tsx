"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Smartphone, Bell, Globe, Shield, Database, Save, Loader2, Plus, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

export default function AppSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Stored in MobileAppSetting (real DB) as JSON string
  const [featureFlagsJson, setFeatureFlagsJson] = useState<string>('{"chat":true,"community":true,"payments":true}')
  const [bannersJson, setBannersJson] = useState<string>('[]')
  const [pushEnabled, setPushEnabled] = useState<boolean>(true)
  const [appName, setAppName] = useState<string>("Ruhiyat")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient<{ data: { key: string; value: string }[] }>("/system/mobile-settings")
      const list = res.data || []
      const get = (k: string, def: string) => list.find((x) => x.key === k)?.value ?? def
      setFeatureFlagsJson(get("app.feature_flags", featureFlagsJson))
      setBannersJson(get("app.banners", bannersJson))
      setPushEnabled(get("app.push_enabled", "true") === "true")
      setAppName(get("app.name", "Ruhiyat"))
    } catch (e: any) {
      toast.error(e.message || "Yuklab bo'lmadi")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const saveKey = async (key: string, value: string) => {
    await apiClient(`/system/mobile-settings/${encodeURIComponent(key)}`, {
      method: "PATCH",
      body: { value, platform: "all" }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Validate JSON fields
      JSON.parse(featureFlagsJson)
      JSON.parse(bannersJson)
      await Promise.all([
        saveKey("app.feature_flags", featureFlagsJson),
        saveKey("app.banners", bannersJson),
        saveKey("app.push_enabled", String(pushEnabled)),
        saveKey("app.name", appName.trim() || "Ruhiyat"),
      ])
      toast.success("Ilova sozlamalari saqlandi")
    } catch (e: any) {
      toast.error(e.message || "Saqлаб bo'lmadi")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ilova sozlamalari"
        description="Feature toggle, bannerlar va asosiy konfiguratsiyalar (real baza)"
        icon={Smartphone}
        actions={[
          { label: "Yangilash", icon: Database, variant: "outline", onClick: fetchData },
          { label: saving ? "Saqlanmoqda..." : "Saqlash", icon: saving ? Loader2 : Save, onClick: handleSave },
        ]}
      />

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Yuklanmoqda...</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe className="size-4" /> Umumiy</CardTitle>
              <CardDescription>Ilova nomi va umumiy konfiguratsiya</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Ilova nomi</Label>
                <Input value={appName} onChange={(e) => setAppName(e.target.value)} />
              </div>
              <div className="flex items-center justify-between rounded-xl border p-4">
                <div>
                  <div className="font-medium flex items-center gap-2"><Bell className="size-4" /> Push bildirishnomalar</div>
                  <div className="text-xs text-muted-foreground">Yoqilsa, mobil ilovada push ishlaydi</div>
                </div>
                <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
              </div>
              <div className="rounded-xl border p-4 bg-muted/20">
                <div className="flex items-center gap-2 text-sm font-semibold"><Shield className="size-4" /> Eslatma</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Feature flag va bannerlar JSON formatda saqlanadi. Bu sahifa faqat real DB bilan ishlaydi.
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="size-4" /> Feature toggle</CardTitle>
              <CardDescription>`app.feature_flags` (JSON)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea value={featureFlagsJson} onChange={(e) => setFeatureFlagsJson(e.target.value)} rows={10} className="font-mono text-xs" />
              <div className="text-xs text-muted-foreground">
                Misol: {"{ \"chat\": true, \"community\": false }"}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!loading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Smartphone className="size-4" /> Bannerlar</CardTitle>
            <CardDescription>`app.banners` (JSON array)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={bannersJson} onChange={(e) => setBannersJson(e.target.value)} rows={10} className="font-mono text-xs" />
            <div className="text-xs text-muted-foreground">
              Misol: [{"{ \"title\": \"Promo\", \"imageUrl\": \"...\", \"linkUrl\": \"...\", \"isActive\": true }"}]
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
