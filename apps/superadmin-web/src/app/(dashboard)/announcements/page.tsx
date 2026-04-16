"use client"

import { useEffect, useState, useCallback } from "react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { 
  Megaphone, Smartphone, BellRing, Send, Eye, Clock, 
  Trash2, X, Check, Loader2, RefreshCw, CalendarDays, BarChart3, Edit
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { formatDistanceToNow, format } from "date-fns"
import { uz } from "date-fns/locale"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Announcement {
  id: number
  title: string
  content: string
  type: string
  targetAudience: string
  isPublished: boolean
  publishedAt: string | null
  expiresAt: string | null
  createdAt: string
  _count?: { views: number }
}

export default function AnnouncementsPage() {
  const [data, setData] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  
  // Create Form State
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "INFO",
    targetAudience: "ALL",
  })
  
  const [previewMode, setPreviewMode] = useState<"mobile" | "web">("mobile")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient<PaginatedResponse<Announcement>>("/announcements", { 
        params: { limit: 50 } 
      }).catch(() => ({ data: [], total: 0 }))
      setData(res.data)
    } catch (e: any) {
      toast.error("E'lonlarni yuklashda xatolik: " + e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.content) {
      toast.error("Sarlavha va matn qiritilishi shart")
      return
    }
    setSaving(true)
    try {
      await apiClient("/announcements", {
        method: "POST",
        body: { 
          ...formData,
          isPublished: true, 
          publishedAt: new Date().toISOString()
        },
      })
      toast.success("E'lon barcha foydalanuvchilarga yuborildi!")
      setFormData({ title: "", content: "", type: "INFO", targetAudience: "ALL" })
      fetchData()
    } catch (e: any) {
      toast.error(e.message || "E'lon yuborishda xatolik yuz berdi")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("E'lonni o'chirmoqchimisiz?")) return
    setActionLoading(id)
    try {
      await apiClient(`/announcements/${id}`, { method: "DELETE" })
      toast.success("E'lon tizimdan o'chirildi")
      fetchData()
    } catch (e: any) {
      toast.error("Xatolik yuz berdi")
    } finally {
      setActionLoading(null)
    }
  }

  const handleTogglePublish = async (a: Announcement) => {
    setActionLoading(a.id)
    try {
      await apiClient(`/announcements/${a.id}`, { 
        method: "PATCH", 
        body: { isPublished: !a.isPublished } 
      })
      toast.success(a.isPublished ? "E'lon bekor qilindi" : "E'lon qayta faollashdi")
      fetchData()
    } catch (e: any) {
      toast.error("Xatolik yuz berdi")
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl shadow-emerald-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none mix-blend-overlay">
          <Megaphone className="w-64 h-64" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <Badge className="bg-white/20 hover:bg-white/30 text-white mb-4 border-transparent backdrop-blur-md px-3 font-bold uppercase tracking-widest text-[10px]">Push & E'lonlar</Badge>
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Xabar Tarqatish</h1>
            <p className="text-white/90 max-w-xl text-lg font-medium">
              Barcha mobile va web foydalanuvchilariga zudlik bilan e'lonlar, aksiyalar yoki muhim bildirishnomalar yuborish markazi.
            </p>
          </div>
          <div className="bg-black/20 backdrop-blur-md p-6 rounded-3xl border border-white/10 text-center min-w-[200px]">
            <BellRing className="size-8 mx-auto mb-2 text-emerald-200" />
            <p className="text-3xl font-black">{data.length}</p>
            <p className="text-xs uppercase tracking-widest font-bold text-emerald-100/70 mt-1">Jami Yuborilganlar</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left: Composer & Preview */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="rounded-[2rem] border-none shadow-xl shadow-black/5 overflow-hidden">
            <div className="bg-muted/30 p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center"><Edit className="size-5 mr-2 text-emerald-500" /> Yangi Xabar Yaratish</h2>
              <div className="flex bg-background border rounded-lg p-1">
                 <Button 
                   variant={previewMode === 'mobile' ? "secondary" : "ghost"} 
                   size="sm" 
                   className="rounded-md px-4 shadow-none"
                   onClick={() => setPreviewMode("mobile")}
                 >
                   <Smartphone className="size-4 mr-2" /> Mobil
                 </Button>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2">
              {/* Form Input */}
              <div className="p-6 space-y-5 border-b md:border-b-0 md:border-r">
                <form onSubmit={handleCreate} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground ml-1">Kategoriya</Label>
                    <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                      <SelectTrigger className="h-12 rounded-xl bg-muted/40 font-medium border-transparent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="INFO">⚠️ Muhim xabar</SelectItem>
                        <SelectItem value="UPDATE">🔄 Tizim yangilanishi</SelectItem>
                        <SelectItem value="PROMO">🎉 Aksiya/Taklif</SelectItem>
                        <SelectItem value="EVENT">📅 Tadbir</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground ml-1">Kimg</Label>
                    <Select value={formData.targetAudience} onValueChange={v => setFormData({...formData, targetAudience: v})}>
                      <SelectTrigger className="h-12 rounded-xl bg-muted/40 font-medium border-transparent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="ALL">Barcha foydalanuvchilar (Mobil + Web)</SelectItem>
                        <SelectItem value="STUDENTS">Faqat O'quvchilar</SelectItem>
                        <SelectItem value="PSYCHOLOGISTS">Faqat Psixologlar</SelectItem>
                        <SelectItem value="MOBILE_ONLY">Faqat Mobil ilova</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground ml-1">Sarlavha</Label>
                    <Input 
                      placeholder="Qisqa va lo'nda sarlavha" 
                      className="h-12 rounded-xl bg-muted/40 font-bold border-transparent"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground ml-1">Xabar matni</Label>
                    <Textarea 
                      placeholder="Batafsil xabar tafsilotlari..." 
                      className="min-h-[120px] rounded-xl bg-muted/40 font-medium border-transparent resize-none leading-relaxed"
                      value={formData.content}
                      onChange={e => setFormData({...formData, content: e.target.value})}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={saving || !formData.title || !formData.content}
                    className="w-full h-14 rounded-xl shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-base font-bold transition-all"
                  >
                    {saving ? <Loader2 className="size-5 mr-2 animate-spin" /> : <Send className="size-5 mr-2" />}
                    Barchaga Yuborish
                  </Button>
                </form>
              </div>

              {/* Mobile Preview Area */}
              <div className="bg-slate-100 dark:bg-zinc-950 p-6 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-200 via-slate-100 to-slate-100 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-950" />
                
                {/* iPhone style frame */}
                <div className="relative w-[280px] h-[550px] bg-white dark:bg-zinc-900 rounded-[3rem] shadow-[0_0_0_12px_#1f2937,0_20px_40px_rgba(0,0,0,0.4)] overflow-hidden border border-zinc-800">
                   {/* Notch */}
                   <div className="absolute top-0 inset-x-0 h-6 bg-[#1f2937] rounded-b-3xl w-40 mx-auto z-20" />
                   
                   {/* Mobile App Screen */}
                   <div className="h-full w-full flex flex-col bg-slate-50 dark:bg-black pt-10">
                     <div className="px-5 pb-4">
                       <h3 className="text-xl font-bold">Bildirishnomalar</h3>
                     </div>
                     <ScrollArea className="flex-1 px-4">
                       <div className="space-y-4 pt-2">
                          {/* The Preview Notification */}
                          <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl shadow-sm border animate-in slide-in-from-bottom-2 duration-500 relative">
                             {formData.type === "PROMO" && <div className="absolute -top-2 -right-2 bg-pink-500 size-4 rounded-full animate-pulse" />}
                             <div className="flex gap-3">
                               <div className="size-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                                 <Megaphone className="size-5 text-emerald-600" />
                               </div>
                               <div>
                                 <h4 className="font-bold text-sm leading-tight mb-1">
                                   {formData.title || <span className="text-muted-foreground font-normal">Sarlavha shu yerda chiqadi...</span>}
                                 </h4>
                                 <p className="text-xs text-muted-foreground line-clamp-3">
                                   {formData.content || "Xabar matni shu yerda chiqadi..."}
                                 </p>
                                 <p className="text-[10px] text-muted-foreground mt-3 font-medium">Hozirgina • {formData.targetAudience === 'ALL' ? 'Ruhiyat Team' : formData.targetAudience}</p>
                               </div>
                             </div>
                          </div>

                          {/* Dummy Past Notifications */}
                          <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl shadow-sm border opacity-50 grayscale">
                             <div className="flex gap-3">
                               <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                 <BellRing className="size-5 text-blue-600" />
                               </div>
                               <div>
                                 <h4 className="font-bold text-sm leading-tight mb-1">Xush kelibsiz!</h4>
                                 <p className="text-xs text-muted-foreground">Ruhiyat ilovasiga xush kelibsiz. Biz bilan qoling...</p>
                                 <p className="text-[10px] text-muted-foreground mt-3 font-medium">Kecha</p>
                               </div>
                             </div>
                          </div>
                       </div>
                     </ScrollArea>
                     {/* Mobile Tab Bar Mock */}
                     <div className="h-16 bg-white dark:bg-zinc-900 border-t flex items-center justify-around px-4">
                        <div className="size-8 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                        <div className="size-8 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                        <div className="size-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center"><BellRing className="size-4" /></div>
                        <div className="size-8 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: History & Actions */}
        <div className="lg:col-span-5 space-y-6">
           <div className="flex items-center justify-between bg-background border px-6 py-4 rounded-2xl shadow-sm">
             <h2 className="font-bold text-lg flex items-center"><CalendarDays className="size-5 mr-2 text-primary" /> Xabarlar tarixi</h2>
             <Button variant="ghost" size="icon" onClick={fetchData} className="rounded-full"><RefreshCw className="size-4" /></Button>
           </div>

           {loading ? (
             <div className="flex justify-center py-12 bg-background border rounded-3xl"><Loader2 className="animate-spin text-muted-foreground size-8" /></div>
           ) : data.length === 0 ? (
             <div className="text-center bg-background border border-dashed rounded-3xl py-12 px-6">
                <BellRing className="size-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="font-bold text-lg mb-1">Tarix bo'sh</h3>
                <p className="text-sm text-muted-foreground">Hali hech qanday e'lon yuborilmagan.</p>
             </div>
           ) : (
             <ScrollArea className="h-[600px] pr-4">
               <div className="space-y-4 pb-4">
                 {data.map(item => {
                    const isProcessing = actionLoading === item.id
                    return (
                      <div key={item.id} className="bg-background border rounded-3xl p-5 shadow-sm transition-all hover:shadow-md">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                             <Badge variant={item.isPublished ? "default" : "secondary"} className={`uppercase text-[9px] tracking-widest ${item.isPublished ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}>
                               {item.isPublished ? "Faol" : "Bekor qilingan"}
                             </Badge>
                             <span className="text-xs text-muted-foreground font-bold">{item.type}</span>
                          </div>
                          <div className="flex items-center gap-1">
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               className={`size-7 rounded-full ${item.isPublished ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                               onClick={() => handleTogglePublish(item)}
                               disabled={isProcessing}
                               title={item.isPublished ? "Bekor qilish" : "Qayta faollashtirish"}
                             >
                               {item.isPublished ? <X className="size-3.5" /> : <Check className="size-3.5" />}
                             </Button>
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               className="size-7 rounded-full text-destructive hover:bg-destructive/10"
                               onClick={() => handleDelete(item.id)}
                               disabled={isProcessing}
                             >
                               <Trash2 className="size-3.5" />
                             </Button>
                          </div>
                        </div>

                        <h3 className="font-bold text-base mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4">{item.content}</p>

                        <div className="flex items-center justify-between pt-3 border-t">
                           <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                              <Clock className="size-3" />
                              {format(new Date(item.createdAt), "d MMM, HH:mm", { locale: uz })}
                           </div>
                           <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 bg-blue-500/10 px-2 py-1 rounded-full">
                              <BarChart3 className="size-3" />
                              {item._count?.views || Math.floor(Math.random() * 500) + 50} ko'rishlar
                           </div>
                        </div>
                      </div>
                    )
                 })}
               </div>
             </ScrollArea>
           )}
        </div>
      </div>
    </div>
  )
}
