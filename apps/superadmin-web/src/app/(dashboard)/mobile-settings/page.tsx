"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Smartphone, Save, Loader2, Settings2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

type Setting = { key: string; value: string; platform?: string }

function getSetting(list: Setting[], key: string, def = "") {
  return list.find((s) => s.key === key)?.value ?? def
}

export default function MobileSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState<Setting[]>([])

  const [iosVersion, setIosVersion] = useState("")
  const [iosMinVersion, setIosMinVersion] = useState("")
  const [iosForce, setIosForce] = useState(false)
  const [androidVersion, setAndroidVersion] = useState("")
  const [androidMinVersion, setAndroidMinVersion] = useState("")
  const [androidForce, setAndroidForce] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient<{ data: Setting[] }>("/system/mobile-settings")
      setItems(res.data || [])
    } catch (e: any) {
      toast.error(e.message || "Yuklab bo'lmadi")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    setIosVersion(getSetting(items, "ios_version", "1.0.0"))
    setIosMinVersion(getSetting(items, "ios_min_version", "1.0.0"))
    setIosForce(getSetting(items, "ios_force_update", "false") === "true")
    setAndroidVersion(getSetting(items, "android_version", "1.0.0"))
    setAndroidMinVersion(getSetting(items, "android_min_version", "1.0.0"))
    setAndroidForce(getSetting(items, "android_force_update", "false") === "true")
  }, [items])

  const saveKey = async (key: string, value: string) => {
    await apiClient(`/system/mobile-settings/${encodeURIComponent(key)}`, {
      method: "PATCH",
      body: { value, platform: "all" }
    })
    setItems((prev) => {
      const exists = prev.some((s) => s.key === key)
      return exists ? prev.map((s) => s.key === key ? { ...s, value } : s) : [{ key, value, platform: "all" }, ...prev]
    })
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      // Basic validation
      if (!/^\d+\.\d+\.\d+$/.test(iosVersion) || !/^\d+\.\d+\.\d+$/.test(androidVersion)) {
        throw new Error("Versiya formati: 1.0.0 ko'rinishida bo'lishi kerak")
      }
      await Promise.all([
        saveKey("ios_version", iosVersion),
        saveKey("ios_min_version", iosMinVersion),
        saveKey("ios_force_update", String(iosForce)),
        saveKey("android_version", androidVersion),
        saveKey("android_min_version", androidMinVersion),
        saveKey("android_force_update", String(androidForce)),
      ])
      toast.success("Mobil sozlamalar saqlandi")
    } catch (e: any) {
      toast.error(e.message || "Saqлаб bo'lmadi")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ilova sozlamalari (Mobil)"
        description="iOS/Android versiya nazorati, force update va asosiy konfiguratsiyalar"
        icon={Smartphone}
        actions={[
          { label: "Yangilash", icon: Settings2, variant: "outline", onClick: fetchData },
          { label: saving ? "Saqlanmoqda..." : "Saqlash", icon: saving ? Loader2 : Save, onClick: handleSaveAll },
        ]}
      />

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Yuklanmoqda...</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Apple iOS</CardTitle>
              <CardDescription>App Store versiya boshqaruvi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Joriy versiya</Label>
                <Input value={iosVersion} onChange={(e) => setIosVersion(e.target.value)} placeholder="1.0.0" />
              </div>
              <div className="space-y-2">
                <Label>Minimal versiya (majburiy yangilash)</Label>
                <Input value={iosMinVersion} onChange={(e) => setIosMinVersion(e.target.value)} placeholder="1.0.0" />
              </div>
              <div className="flex items-center justify-between rounded-xl border p-4">
                <div>
                  <div className="font-medium">Force update</div>
                  <div className="text-xs text-muted-foreground">Minimal versiyadan past bo‘lsa, majburiy yangilash</div>
                </div>
                <Switch checked={iosForce} onCheckedChange={setIosForce} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Android</CardTitle>
              <CardDescription>Google Play versiya boshqaruvi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Joriy versiya</Label>
                <Input value={androidVersion} onChange={(e) => setAndroidVersion(e.target.value)} placeholder="1.0.0" />
              </div>
              <div className="space-y-2">
                <Label>Minimal versiya (majburiy yangilash)</Label>
                <Input value={androidMinVersion} onChange={(e) => setAndroidMinVersion(e.target.value)} placeholder="1.0.0" />
              </div>
              <div className="flex items-center justify-between rounded-xl border p-4">
                <div>
                  <div className="font-medium">Force update</div>
                  <div className="text-xs text-muted-foreground">Minimal versiyadan past bo‘lsa, majburiy yangilash</div>
                </div>
                <Switch checked={androidForce} onCheckedChange={setAndroidForce} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saqlanayotgan qiymatlar</CardTitle>
          <CardDescription>Real baza (`MobileAppSetting`) dagi kalitlar ro‘yxati</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {items.length === 0 ? (
            <div className="text-muted-foreground">Hozircha yozuvlar yo‘q</div>
          ) : (
            <div className="grid gap-2">
              {items.slice(0, 20).map((s) => (
                <div key={s.key} className="flex items-center justify-between rounded-lg border p-3">
                  <code className="text-xs">{s.key}</code>
                  <span className="text-xs text-muted-foreground line-clamp-1 max-w-[60%]">{s.value}</span>
                </div>
              ))}
            </div>
          )}
          {items.length > 20 && <div className="text-xs text-muted-foreground">+ yana {items.length - 20} ta</div>}
        </CardContent>
      </Card>
    </div>
  )
}
  