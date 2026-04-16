"use client"

import { useEffect, useState, useCallback } from "react"
import { Brain, Save, Loader2, Bot, Sparkles, MessageSquare, Shield, Key, Sliders, Smartphone, Trash2, Globe, Lock, ImageIcon, Info, AlertTriangle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"

interface SystemSetting {
  id: number
  key: string
  value: string | null
  category: string
  description: string | null
  updatedAt: string
}

const DEFAULT_SETTINGS: Record<string, string> = {
  ai_dilosh_name: "Dilosh",
  ai_dilosh_description: "Sizning shaxsiy psixolog assistantingiz",
  ai_dilosh_welcome_message: "Salom! Men Diloshman. Sizga qanday yordam bera olaman?",
  ai_dilosh_persona: "Sen Ruhiyat ilovasining aqlli va mehribon AI psixolog assistantisan. Isming Dilosh. Maqsading foydalanuvchilarga ruhiy tushkunlikda yordam berish, motivatsiya berish va kerak bo'lsa psixologik tavsiyalar berish. Har doim o'zbek tilida so'zlash.",
  ai_dilosh_model_id: "gpt-4-turbo",
  ai_dilosh_temperature: "0.7",
  ai_dilosh_api_key: "",
  ai_dilosh_active: "true",
}

export default function AIDiloshPage() {
  const [settings, setSettings] = useState<Record<string, string>>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient<{ data: SystemSetting[] }>("/system/settings")
      const aiSettings: Record<string, string> = { ...DEFAULT_SETTINGS }
      
      res.data.forEach(s => {
        if (s.key.startsWith("ai_dilosh_")) {
          aiSettings[s.key] = s.value || ""
        }
      })
      
      setSettings(aiSettings)
    } catch (e: any) {
      setError(e.message || "Sozlamalarni yuklashda xatolik")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUpdate = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async (category: string = "ai") => {
    setSaving(true)
    try {
      // Faqat o'zgargan yoki yangi sozlamalarni saqlash
      for (const [key, value] of Object.entries(settings)) {
        await apiClient("/system/settings", {
          method: "POST",
          body: { key, value, category }
        })
      }
      alert("Barcha sozlamalar muvaffaqiyatli saqlandi!")
    } catch (e: any) {
      alert(e.message || "Saqlashda xatolik yuz berdi")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground">AI sozlamalari yuklanmoqda...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Dilosh Sozlamalari"
        description="Ilovadagi sun'iy intellekt assistantining xarakteri va texnik sozlamalarini boshqarish"
        icon={Brain}
        actions={[
          { label: "Yangilash", icon: Loader2, variant: "outline", onClick: fetchData },
          { label: "Hammasini saqlash", icon: Save, onClick: () => handleSave() },
        ]}
      />

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Xatolik</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar: Profile Preview */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="overflow-hidden border-primary/20 bg-primary/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Smartphone className="size-4" /> Ilovada ko'rinishi
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-6">
              <div className="relative mb-4">
                <Avatar className="size-24 border-4 border-white shadow-xl">
                  <AvatarImage src={settings.ai_dilosh_avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                    <Bot className="size-10" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 size-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="size-2 bg-white rounded-full animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-primary">{settings.ai_dilosh_name}</h3>
              <p className="text-sm text-muted-foreground text-center mt-2 px-4 italic">
                "{settings.ai_dilosh_description}"
              </p>
              
              <div className="w-full mt-8 p-4 rounded-xl bg-white border shadow-sm">
                <div className="flex gap-2 max-w-[80%]">
                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="size-4 text-primary" />
                  </div>
                  <div className="p-3 rounded-2xl rounded-tl-none bg-muted text-sm">
                    {settings.ai_dilosh_welcome_message}
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <div className="p-3 rounded-2xl rounded-tr-none bg-primary text-primary-foreground text-sm max-w-[80%]">
                    Salom Dilosh! Menga yordam kerak...
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Holat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="active-sw">AI Faolligi</Label>
                <Switch 
                  id="active-sw" 
                  checked={settings.ai_dilosh_active === "true"}
                  onCheckedChange={(c) => handleUpdate("ai_dilosh_active", c.toString())}
                />
              </div>
              <Separator />
              <div className="flex flex-col gap-2">
                 <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Oxirgi yangilanish:</span>
                    <span className="font-medium">Hozirgina</span>
                 </div>
                 <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Model:</span>
                    <Badge variant="outline" className="text-[10px]">{settings.ai_dilosh_model_id}</Badge>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content: Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="persona" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12">
              <TabsTrigger value="persona" className="gap-2"><Bot className="size-4" /> Shaxsiyati</TabsTrigger>
              <TabsTrigger value="system" className="gap-2"><Shield className="size-4" /> Tizimli ko'rsatma</TabsTrigger>
              <TabsTrigger value="config" className="gap-2"><Sliders className="size-4" /> Texnik sozlamalar</TabsTrigger>
            </TabsList>

            {/* Persona Section */}
            <TabsContent value="persona" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Qahramon Profili</CardTitle>
                  <CardDescription>AI assistentning ismi, tavsifi va kutib olish xabarini sozlang.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Assistant Ismi</Label>
                      <Input 
                        id="name" 
                        value={settings.ai_dilosh_name}
                        onChange={(e) => handleUpdate("ai_dilosh_name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="avatar">Avatar URL</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="avatar" 
                          value={settings.ai_dilosh_avatar_url || ""}
                          onChange={(e) => handleUpdate("ai_dilosh_avatar_url", e.target.value)}
                          placeholder="https://..."
                        />
                        <Button variant="outline" size="icon" title="Rasm yuklash"><ImageIcon className="size-4" /></Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="desc">Qisqa tavsif (Slogan)</Label>
                    <Input 
                      id="desc" 
                      value={settings.ai_dilosh_description}
                      onChange={(e) => handleUpdate("ai_dilosh_description", e.target.value)}
                      placeholder="M-n: Sizning ruhiy qo'llab-quvvatlovchingiz"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="welcome">Kutib olish xabari (Birinchi xabar)</Label>
                    <Textarea 
                      id="welcome" 
                      value={settings.ai_dilosh_welcome_message}
                      onChange={(e) => handleUpdate("ai_dilosh_welcome_message", e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Prompt Section */}
            <TabsContent value="system" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>System Prompt (Persona Instructions)</CardTitle>
                    <CardDescription>AI o'ziga qanday rol berilishini va qanday qoidalar asosida ishlayishini belgilaydigan eng muhim ko'rsatma.</CardDescription>
                  </div>
                  <Sparkles className="size-8 text-amber-500 opacity-20" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Textarea 
                      className="min-h-[300px] font-mono text-sm leading-relaxed p-4"
                      value={settings.ai_dilosh_persona}
                      onChange={(e) => handleUpdate("ai_dilosh_persona", e.target.value)}
                    />
                    <div className="absolute bottom-4 right-4 text-xs text-muted-foreground">
                      {settings.ai_dilosh_persona.length} belgidan iborat
                    </div>
                  </div>
                  
                  <Alert className="bg-blue-50/50 border-blue-100">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-xs text-blue-800 font-semibold">Tavsiya</AlertTitle>
                    <AlertDescription className="text-xs text-blue-700">
                      Ko'rsatmalarda assistant qanday tilda gaplashishi kerakligi, foydalanuvchi bilan muomala usuli (do'stona, rasmiy) va taqiqlangan mavzularni (masalan: tibbiy dori tavsiya qilmaslik) aniq ko'rsatib o'ting.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Technical Config Section */}
            <TabsContent value="config" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Texnik Sozlamalar</CardTitle>
                  <CardDescription>AI modelini yetkazib beruvchi servislarni (LLM Providers) sozlang.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="provider">AI Provayder</Label>
                      <Input value="OpenAI" disabled className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">Model ID</Label>
                      <Input 
                        id="model" 
                        value={settings.ai_dilosh_model_id}
                        onChange={(e) => handleUpdate("ai_dilosh_model_id", e.target.value)}
                        placeholder="M-n: gpt-4-turbo"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apikey">OpenAI API Key (Yashirin)</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input 
                        id="apikey" 
                        type="password"
                        value={settings.ai_dilosh_api_key}
                        onChange={(e) => handleUpdate("ai_dilosh_api_key", e.target.value)}
                        className="pl-10"
                        placeholder="sk-..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                      <Label className="flex justify-between">
                        Temperatur (Creative Level)
                        <span className="font-bold text-primary">{settings.ai_dilosh_temperature}</span>
                      </Label>
                      <Input 
                        type="range" 
                        min="0" max="1" step="0.1" 
                        value={settings.ai_dilosh_temperature}
                        onChange={(e) => handleUpdate("ai_dilosh_temperature", e.target.value)}
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Aniq (0.0)</span>
                        <span>Erkin (1.0)</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                       <Label>Maksimal xabarlar soni</Label>
                       <Input type="number" defaultValue="20" />
                       <p className="text-[10px] text-muted-foreground">Context tarixidagi xabarlar limiti</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-destructive/20 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="text-sm text-destructive">Xavfli zona</CardTitle>
                </CardHeader>
                <CardContent>
                   <Button variant="outline" className="text-destructive hover:bg-destructive hover:text-white" onClick={() => setSettings(DEFAULT_SETTINGS)}>
                      <Trash2 className="size-4 mr-2" /> Barcha sozlamalarni zavod holatiga qaytarish
                   </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Footer Save Area */}
      <div className="sticky bottom-6 flex justify-end gap-3 p-4 bg-white/80 backdrop-blur border rounded-xl shadow-lg z-10">
        <Button variant="outline" onClick={fetchData} disabled={saving}>Bekor qilish</Button>
        <Button onClick={() => handleSave()} disabled={saving} className="min-w-[140px]">
          {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
          O'zgarishlarni saqlash
        </Button>
      </div>
    </div>
  )
}
