"use client"

import { useEffect, useState, useCallback } from "react"
import { Settings, Globe, Smartphone, Key, Save, Loader2, Plus, Trash2, AlertCircle, Shield, CheckCircle, Smartphone as MobileIcon, Terminal, Activity, Info, Lock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Setting {
  key: string
  value: string
  category?: string
  platform?: string
}

interface ApiKey {
  id: number
  name: string
  keyPrefix: string
  isActive: boolean
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Setting[]>([])
  const [mobileSettings, setMobileSettings] = useState<Setting[]>([])
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  
  // New API Key Modal
  const [isKeyOpen, setIsKeyOpen] = useState(false)
  const [newKey, setNewKey] = useState({ name: "", expiresAt: "" })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [s, m, a] = await Promise.all([
        apiClient<{ data: any[] }>("/system/settings").then(r => r.data),
        apiClient<{ data: any[] }>("/system/mobile-settings").then(r => r.data),
        apiClient<{ data: ApiKey[] }>("/system/api-keys").then(r => r.data),
      ])
      setSettings(s)
      setMobileSettings(m)
      setApiKeys(a)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUpdateSetting = async (key: string, value: string, category: string = "general", isMobile = false) => {
    setSaving(true)
    try {
      if (isMobile) {
        await apiClient(`/system/mobile-settings/${encodeURIComponent(key)}`, {
          method: "PATCH",
          body: { value, platform: "all", category }
        })
      } else {
        await apiClient(`/system/settings/${encodeURIComponent(key)}`, {
          method: "PATCH",
          body: { value, category }
        })
      }
      // Local update to avoid full reload for switches
      if (isMobile) {
        setMobileSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s))
      } else {
        setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s))
      }
    } catch (e: any) {
      alert(e.message || "Xatolik")
    } finally {
      setSaving(false)
    }
  }

  const handleCreateKey = async () => {
    if (!newKey.name) return
    setSaving(true)
    try {
      await apiClient("/system/api-keys", {
        method: "POST",
        body: { ...newKey }
      })
      setIsKeyOpen(false)
      setNewKey({ name: "", expiresAt: "" })
      fetchData()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteKey = async (id: number) => {
    if (!confirm("Haqiqatan ham bu API kalitni o'chirmoqchimisiz?")) return
    setSaving(true)
    try {
      await apiClient(`/system/api-keys/${id}`, { method: "DELETE" })
      fetchData()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const getSetting = (list: Setting[], key: string, def = "") => list.find(s => s.key === key)?.value || def

  if (loading && settings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Tizim sozlamalari yuklanmoqda...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tizim sozlamalari"
        description="Platforma, mobil ilova va xavfsizlik parametrlarini boshqarish"
        icon={Settings}
        actions={[
          {
            label: saving ? "Saqlanmoqda..." : "Yangilash",
            icon: saving ? Loader2 : Save,
            variant: "outline",
            onClick: fetchData
          }
        ]}
      />

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-muted/50 p-1 mb-6">
          <TabsTrigger value="general" className="gap-2 px-6"><Globe className="size-4" /> Umumiy</TabsTrigger>
          <TabsTrigger value="mobile" className="gap-2 px-6"><MobileIcon className="size-4" /> Mobil ilova</TabsTrigger>
          <TabsTrigger value="api" className="gap-2 px-6"><Key className="size-4" /> API kalitlar</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Info className="size-4 text-blue-500" /> Platforma ma'lumotlari
                </CardTitle>
                <CardDescription>Ilova nomi va aloqa ma'lumotlari</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <SettingItem 
                    label="Tizim nomi (Site Name)" 
                    value={getSetting(settings, "site_name", "Ruhiyat")} 
                    onSave={(v) => handleUpdateSetting("site_name", v)} 
                    disabled={saving}
                 />
                 <SettingItem 
                    label="Qo'llab-quvvatlash emaili" 
                    value={getSetting(settings, "support_email", "support@ruhiyat.uz")} 
                    onSave={(v) => handleUpdateSetting("support_email", v)} 
                    disabled={saving}
                 />
                 <SettingItem 
                    label="Telegram bot havolasi" 
                    value={getSetting(settings, "tg_bot_url", "https://t.me/ruhiyat_bot")} 
                    onSave={(v) => handleUpdateSetting("tg_bot_url", v)} 
                    disabled={saving}
                 />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="size-4 text-emerald-500" /> Tizim holati
                </CardTitle>
                <CardDescription>Texnik xizmat va ro'yxatdan o'tish rejimlari</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                       <Label>Texnik xizmat rejimi (Maintenance)</Label>
                       <p className="text-[10px] text-muted-foreground">Yoqilsa, foydalanuvchilar ilovaga kira olmaydi</p>
                    </div>
                    <Switch 
                      checked={getSetting(settings, "maintenance_mode") === "true"}
                      onCheckedChange={(c) => handleUpdateSetting("maintenance_mode", c.toString())}
                    />
                 </div>
                 <Separator />
                 <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                       <Label>Yangi ro'yxatdan o'tish</Label>
                       <p className="text-[10px] text-muted-foreground">Yangi foydalanuvchilar qo'shilishini to'xtatish</p>
                    </div>
                    <Switch 
                      checked={getSetting(settings, "registration_enabled", "true") === "true"}
                      onCheckedChange={(c) => handleUpdateSetting("registration_enabled", c.toString())}
                    />
                 </div>
                 <Separator />
                 <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                       <Label>Faqat Premium foydalanish</Label>
                       <p className="text-[10px] text-muted-foreground">Barcha kontentni faqat premium uchun yopish</p>
                    </div>
                    <Switch 
                      checked={getSetting(settings, "premium_only_mode") === "true"}
                      onCheckedChange={(c) => handleUpdateSetting("premium_only_mode", c.toString())}
                    />
                 </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Mobile Settings */}
        <TabsContent value="mobile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Versiyalarni boshqarish</CardTitle>
              <CardDescription>iOS va Android ilovalarining joriy versiyalarini sozlang</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
               <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-6 p-6 rounded-xl border bg-slate-50/50">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <div className="size-8 rounded-lg bg-blue-500 flex items-center justify-center text-white">
                              <Smartphone className="size-5" />
                           </div>
                           <span className="font-bold">Apple iOS</span>
                        </div>
                        <Badge variant="outline" className="border-blue-200 text-blue-600">App Store</Badge>
                     </div>
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <Label className="text-xs">Joriy versiya</Label>
                           <Input placeholder="1.0.0" defaultValue={getSetting(mobileSettings, "ios_version", "1.0.0")} id="ios_ver" />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-xs">Minimal versiya (Majburiy yangilash)</Label>
                           <Input placeholder="1.0.0" defaultValue={getSetting(mobileSettings, "ios_min_version", "1.0.0")} id="ios_min_ver" />
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <Label className="text-xs">Yangilashni majburlash</Label>
                            <Switch 
                              checked={getSetting(mobileSettings, "ios_force_update") === "true"}
                              onCheckedChange={(c) => handleUpdateSetting("ios_force_update", c.toString(), "mobile", true)}
                            />
                        </div>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700" size="sm" onClick={() => {
                           handleUpdateSetting("ios_version", (document.getElementById("ios_ver") as HTMLInputElement).value, "mobile", true)
                           handleUpdateSetting("ios_min_version", (document.getElementById("ios_min_ver") as HTMLInputElement).value, "mobile", true)
                        }}>iOS versiyasini yangilash</Button>
                     </div>
                  </div>

                  <div className="space-y-6 p-6 rounded-xl border bg-slate-50/50">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <div className="size-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                              <Smartphone className="size-5" />
                           </div>
                           <span className="font-bold">Android</span>
                        </div>
                        <Badge variant="outline" className="border-emerald-200 text-emerald-600">Google Play</Badge>
                     </div>
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <Label className="text-xs">Joriy versiya</Label>
                           <Input placeholder="1.0.0" defaultValue={getSetting(mobileSettings, "android_version", "1.0.0")} id="and_ver" />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-xs">Minimal versiya (Majburiy yangilash)</Label>
                           <Input placeholder="1.0.0" defaultValue={getSetting(mobileSettings, "android_min_version", "1.0.0")} id="and_min_ver" />
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <Label className="text-xs">Yangilashni majburlash</Label>
                            <Switch 
                              checked={getSetting(mobileSettings, "android_force_update") === "true"}
                              onCheckedChange={(c) => handleUpdateSetting("android_force_update", c.toString(), "mobile", true)}
                            />
                        </div>
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={() => {
                           handleUpdateSetting("android_version", (document.getElementById("and_ver") as HTMLInputElement).value, "mobile", true)
                           handleUpdateSetting("android_min_version", (document.getElementById("and_min_ver") as HTMLInputElement).value, "mobile", true)
                        }}>Android versiyasini yangilash</Button>
                     </div>
                  </div>
               </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="api" className="space-y-6">
           <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                 <div>
                    <CardTitle className="text-sm">API Kalitlarni boshqarish</CardTitle>
                    <CardDescription>Tashqi xizmatlar va integratsiyalar uchun xavfsiz kalitlar</CardDescription>
                 </div>
                 <Button size="sm" onClick={() => setIsKeyOpen(true)}><Plus className="size-4 mr-1" /> Yangi API kalit</Button>
              </CardHeader>
              <CardContent>
                 <div className="grid gap-4">
                    {apiKeys.length === 0 ? (
                       <div className="text-center py-12 border-2 border-dashed rounded-xl">
                          <Terminal className="size-8 mx-auto mb-2 opacity-20" />
                          <p className="text-sm text-muted-foreground">Hozircha hech qanday API kalit yaratilmagan</p>
                       </div>
                    ) : (
                       apiKeys.map(key => (
                          <div key={key.id} className="flex items-center justify-between p-4 rounded-xl border bg-muted/20 hover:bg-muted/30 transition-colors group">
                             <div className="flex items-center gap-4">
                                <div className="size-10 rounded-full bg-white flex items-center justify-center border shadow-sm group-hover:scale-110 transition-transform">
                                   <Lock className="size-4 text-primary" />
                                </div>
                                <div>
                                   <div className="flex items-center gap-2">
                                      <span className="font-bold text-sm">{key.name}</span>
                                      {key.isActive ? (
                                         <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-100 text-[10px] h-5">Faol</Badge>
                                      ) : (
                                         <Badge variant="secondary" className="text-[10px] h-5">Nofaol</Badge>
                                      )}
                                   </div>
                                   <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground font-mono">
                                      <code>{key.keyPrefix}********************</code>
                                      <span>•</span>
                                      <span>Yaratilgan: {new Date(key.createdAt).toLocaleDateString()}</span>
                                   </div>
                                </div>
                             </div>
                             <div className="flex items-center gap-2">
                                {key.lastUsedAt && (
                                   <span className="text-[10px] text-muted-foreground mr-2 font-medium">Oxirgi foydalanish: {new Date(key.lastUsedAt).toLocaleDateString()}</span>
                                )}
                                <Button variant="ghost" size="icon" className="size-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteKey(key.id)}>
                                   <Trash2 className="size-3.5" />
                                </Button>
                             </div>
                          </div>
                       ))
                    )}
                 </div>
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>

      {/* New API Key Dialog */}
      <Dialog open={isKeyOpen} onOpenChange={setIsKeyOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Yangi API Kalit</DialogTitle>
            <DialogDescription>
              Tizim integratsiyalari uchun yangi xavfsizlik kaliti yarating.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="key-name">Xizmat nomi</Label>
              <Input id="key-name" placeholder="M-n: Mobile App Sync" value={newKey.name} onChange={(e) => setNewKey({...newKey, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry">Amal qilish muddati (ixtiyoriy)</Label>
              <Input id="expiry" type="date" value={newKey.expiresAt} onChange={(e) => setNewKey({...newKey, expiresAt: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsKeyOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleCreateKey} disabled={saving}>
               {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
               Kalit yaratish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SettingItem({ label, value, onSave, disabled }: { label: string, value: string, onSave: (v: string) => void, disabled?: boolean }) {
  const [val, setVal] = useState(value)
  
  useEffect(() => { setVal(value) }, [value])

  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold">{label}</Label>
      <div className="flex gap-2">
        <Input 
          value={val} 
          onChange={(e) => setVal(e.target.value)}
          className="bg-muted/50 focus:bg-white transition-colors"
        />
        <Button 
          size="sm" 
          onClick={() => onSave(val)}
          disabled={disabled || val === value}
        >
          {disabled ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3 mr-1" />}
          Saqlash
        </Button>
      </div>
    </div>
  )
}