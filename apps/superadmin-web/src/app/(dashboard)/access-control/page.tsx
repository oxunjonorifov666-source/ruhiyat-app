"use client"

import { useEffect, useState, useCallback } from "react"
import { 
  UserCheck, Shield, Clock, Globe, Key, Trash2, 
  RotateCcw, Plus, Search, ShieldAlert, Monitor, 
  Smartphone, MapPin, Loader2, ShieldCheck, AlertCircle,
  MoreHorizontal, Power
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { format } from "date-fns"
import { uz } from "date-fns/locale"

interface AuthSession {
  id: number
  userId: number
  deviceInfo: string | null
  ipAddress: string | null
  isRevoked: boolean
  expiresAt: string
  createdAt: string
  user: {
    firstName: string
    lastName: string
    email: string
    role: string
  }
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

interface SystemSetting {
  id: number
  key: string
  value: string | null
  description: string | null
}

export default function AccessControlPage() {
  const [activeTab, setActiveTab] = useState("sessions")
  const [sessions, setSessions] = useState<AuthSession[]>([])
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Dialog states
  const [isKeyDialogOpen, setIsKeyDialogOpen] = useState(false)
  const [newKey, setNewKey] = useState({ name: "", expiresAt: "" })
  const [revokedKey, setRevokedKey] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      if (activeTab === "sessions") {
        const res = await apiClient<PaginatedResponse<AuthSession>>("/auth-sessions")
        setSessions(res.data)
      } else if (activeTab === "keys") {
        const res = await apiClient<PaginatedResponse<ApiKey>>("/api-keys")
        setApiKeys(res.data)
      } else if (activeTab === "ips") {
        const res = await apiClient<PaginatedResponse<SystemSetting>>("/settings")
        setSettings(res.data.filter(s => s.key === "access_control.allowed_ips"))
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRevokeSession = async (id: number) => {
    if (!confirm("Ushbu sessiyani bekor qilishni xohlaysizmi? Foydalanuvchi tizimdan chiqarib yuboriladi.")) return
    setActionLoading(true)
    try {
      await apiClient(`/auth-sessions/${id}`, { method: "DELETE" })
      toast.success("Sessiya bekor qilindi")
      fetchData()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateKey = async () => {
    setActionLoading(true)
    try {
      const res = await apiClient<{ key: string; apiKey: ApiKey }>("/api-keys", {
        method: "POST",
        body: { 
          name: newKey.name, 
          expiresAt: newKey.expiresAt || undefined,
          permissions: ["*"] 
        }
      })
      setRevokedKey(res.key)
      setIsKeyDialogOpen(false)
      fetchData()
      toast.success("API kaliti yaratildi")
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveKey = async (id: number) => {
    if (!confirm("Ushbu API kalitini o'chirishni xohlaysizmi? Bu kalitdan foydalanadigan barcha integratsiyalar to'xtaydi.")) return
    setActionLoading(true)
    try {
      await apiClient(`/api-keys/${id}`, { method: "DELETE" })
      toast.success("API kaliti o'chirildi")
      fetchData()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateIps = async (value: string) => {
    try {
      await apiClient(`/settings/access_control.allowed_ips`, {
        method: "PATCH",
        body: { value, category: "security" }
      })
      toast.success("IP ruxsatnomalari yangilandi")
      fetchData()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title="Kirish nazorati"
        description="Xavfsizlik siyosati, sessiya va API kalitlarini markaziy boshqarish"
        icon={UserCheck}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-8 bg-muted/50 p-1 rounded-2xl">
          <TabsTrigger value="sessions" className="rounded-xl font-bold py-2.5">
            <Clock className="size-4 mr-2" />
            Faol sessiyalar
          </TabsTrigger>
          <TabsTrigger value="keys" className="rounded-xl font-bold py-2.5">
            <Key className="size-4 mr-2" />
            API Kalitlar
          </TabsTrigger>
          <TabsTrigger value="ips" className="rounded-xl font-bold py-2.5">
            <Globe className="size-4 mr-2" />
            IP Ruxsatlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-6">
          <div className="grid gap-6">
            <Card className="border-none shadow-xl shadow-black/5 rounded-3xl overflow-hidden">
              <CardHeader className="bg-muted/10 border-b px-8 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-black italic tracking-tight">Hozirgi faol seanslar</CardTitle>
                    <CardDescription className="text-xs font-medium">Barcha platformalardagi faol foydalanuvchi sessiyalari</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchData} className="rounded-xl border-primary/20 hover:bg-primary/5">
                    <RotateCcw className={`size-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Yangilash
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/10 hover:bg-muted/10">
                      <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Foydalanuvchi</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Qurilma / IP</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Boshlangan</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Holat</TableHead>
                      <TableHead className="text-right px-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}><TableCell colSpan={5} className="h-16 animate-pulse bg-muted/5"></TableCell></TableRow>
                      ))
                    ) : (sessions && sessions.length === 0) ? (
                      <TableRow><TableCell colSpan={5} className="h-40 text-center text-muted-foreground font-medium italic">Faol sessiyalar mavjud emas</TableCell></TableRow>
                    ) : sessions.map((s) => (
                      <TableRow key={s.id} className="hover:bg-muted/5 group">
                        <TableCell className="px-8 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                              {s.user?.firstName[0] || "U"}{s.user?.lastName[0] || ""}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm tracking-tight">{s.user?.firstName} {s.user?.lastName}</span>
                              <span className="text-[10px] font-medium text-muted-foreground">{s.user?.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-foreground/80">
                              {s.deviceInfo?.toLowerCase().includes("mobile") ? <Smartphone className="size-3" /> : <Monitor className="size-3" />}
                              {s.deviceInfo || "Noma'lum qurilma"}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                              <MapPin className="size-3" />
                              {s.ipAddress || "—"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-xs font-medium text-muted-foreground italic">
                            {format(new Date(s.createdAt), "d-MMMM, HH:mm", { locale: uz })}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {s.isRevoked ? (
                            <Badge variant="outline" className="rounded-full bg-red-50 text-red-600 border-red-100 font-bold px-3">Bekor qilingan</Badge>
                          ) : (
                            <Badge variant="outline" className="rounded-full bg-emerald-50 text-emerald-600 border-emerald-100 font-bold px-3 animate-pulse">Faol</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right px-8">
                          {!s.isRevoked && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRevokeSession(s.id)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Power className="size-4 mr-2" />
                              Tugatish
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="keys" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setIsKeyDialogOpen(true)} className="rounded-2xl font-black tracking-tight px-6 h-11 shadow-lg shadow-primary/20">
              <Plus className="size-4 mr-2" />
              Yangi API Kalit
            </Button>
          </div>

          {revokedKey && (
            <Card className="bg-emerald-500/10 border-emerald-500/20 rounded-3xl mb-6">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="size-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white">
                    <ShieldCheck className="size-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-emerald-700">Yangi API Kaliti Yaratildi</h4>
                    <p className="text-xs text-emerald-600 mb-4">Ushbu kalitni xavfsiz joyga saqlab qo'ying. U faqat bir marta ko'rsatiladi:</p>
                    <div className="bg-white/80 p-4 rounded-2xl border border-emerald-200 font-mono text-xs select-all text-center tracking-widest">
                      {revokedKey}
                    </div>
                    <Button variant="ghost" className="mt-4 text-emerald-700 font-bold" onClick={() => setRevokedKey(null)}>Tushundim</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="h-40 animate-pulse bg-muted/20 border-none rounded-3xl"></Card>
              ))
            ) : apiKeys.length === 0 ? (
              <div className="col-span-full h-60 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl text-muted-foreground p-10">
                <ShieldAlert className="size-10 mb-4 opacity-20" />
                <p className="font-bold italic">Hech qanday API kalitlari aniqlanmadi</p>
              </div>
            ) : apiKeys.map((key) => (
              <Card key={key.id} className="border-none shadow-xl shadow-black/5 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`rounded-full px-3 font-bold ${key.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}>
                      {key.isActive ? "Aktiv" : "Nofaol"}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveKey(key.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full h-8 w-8 opacity-0 group-hover:opacity-100">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-lg font-black tracking-tight">{key.name}</CardTitle>
                  <CardDescription className="font-mono text-[10px] tracking-widest uppercase">{key.keyPrefix}••••••••••••••••</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 border-t bg-muted/5 mt-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <span>Oxirgi foydalanish</span>
                      <span className="text-foreground">
                        {key.lastUsedAt ? format(new Date(key.lastUsedAt), "d-MMM, HH:mm", { locale: uz }) : "Hech qachon"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <span>Yaratilgan</span>
                      <span className="text-foreground">{format(new Date(key.createdAt), "d-MMM, yyyy", { locale: uz })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ips" className="space-y-6">
          <Card className="border-none shadow-xl shadow-black/5 rounded-3xl overflow-hidden max-w-3xl mx-auto">
            <CardHeader className="bg-primary/5 p-8 border-b">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Globe className="size-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black italic tracking-tight uppercase">IP White-Listing</CardTitle>
                  <CardDescription className="font-medium text-xs">Tizimga kirish huquqiga ega ruxsat etilgan IP manzillar ro'yxati</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8 font-medium">
              <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-4">
                <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-900/70 leading-relaxed italic">
                  <strong>DIQQAT:</strong> Agar ro'yxat bo'sh bo'lsa, har qanday IP manzillardan kirish ruxsat etiladi (default). 
                  Ro'yxatga IP qo'shilgandan so'ng, faqat o'sha manzillardan kirish mumkin bo'ladi. Manzillarni vergul yoki yangi qator bilan ajrating.
                </p>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Ruxsat etilgan IP manzillar</Label>
                <div className="relative">
                  <textarea
                    className="w-full min-h-[150px] rounded-3xl border-muted-foreground/20 p-6 font-mono text-sm focus:ring-primary focus:border-primary transition-all resize-none shadow-inner bg-muted/10 outline-none"
                    placeholder="Masalan: 192.168.1.1, 85.115.12.1"
                    defaultValue={settings[0]?.value || ""}
                    onBlur={(e) => handleUpdateIps(e.target.value)}
                  />
                  <div className="absolute bottom-4 right-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">
                    Bajarish uchun chetga bosing
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-muted/20 rounded-2xl text-[10px] uppercase font-black text-muted-foreground tracking-widest justify-center">
                <ShieldCheck className="size-4" />
                Xavfsizlik darajasi: {settings[0]?.value ? "YUQORI (IP FILTRLANGAN)" : "NORMAL"}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* API Key Modal */}
      <Dialog open={isKeyDialogOpen} onOpenChange={setIsKeyDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Yangi API Kalit</DialogTitle>
            <DialogDescription className="font-medium text-xs">Tashqi integratsiyalar (CRM, Bot, API) uchun maxfiy kalit yarating</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6 font-bold">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kalit nomi</Label>
              <Input 
                placeholder="Masalan: Telegram Bot Central" 
                value={newKey.name}
                onChange={e => setNewKey({...newKey, name: e.target.value})}
                className="rounded-2xl h-12"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Amal qilish muddati (ixtiyoriy)</Label>
              <Input 
                type="date"
                value={newKey.expiresAt}
                onChange={e => setNewKey({...newKey, expiresAt: e.target.value})}
                className="rounded-2xl h-12"
              />
            </div>
          </div>
          <DialogFooter className="gap-3 sm:justify-center">
            <Button variant="ghost" onClick={() => setIsKeyDialogOpen(false)} className="rounded-2xl">Bekor qilish</Button>
            <Button onClick={handleCreateKey} disabled={actionLoading || !newKey.name} className="rounded-2xl px-10 h-11 font-black shadow-xl shadow-primary/20">
              {actionLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : "Generatsiya qilish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
