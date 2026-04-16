"use client"

import { useEffect, useState, useCallback } from "react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import {
  Film, Plus, Loader2, Trash2, Edit, Globe, Lock,
  Clock, Eye, PlayCircle, RefreshCw, Search, MoreVertical,
  TrendingUp, Smartphone, Check, X, ExternalLink, Image as ImageIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { uz } from "date-fns/locale"
import { toast } from "sonner"

// ⚠️ DB field is `fileUrl` NOT `videoUrl` — this was the bug!
interface VideoContent {
  id: number
  title: string
  description: string | null
  fileUrl: string        // ← correct field name from DB
  thumbnailUrl: string | null
  duration: number | null
  category: string | null
  tags: string[]
  isPublished: boolean
  viewCount: number
  createdAt: string
}

const CATEGORIES = ["Psixologiya darslari", "Meditatsiya", "Nafas mashqlari", "Stressni boshqarish", "Oilaviy munosabatlar", "Bolalar tarbiyasi", "Motivatsiya", "O'z-o'zini rivojlantirish"]

function formatDuration(sec: number | null) {
  if (!sec) return "N/A"
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${m}:${String(s).padStart(2, "0")}`
}

function getYoutubeId(url: string) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
  return match ? match[1] : null
}

function getYoutubeThumbnail(url: string) {
  const id = getYoutubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}

export default function VideosPage() {
  const [data, setData] = useState<VideoContent[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  // Editor
  const [showEditor, setShowEditor] = useState(false)
  const [editing, setEditing] = useState<VideoContent | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: "", description: "", fileUrl: "",
    thumbnailUrl: "", category: "Psixologiya darslari", isPublished: true
  })

  // Preview player
  const [previewVideoId, setPreviewVideoId] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient<PaginatedResponse<VideoContent>>("/videos", {
        params: { limit: 50, search }
      }).catch(() => ({ data: [], total: 0 }))
      setData(res.data)
      setTotal(res.total)
    } catch {
      toast.error("Video kutubxonani yuklashda xatolik")
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchData() }, [fetchData])

  const openEditor = (video?: VideoContent) => {
    if (video) {
      setEditing(video)
      setForm({
        title: video.title,
        description: video.description || "",
        fileUrl: video.fileUrl,        // ← uses correct DB field
        thumbnailUrl: video.thumbnailUrl || "",
        category: video.category || "Psixologiya darslari",
        isPublished: video.isPublished
      })
    } else {
      setEditing(null)
      setForm({ title: "", description: "", fileUrl: "", thumbnailUrl: "", category: "Psixologiya darslari", isPublished: true })
    }
    setShowEditor(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.fileUrl) {
      toast.error("Sarlavha va video fayl URL kiritilishi shart!")
      return
    }
    setSaving(true)
    // Auto-detect YouTube thumbnail if not provided
    const autoThumb = form.thumbnailUrl || getYoutubeThumbnail(form.fileUrl) || ""
    try {
      const payload = { ...form, thumbnailUrl: autoThumb || null }
      if (editing) {
        await apiClient(`/videos/${editing.id}`, { method: "PATCH", body: payload })
        toast.success("Video yangilandi!")
      } else {
        await apiClient("/videos", { method: "POST", body: payload })
        toast.success("🎬 Yangi video qo'shildi! Mobil ilovada ko'rinadi.")
      }
      setShowEditor(false)
      fetchData()
    } catch (e: any) {
      toast.error(e.message || "Xatolik yuz berdi")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Bu videoni o'chirmoqchimisiz?")) return
    setActionLoading(id)
    try {
      await apiClient(`/videos/${id}`, { method: "DELETE" })
      toast.success("Video o'chirildi")
      fetchData()
    } catch { toast.error("O'chirishda xatolik") }
    finally { setActionLoading(null) }
  }

  const handleTogglePublish = async (v: VideoContent) => {
    setActionLoading(v.id)
    try {
      await apiClient(`/videos/${v.id}`, { method: "PATCH", body: { isPublished: !v.isPublished } })
      toast.success(v.isPublished ? "Yashirildi" : "Nashr etildi – Mobil ilovada ko'rinadi!")
      fetchData()
    } catch { toast.error("Xatolik") }
    finally { setActionLoading(null) }
  }

  const filtered = data.filter(v => categoryFilter === "all" || v.category === categoryFilter)

  return (
    <div className="space-y-8 pb-10">
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-red-900/20 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute -right-10 -bottom-10 opacity-20 pointer-events-none"><Film className="w-72 h-72" /></div>
        <div className="relative z-10">
          <Badge className="bg-white/20 text-white mb-4 border-transparent uppercase tracking-widest text-[10px] px-3 font-bold">
            📱 Mobil → Real-time | Videodarslar
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Video Kutubxona</h1>
          <p className="text-white/80 max-w-xl text-base font-medium">
            Videolar shu yerdan qo'shiladi va darhol foydalanuvchilarning mobil ilovasi "Videodarslar" bo'limida paydo bo'ladi. YouTube va to'g'ridan-to'g'ri MP4 fayllari qo'llab-quvvatlanadi.
          </p>
          <div className="flex items-center gap-6 mt-6">
            <div className="text-center"><p className="text-3xl font-black">{total}</p><p className="text-white/50 text-xs font-bold uppercase tracking-widest">Jami</p></div>
            <Separator orientation="vertical" className="h-10 bg-white/30" />
            <div className="text-center"><p className="text-3xl font-black text-emerald-300">{data.filter(v => v.isPublished).length}</p><p className="text-white/50 text-xs font-bold uppercase tracking-widest">Faol</p></div>
            <Separator orientation="vertical" className="h-10 bg-white/30" />
            <div className="text-center"><p className="text-3xl font-black text-white/60">{data.reduce((s, v) => s + v.viewCount, 0).toLocaleString()}</p><p className="text-white/50 text-xs font-bold uppercase tracking-widest">Ko'rishlar</p></div>
          </div>
        </div>
        <Button onClick={() => openEditor()} className="relative z-10 w-full md:w-auto h-14 rounded-2xl bg-white text-black hover:bg-white/90 text-base font-black px-8 shadow-xl">
          <Plus className="size-5 mr-2" /> Video Qo'shish
        </Button>
      </div>

      {/* ── Inline Editor ── */}
      {showEditor && (
        <div className="bg-background border-2 border-red-500/30 rounded-[2rem] overflow-hidden shadow-xl shadow-red-500/10">
          <div className="bg-red-500/5 px-6 py-4 border-b flex items-center justify-between">
            <h3 className="font-black text-lg flex items-center gap-2">
              <Film className="size-5 text-red-500" />
              {editing ? "Videoni Tahrirlash" : "Yangi Video Qo'shish"}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setShowEditor(false)} className="rounded-full"><X className="size-4" /></Button>
          </div>

          <div className="p-6 grid md:grid-cols-2 gap-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Kategoriya</Label>
                <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                  <SelectTrigger className="h-12 rounded-xl bg-muted/40 border-transparent font-medium"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Video nomi (Sarlavha)</Label>
                <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="M-n: Stress boshqaruvi darsi" className="h-12 rounded-xl bg-muted/40 border-transparent font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Tavsif</Label>
                <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Video haqida qisqacha..." className="min-h-[100px] rounded-xl bg-muted/40 border-transparent resize-none font-medium" />
              </div>
              <div className="flex items-center gap-3 bg-muted/30 rounded-xl px-4 py-3">
                <Switch id="pub" checked={form.isPublished} onCheckedChange={v => setForm({...form, isPublished: v})} />
                <Label htmlFor="pub" className="font-bold cursor-pointer">
                  {form.isPublished ? "📱 Ommaviy – Mobil ilovada ko'rinadi" : "🔒 Qoralama – Yashirilgan"}
                </Label>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">🎬 Video URL (YouTube yoki MP4)</Label>
                <Input value={form.fileUrl} onChange={e => setForm({...form, fileUrl: e.target.value})} placeholder="https://youtube.com/watch?v=... yoki https://.../video.mp4" className="h-12 rounded-xl bg-muted/40 border-transparent font-mono text-sm" />
                
                {/* YouTube thumbnail auto-preview */}
                {form.fileUrl && (() => {
                  const ytThumb = getYoutubeThumbnail(form.fileUrl)
                  if (ytThumb) return (
                    <div className="relative rounded-2xl overflow-hidden border">
                      <img src={ytThumb} className="w-full h-40 object-cover" alt="" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="size-16 rounded-full bg-red-600 flex items-center justify-center shadow-xl">
                          <PlayCircle className="size-8 text-white" />
                        </div>
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <a href={form.fileUrl} target="_blank" rel="noopener noreferrer" className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-black/80 transition-colors">
                          <ExternalLink className="size-3" /> Ochish
                        </a>
                      </div>
                    </div>
                  )
                  return null
                })()}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                  Thumbnail URL <span className="normal-case font-normal text-muted-foreground">(ixtiyoriy – YouTube uchun avto)</span>
                </Label>
                <Input value={form.thumbnailUrl} onChange={e => setForm({...form, thumbnailUrl: e.target.value})} placeholder="https://..." className="h-12 rounded-xl bg-muted/40 border-transparent" />
                {form.thumbnailUrl && !getYoutubeThumbnail(form.fileUrl) && (
                  <div className="h-24 rounded-2xl overflow-hidden border bg-muted">
                    <img src={form.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                  </div>
                )}
              </div>

              <Button onClick={handleSave} disabled={saving || !form.title || !form.fileUrl} className="w-full h-14 rounded-xl font-black text-base bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20">
                {saving ? <Loader2 className="size-5 animate-spin mr-2" /> : <Check className="size-5 mr-2" />}
                {editing ? "Yangilash" : "Saqlash va Nashr Etish"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3 bg-background border px-5 py-3 rounded-2xl shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Video sarlavhasi bo'yicha qidirish..." className="pl-10 border-none bg-transparent shadow-none h-10 focus-visible:ring-0" />
        </div>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setCategoryFilter("all")} className={`px-4 py-1.5 rounded-full text-xs font-bold border ${categoryFilter === "all" ? "bg-foreground text-background" : "border-muted text-muted-foreground hover:border-foreground/50"}`}>Barchasi</button>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategoryFilter(c)} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${categoryFilter === c ? "bg-red-600 text-white border-red-600" : "border-muted text-muted-foreground hover:border-red-300"}`}>{c}</button>
          ))}
        </div>
        <Button variant="ghost" size="icon" className="ml-auto rounded-full shrink-0" onClick={fetchData}><RefreshCw className="size-4" /></Button>
      </div>

      {/* ── Video Grid (YouTube / MP4 style) ── */}
      {loading ? (
        <div className="flex justify-center py-16 bg-background border rounded-3xl"><Loader2 className="animate-spin size-10 text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center bg-background border border-dashed rounded-3xl py-20">
          <Film className="size-20 mx-auto mb-6 opacity-10" />
          <h3 className="font-black text-2xl mb-3">Videolar yo'q</h3>
          <p className="text-muted-foreground mb-8">Yangi video qo'shing va u mobil ilovada darhol ko'rinadi.</p>
          <Button onClick={() => openEditor()} className="rounded-full h-12 px-8 font-bold shadow-lg"><Plus className="size-5 mr-2" /> Video Qo'shish</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(item => {
            const ytThumb = getYoutubeThumbnail(item.fileUrl)
            const thumb = item.thumbnailUrl || ytThumb
            const isProc = actionLoading === item.id
            const isPlaying = previewVideoId === item.id

            return (
              <div key={item.id} className="group bg-background border rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
                {/* Thumbnail */}
                <div className="relative h-48 bg-zinc-900 overflow-hidden cursor-pointer" onClick={() => setPreviewVideoId(isPlaying ? null : item.id)}>
                  {isPlaying && getYoutubeId(item.fileUrl) ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${getYoutubeId(item.fileUrl)}?autoplay=1`}
                      className="w-full h-full"
                      allow="autoplay; fullscreen"
                      frameBorder="0"
                    />
                  ) : (
                    <>
                      {thumb
                        ? <img src={thumb} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                        : <div className="w-full h-full flex items-center justify-center"><Film className="size-16 text-white/10" /></div>}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="size-14 rounded-full bg-white/90 shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <PlayCircle className="size-8 text-red-600" />
                        </div>
                      </div>
                      {item.duration && (
                        <div className="absolute bottom-3 right-3 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                          {formatDuration(item.duration)}
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Status + Menu */}
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
                    <Badge className={`text-[9px] uppercase tracking-widest font-bold border-transparent ${item.isPublished ? "bg-red-600 text-white" : "bg-white/20 text-white backdrop-blur-md"}`}>
                      {item.isPublished ? "📱 Faol" : "Yashirin"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="size-8 rounded-full bg-white/20 text-white hover:bg-white/40 backdrop-blur-sm border-transparent">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2 shadow-xl">
                        <DropdownMenuItem className="py-2.5 font-medium cursor-pointer rounded-xl" onClick={() => openEditor(item)}>
                          <Edit className="size-4 mr-2 text-blue-500" /> Tahrirlash
                        </DropdownMenuItem>
                        <DropdownMenuItem className="py-2.5 font-medium cursor-pointer rounded-xl" onClick={() => window.open(item.fileUrl, "_blank")}>
                          <ExternalLink className="size-4 mr-2 text-muted-foreground" /> Ochish
                        </DropdownMenuItem>
                        <DropdownMenuItem className="py-2.5 font-medium cursor-pointer rounded-xl" onClick={() => handleTogglePublish(item)} disabled={isProc}>
                          {item.isPublished ? <><Lock className="size-4 mr-2 text-amber-500" /> Yashirish</> : <><Globe className="size-4 mr-2 text-emerald-500" /> Nashr etish</>}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="py-2.5 text-destructive font-semibold cursor-pointer rounded-xl focus:bg-destructive/10" onClick={() => handleDelete(item.id)} disabled={isProc}>
                          <Trash2 className="size-4 mr-2" /> O'chirish
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 flex flex-col flex-1">
                  {item.category && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">{item.category}</span>
                  )}
                  <h3 className="font-black text-base leading-tight mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">{item.title}</h3>
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.description}</p>
                  )}
                  <div className="mt-auto pt-4 border-t flex items-center justify-between text-xs font-bold text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="size-3" /> {formatDuration(item.duration)}</span>
                    <span className="flex items-center gap-1 text-red-500"><TrendingUp className="size-3" /> {item.viewCount.toLocaleString()} ko'rish</span>
                    <span>{format(new Date(item.createdAt), "d MMM", {locale: uz})}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}