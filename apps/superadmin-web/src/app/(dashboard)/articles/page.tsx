"use client"

import { useEffect, useState, useCallback } from "react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { 
  FileText, Plus, Hash, Trash2, Image as ImageIcon, 
  Clock, Eye, Lock, Globe, MoreVertical, CheckCircle, 
  Loader2, ArrowLeft, RefreshCw, Edit, Smartphone, BookOpen, Star
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { uz } from "date-fns/locale"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Article {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string | null
  category: string | null
  isPublished: boolean
  viewCount: number
  createdAt: string
  coverImageUrl: string | null
}

const CATEGORIES = ["Psixologiya", "Oila va munosabatlar", "Bolalar tarbiyasi", "Stress va tashvish", "Tushkunlik", "O'z-o'zini rivojlantirish", "Uyqu sifati", "Motivatsiya"]

export default function ArticlesPage() {
  const [data, setData] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "editor">("list")
  const [mobileTab, setMobileTab] = useState<"feed" | "detail">("feed")
  const [saving, setSaving] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [form, setForm] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    category: "Psixologiya",
    coverImageUrl: "",
    isPublished: true
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient<PaginatedResponse<Article>>("/articles", { 
        params: { limit: 50 } 
      })
      setData(res.data)
    } catch {
      toast.error("Maqolalarni yuklashda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Sarlavha va matn to'ldirilishi shart!")
      return
    }
    setSaving(true)
    try {
      if (selectedArticle) {
        await apiClient(`/articles/${selectedArticle.id}`, { method: "PATCH", body: form })
        toast.success("✅ Maqola muvaffaqiyatli yangilandi!")
      } else {
        await apiClient("/articles", { method: "POST", body: form })
        toast.success("🚀 Yangi maqola nashr etildi! Mobil ilovada ko'rinadi.")
      }
      setViewMode("list")
      fetchData()
    } catch (e: any) {
      toast.error(e.message || "Xatolik yuz berdi")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Bu maqolani o'chirmoqchimisiz? Bu amal qaytarib bo'lmaydi.")) return
    setActionLoading(id)
    try {
      await apiClient(`/articles/${id}`, { method: "DELETE" })
      toast.success("Maqola tizimdan o'chirildi")
      fetchData()
    } catch {
      toast.error("O'chirishda xatolik yuz berdi")
    } finally {
      setActionLoading(null)
    }
  }

  const handleTogglePublish = async (a: Article) => {
    setActionLoading(a.id)
    try {
      await apiClient(`/articles/${a.id}`, { method: "PATCH", body: { isPublished: !a.isPublished } })
      toast.success(a.isPublished ? "Maqola yashirildi (mobil ilovadan olib tashlandi)" : "Maqola nashr etildi! ✅")
      fetchData()
    } catch {
      toast.error("Xatolik yuz berdi")
    } finally {
      setActionLoading(null)
    }
  }

  const openEditor = (article?: Article) => {
    if (article) {
      setSelectedArticle(article)
      setForm({
        title: article.title,
        slug: article.slug || "",
        content: article.content || "",
        excerpt: article.excerpt || "",
        category: article.category || "Psixologiya",
        coverImageUrl: article.coverImageUrl || "",
        isPublished: article.isPublished
      })
    } else {
      setSelectedArticle(null)
      setForm({ title: "", slug: "", content: "", excerpt: "", category: "Psixologiya", coverImageUrl: "", isPublished: true })
    }
    setMobileTab("feed")
    setViewMode("editor")
  }

  const genSlug = (title: string) =>
    title.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '')

  // ─── EDITOR VIEW ───────────────────────────────────────────────────────────
  if (viewMode === "editor") {
    return (
      <div className="h-[calc(100vh-3rem)] flex flex-col gap-0 -m-6 overflow-hidden">
        {/* Editor Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-background border-b shrink-0 z-20">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setViewMode("list")} className="rounded-full bg-muted/50">
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <h2 className="font-black text-lg leading-tight">{selectedArticle ? "Maqolani Tahrirlash" : "Yangi Maqola Yozish"}</h2>
              <p className="text-xs text-muted-foreground">Nashr etilsa mobil ilovaning "Maqolalar" bo'limida darhol ko'rinadi</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-muted/60 px-4 py-2 rounded-full border">
              <Switch 
                id="publish-toggle"
                checked={form.isPublished} 
                onCheckedChange={v => setForm({...form, isPublished: v})} 
              />
              <Label htmlFor="publish-toggle" className="font-bold text-sm cursor-pointer whitespace-nowrap">
                {form.isPublished ? "📢 Ommaviy" : "🔒 Qoralama"}
              </Label>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="rounded-full h-11 px-8 font-bold shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle className="size-4 mr-2" />}
              {selectedArticle ? "Yangilash" : "Nashr Etish"}
            </Button>
          </div>
        </div>

        {/* 2-column Editor Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Form */}
          <ScrollArea className="w-[55%] border-r">
            <div className="p-8 space-y-6">
              {/* Category & Cover */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Kategoriya</Label>
                  <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                    <SelectTrigger className="h-12 rounded-xl bg-muted/40 border-transparent font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1">
                    <ImageIcon className="size-3" /> Muqova rasmi (URL)
                  </Label>
                  <Input 
                    value={form.coverImageUrl} 
                    onChange={e => setForm({...form, coverImageUrl: e.target.value})} 
                    className="h-12 rounded-xl bg-muted/40 border-transparent font-medium"
                    placeholder="https://images.unsplash.com/..." 
                  />
                </div>
              </div>

              {/* Muqova preview */}
              {form.coverImageUrl && (
                <div className="h-48 rounded-2xl overflow-hidden border bg-muted">
                  <img src={form.coverImageUrl} alt="Muqova" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Sarlavha</Label>
                <Textarea 
                  value={form.title} 
                  onChange={e => {
                    const v = e.target.value
                    setForm(f => ({...f, title: v, slug: selectedArticle ? f.slug : genSlug(v)}))
                  }}
                  className="min-h-[80px] text-2xl font-black rounded-xl bg-muted/40 border-transparent resize-none"
                  placeholder="Qiziqarli sarlavha yozing..."
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1">
                  <Hash className="size-3" /> URL Slug (avto-generatsiya)
                </Label>
                <Input 
                  value={form.slug} 
                  onChange={e => setForm({...form, slug: e.target.value})} 
                  className="h-10 rounded-xl bg-muted/40 border-transparent font-mono text-sm"
                  placeholder="maqola-url-manzili" 
                />
              </div>

              {/* Excerpt */}
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Qisqa tavsif (Excerpt)</Label>
                <Textarea 
                  value={form.excerpt} 
                  onChange={e => setForm({...form, excerpt: e.target.value})}
                  className="min-h-[80px] rounded-xl bg-muted/40 border-transparent resize-none leading-relaxed font-medium"
                  placeholder="Maqolaning qisqa mazmuni – mobil ilovada ro'yxatda shu matn chiqadi..."
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">To'liq Kontent</Label>
                <Textarea 
                  value={form.content} 
                  onChange={e => setForm({...form, content: e.target.value})}
                  className="min-h-[400px] rounded-xl bg-muted/40 border-transparent resize-none leading-loose font-medium p-5 text-base"
                  placeholder="Maqola matnini shu yerga yozing. Paragraflarni bo'sh qator bilan ajrating..."
                />
              </div>
            </div>
          </ScrollArea>

          {/* Right: Mobile Preview – mirrors the real LibraryScreen exactly */}
          <div className="w-[45%] bg-slate-100 dark:bg-zinc-950 flex flex-col">
            {/* Preview tab switcher */}
            <div className="flex border-b bg-background shrink-0">
              <button 
                onClick={() => setMobileTab("feed")}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mobileTab === "feed" ? "border-b-2 border-blue-600 text-blue-600" : "text-muted-foreground"}`}
              >
                <BookOpen className="size-4" /> Kutubxona ekrani
              </button>
              <button 
                onClick={() => setMobileTab("detail")}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mobileTab === "detail" ? "border-b-2 border-blue-600 text-blue-600" : "text-muted-foreground"}`}
              >
                <Smartphone className="size-4" /> Maqola ichida
              </button>
            </div>

            {/* Phone Frame */}
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="relative w-[300px] bg-white dark:bg-zinc-900 rounded-[3rem] shadow-[0_0_0_12px_#1f2937,0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden border border-zinc-800" style={{height: "600px"}}>
                {/* Notch */}
                <div className="absolute top-0 inset-x-0 mx-auto w-32 h-6 bg-[#1f2937] rounded-b-3xl z-20" />
                
                <div className="w-full h-full bg-white dark:bg-black overflow-y-auto pt-10 pb-6">
                  {mobileTab === "feed" ? (
                    // Mirror of LibraryScreen
                    <div className="px-5">
                      <div className="pt-4 pb-4">
                        <p className="text-xl font-black text-zinc-900">Ruhiyat Kutubxonasi</p>
                        <p className="text-xs text-zinc-500 mt-1">Psixologik salomatlik uchun eng sara manbalar</p>
                      </div>
                      
                      {/* Article List – matches LibraryScreen articleItem style */}
                      <p className="text-base font-black text-zinc-900 mt-2 mb-3">Siz uchun tanlangan maqolalar</p>
                      <div className="space-y-3">
                        {/* New article preview (animated entry) */}
                        {(form.title || form.content) && (
                          <div className="flex gap-3 items-center animate-in slide-in-from-bottom-2 duration-300">
                            <div className="w-[70px] h-[70px] rounded-2xl overflow-hidden shrink-0 bg-blue-100 flex items-center justify-center">
                              {form.coverImageUrl 
                                ? <img src={form.coverImageUrl} className="w-full h-full object-cover" alt="" />
                                : <ImageIcon className="size-8 text-blue-300" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-zinc-900 leading-tight line-clamp-2">
                                {form.title || "Sarlavha shu yerda..."}
                              </p>
                              <p className="text-[10px] text-zinc-400 mt-1 font-semibold">Hozirgina • {form.category}</p>
                            </div>
                          </div>
                        )}
                        {/* Existing articles from DB */}
                        {data.filter(a => a.isPublished).slice(0, 4).map(a => (
                          <div key={a.id} className="flex gap-3 items-center">
                            <div className="w-[70px] h-[70px] rounded-2xl overflow-hidden shrink-0 bg-slate-100">
                              {a.coverImageUrl 
                                ? <img src={a.coverImageUrl} className="w-full h-full object-cover" alt="" />
                                : <div className="w-full h-full flex items-center justify-center"><FileText className="size-5 text-slate-300" /></div>}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-zinc-900 leading-tight line-clamp-2">{a.title}</p>
                              <p className="text-[10px] text-zinc-400 mt-1 font-semibold">
                                {format(new Date(a.createdAt), "d MMM", {locale: uz})} • {a.category}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // Article Detail view (matches article reading style)
                    <div className="h-full overflow-y-auto">
                      <div className="h-44 w-full bg-slate-100 relative">
                        {form.coverImageUrl 
                          ? <img src={form.coverImageUrl} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center bg-blue-50"><ImageIcon className="size-12 text-blue-200" /></div>}
                        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-white" />
                      </div>
                      <div className="px-5 -mt-2 pb-8">
                        <div className="inline-block bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-2">
                          {form.category || "Kategoriya"}
                        </div>
                        <h1 className="text-xl font-black text-zinc-900 leading-tight mb-2">
                          {form.title || "Sarlavha matn shu yerda chiqadi..."}
                        </h1>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-bold mb-4">
                          <span className="flex items-center gap-1"><Clock className="size-2.5" /> Hozirgina</span>
                          <span className="flex items-center gap-1"><Eye className="size-2.5" /> 0 ko'rishlar</span>
                        </div>
                        {form.excerpt && (
                          <p className="text-sm text-zinc-500 leading-relaxed italic mb-4 border-l-2 border-blue-300 pl-3">{form.excerpt}</p>
                        )}
                        <div className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
                          {form.content || "Maqola kontent matni shu yerga joylashadi. Har bir paragraf foydalanuvchi ekraniga moslashadi..."}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── LIST VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 pb-10">
      {/* Header Banner */}
      <div className="relative bg-[#0f172a] rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500 rounded-full filter blur-3xl translate-y-1/3 -translate-x-1/4" />
        </div>
        <div className="relative z-10">
          <Badge className="bg-blue-600 text-white mb-4 border-transparent uppercase tracking-widest text-[10px] px-3 font-bold">
            📱 Mobil → Real-time
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Maqolalar CMS</h1>
          <p className="text-white/70 max-w-xl text-base font-medium">
            Shu yerda yaratilgan va nashr etilgan har qanday maqola darhol foydalanuvchilarning mobil ilovasi "Ruhiyat Kutubxonasi" bo'limida ko'rinadi.
          </p>
          <div className="flex items-center gap-6 mt-6">
            <div className="text-center">
              <p className="text-3xl font-black">{data.length}</p>
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Jami</p>
            </div>
            <Separator orientation="vertical" className="h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-black text-emerald-400">{data.filter(a => a.isPublished).length}</p>
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Nashrda</p>
            </div>
            <Separator orientation="vertical" className="h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-black text-amber-400">{data.filter(a => !a.isPublished).length}</p>
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Qoralama</p>
            </div>
          </div>
        </div>
        <Button 
          onClick={() => openEditor()}
          className="relative z-10 w-full md:w-auto h-14 rounded-2xl bg-white text-black hover:bg-blue-50 text-base font-black px-8 shadow-xl"
        >
          <Plus className="size-5 mr-2" /> Yangi Maqola
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-background border px-6 py-3 rounded-2xl shadow-sm">
        <h2 className="font-bold flex items-center gap-2"><BookOpen className="size-5 text-blue-600" /> Barcha maqolalar ({data.length})</h2>
        <Button variant="ghost" size="icon" onClick={fetchData} className="rounded-full"><RefreshCw className="size-4" /></Button>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="flex justify-center py-16 bg-background border rounded-3xl">
          <Loader2 className="animate-spin text-muted-foreground size-10" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center bg-background border border-dashed rounded-3xl py-20 px-6">
          <FileText className="size-20 mx-auto mb-6 text-muted-foreground opacity-10" />
          <h3 className="font-black text-2xl mb-3">Maqolalar yo'q</h3>
          <p className="text-base text-muted-foreground mb-8 max-w-sm mx-auto">Birinchi maqolani yozing – u avtomatik ravishda foydalanuvchilarning mobil ilovalariga uzatiladi.</p>
          <Button onClick={() => openEditor()} className="rounded-full h-12 px-8 font-bold text-base shadow-lg">
            <Plus className="size-5 mr-2" /> Birinchi Maqola
          </Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.map(item => (
            <div key={item.id} className="bg-background rounded-[2rem] overflow-hidden shadow-sm border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
              {/* Cover */}
              <div className="h-44 w-full relative bg-slate-100 overflow-hidden shrink-0">
                {item.coverImageUrl 
                  ? <img src={item.coverImageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                  : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="size-14 text-slate-200" /></div>}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge className="bg-white/90 text-black shadow-lg backdrop-blur-sm border-transparent px-3 font-bold text-[10px] uppercase tracking-widest">
                    {item.category || "Umumiy"}
                  </Badge>
                </div>
                
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${item.isPublished ? "bg-emerald-400" : "bg-amber-400"}`} />
                    <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest">
                      {item.isPublished ? "Mobil ilovada faol" : "Qoralama"}
                    </span>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-9 rounded-full bg-white/20 text-white hover:bg-white/40 backdrop-blur-sm border-transparent">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl">
                      <DropdownMenuItem className="py-2.5 font-medium cursor-pointer rounded-xl" onClick={() => openEditor(item)}>
                        <Edit className="size-4 mr-2 text-blue-500" /> Tahrirlash
                      </DropdownMenuItem>
                      <DropdownMenuItem className="py-2.5 font-medium cursor-pointer rounded-xl" onClick={() => handleTogglePublish(item)} disabled={actionLoading === item.id}>
                        {item.isPublished 
                          ? <><Lock className="size-4 mr-2 text-amber-500" /> Mobil ilovadan yashirish</>
                          : <><Globe className="size-4 mr-2 text-emerald-500" /> Nashr etish (Mobil ilovaga)</>}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="py-2.5 font-semibold text-destructive focus:bg-destructive/10 cursor-pointer rounded-xl" onClick={() => handleDelete(item.id)} disabled={actionLoading === item.id}>
                        <Trash2 className="size-4 mr-2" /> O'chirish
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-black text-lg mb-2 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{item.title}</h3>
                {item.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{item.excerpt}</p>
                )}
                <div className="mt-auto pt-4 border-t flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" /> {format(new Date(item.createdAt), "d MMM, yyyy", {locale: uz})}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="size-3" /> {item.viewCount.toLocaleString()} o'qildi
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
