"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import {
  Headphones, Plus, Loader2, Music, Trash2, Edit,
  Globe, Lock, Clock, PlayCircle, PauseCircle, Volume2,
  RefreshCw, Search, MoreVertical, Mic, TrendingUp, Check, X
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

interface AudioContent {
  id: number
  title: string
  description: string | null
  fileUrl: string
  coverImageUrl: string | null
  duration: number | null
  category: string | null
  tags: string[]
  isPublished: boolean
  playCount: number
  createdAt: string
}

const CATEGORIES = ["Meditatsiya", "Nafas mashqlari", "Ruhiy tinchlantirish", "Uyqu uchun", "Motivatsiya", "Tashvish oldini olish", "Stressni kamaytirish"]

const COVER_DEFAULTS = [
  "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop",
]

function formatDuration(seconds: number | null) {
  if (!seconds) return "N/A"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export default function AudioPage() {
  const [data, setData] = useState<AudioContent[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  // Editor
  const [showEditor, setShowEditor] = useState(false)
  const [editing, setEditing] = useState<AudioContent | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: "", description: "", fileUrl: "",
    coverImageUrl: "", category: "Meditatsiya", isPublished: true
  })

  // Player
  const [playingId, setPlayingId] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient<PaginatedResponse<AudioContent>>("/audio", {
        params: { limit: 50, search }
      }).catch(() => ({ data: [], total: 0 }))
      setData(res.data)
      setTotal(res.total)
    } catch {
      toast.error("Audio kutubxonani yuklashda xatolik")
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchData() }, [fetchData])

  const openEditor = (audio?: AudioContent) => {
    if (audio) {
      setEditing(audio)
      setForm({
        title: audio.title,
        description: audio.description || "",
        fileUrl: audio.fileUrl,
        coverImageUrl: audio.coverImageUrl || "",
        category: audio.category || "Meditatsiya",
        isPublished: audio.isPublished
      })
    } else {
      setEditing(null)
      setForm({ title: "", description: "", fileUrl: "", coverImageUrl: "", category: "Meditatsiya", isPublished: true })
    }
    setShowEditor(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.fileUrl) {
      toast.error("Sarlavha va audio fayl URL kiritilishi shart!")
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await apiClient(`/audio/${editing.id}`, { method: "PATCH", body: form })
        toast.success("Audio yangilandi!")
      } else {
        await apiClient("/audio", { method: "POST", body: form })
        toast.success("🎵 Yangi audio qo'shildi! Mobil ilovada ko'rinadi.")
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
    if (!confirm("Bu audioni o'chirmoqchimisiz?")) return
    setActionLoading(id)
    try {
      await apiClient(`/audio/${id}`, { method: "DELETE" })
      toast.success("Audio o'chirildi")
      fetchData()
    } catch { toast.error("O'chirishda xatolik") }
    finally { setActionLoading(null) }
  }

  const handleTogglePublish = async (a: AudioContent) => {
    setActionLoading(a.id)
    try {
      await apiClient(`/audio/${a.id}`, { method: "PATCH", body: { isPublished: !a.isPublished } })
      toast.success(a.isPublished ? "Yashirildi" : "Nashr etildi!")
      fetchData()
    } catch { toast.error("Xatolik") }
    finally { setActionLoading(null) }
  }

  const handlePlay = (audio: AudioContent) => {
    if (playingId === audio.id) {
      audioRef.current?.pause()
      setPlayingId(null)
    } else {
      if (audioRef.current) audioRef.current.pause()
      audioRef.current = new Audio(audio.fileUrl)
      audioRef.current.play().catch(() => toast.error("Audio faylni yuklashda muammo yuz berdi"))
      audioRef.current.onended = () => setPlayingId(null)
      setPlayingId(audio.id)
    }
  }

  const filtered = data.filter(a => {
    if (categoryFilter !== "all" && a.category !== categoryFilter) return false
    return true
  })

  const publishedCount = data.filter(a => a.isPublished).length
  const totalPlays = data.reduce((sum, a) => sum + a.playCount, 0)

  return (
    <div className="space-y-8 pb-10">
      {/* ── Header ── */}
      <div className="relative bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute inset-0 opacity-30 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white/5 blur-xl"
              style={{ width: `${80 + i * 30}px`, height: `${80 + i * 30}px`, top: `${(i * 37) % 80}%`, left: `${(i * 53) % 90}%`, animationDelay: `${i * 0.5}s` }}
            />
          ))}
        </div>
        <div className="relative z-10">
          <Badge className="bg-white/10 hover:bg-white/20 text-white mb-4 border-transparent uppercase tracking-widest text-[10px] px-3 font-bold">
            🎧 Audio CMS
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Audio Kutubxona</h1>
          <p className="text-white/70 max-w-xl text-base font-medium">
            Ruhiyat ilovasidagi meditatsiya, nafas mashqlari va psixologik audio darslarni shu yerdan real vaqtda boshqaring.
          </p>
          <div className="flex items-center gap-6 mt-6">
            <div className="text-center"><p className="text-3xl font-black">{total}</p><p className="text-white/40 text-xs font-bold uppercase tracking-widest">Jami audio</p></div>
            <Separator orientation="vertical" className="h-10 bg-white/20" />
            <div className="text-center"><p className="text-3xl font-black text-emerald-400">{publishedCount}</p><p className="text-white/40 text-xs font-bold uppercase tracking-widest">Faol</p></div>
            <Separator orientation="vertical" className="h-10 bg-white/20" />
            <div className="text-center"><p className="text-3xl font-black text-violet-300">{totalPlays.toLocaleString()}</p><p className="text-white/40 text-xs font-bold uppercase tracking-widest">Umumiy tinglanish</p></div>
          </div>
        </div>
        <Button
          onClick={() => openEditor()}
          className="relative z-10 w-full md:w-auto h-14 rounded-2xl bg-white text-black hover:bg-white/90 text-base font-black px-8 shadow-xl"
        >
          <Plus className="size-5 mr-2" /> Yangi Audio
        </Button>
      </div>

      {/* ── Inline Editor ── */}
      {showEditor && (
        <div className="bg-background border-2 border-violet-500/30 rounded-[2rem] overflow-hidden shadow-xl shadow-violet-500/10">
          <div className="bg-violet-500/5 px-6 py-4 border-b flex items-center justify-between">
            <h3 className="font-black text-lg flex items-center gap-2">
              <Mic className="size-5 text-violet-600" />
              {editing ? "Audioni Tahrirlash" : "Yangi Audio Qo'shish"}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setShowEditor(false)} className="rounded-full text-muted-foreground"><X className="size-4" /></Button>
          </div>

          <div className="p-6 grid md:grid-cols-2 gap-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Sarlavha</Label>
                <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="M-n: Tonggi meditatsiya" className="h-12 rounded-xl bg-muted/40 border-transparent font-bold" />
              </div>

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
                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Tavsif</Label>
                <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Audio haqida qisqacha ma'lumot..." className="min-h-[100px] rounded-xl bg-muted/40 border-transparent resize-none font-medium" />
              </div>

              <div className="flex items-center gap-3 bg-muted/30 rounded-xl px-4 py-3">
                <Switch id="pub" checked={form.isPublished} onCheckedChange={v => setForm({...form, isPublished: v})} />
                <Label htmlFor="pub" className="font-bold cursor-pointer">
                  {form.isPublished ? "🌍 Ommaviy – Mobil ilovada ko'rinadi" : "🔒 Qoralama – Yashirilgan"}
                </Label>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">🎵 Audio fayl URL (MP3/OGG)</Label>
                <Input value={form.fileUrl} onChange={e => setForm({...form, fileUrl: e.target.value})} placeholder="https://storage.example.com/audio.mp3" className="h-12 rounded-xl bg-muted/40 border-transparent font-mono text-sm" />
                {form.fileUrl && (
                  <div className="bg-black/90 rounded-2xl p-4 flex items-center gap-3">
                    <button onClick={() => { const a = new Audio(form.fileUrl); a.play() }} className="size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                      <PlayCircle className="size-5" />
                    </button>
                    <div className="flex-1">
                      <div className="h-1 bg-white/20 rounded-full overflow-hidden"><div className="h-full w-1/3 bg-violet-500 rounded-full" /></div>
                    </div>
                    <Volume2 className="size-4 text-white/40" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Muqova rasmi URL</Label>
                <Input value={form.coverImageUrl} onChange={e => setForm({...form, coverImageUrl: e.target.value})} placeholder="https://..." className="h-12 rounded-xl bg-muted/40 border-transparent" />
                {!form.coverImageUrl && (
                  <div className="flex gap-2 flex-wrap">
                    {COVER_DEFAULTS.map((url, i) => (
                      <button key={i} onClick={() => setForm({...form, coverImageUrl: url})} className="relative size-14 rounded-xl overflow-hidden border-2 border-transparent hover:border-violet-500 transition-all">
                        <img src={url} className="w-full h-full object-cover" alt="" />
                      </button>
                    ))}
                  </div>
                )}
                {form.coverImageUrl && (
                  <div className="h-32 rounded-2xl overflow-hidden border bg-muted">
                    <img src={form.coverImageUrl} className="w-full h-full object-cover" alt="Muqova" />
                  </div>
                )}
              </div>

              <Button
                onClick={handleSave}
                disabled={saving || !form.title || !form.fileUrl}
                className="w-full h-14 rounded-xl font-black text-base bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/20"
              >
                {saving ? <Loader2 className="size-5 animate-spin mr-2" /> : <Check className="size-5 mr-2" />}
                {editing ? "Yangilash" : "Saqlash va Nashr Etish"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Filters & Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3 bg-background border px-5 py-3 rounded-2xl shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Audio sarlavhasi bo'yicha qidirish..." className="pl-10 border-none bg-transparent shadow-none h-10 focus-visible:ring-0" />
        </div>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setCategoryFilter("all")} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${categoryFilter === "all" ? "bg-foreground text-background border-foreground" : "border-muted text-muted-foreground hover:border-foreground/50"}`}>Barchasi</button>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategoryFilter(c)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${categoryFilter === c ? "bg-violet-600 text-white border-violet-600" : "border-muted text-muted-foreground hover:border-violet-300"}`}>{c}</button>
          ))}
        </div>
        <Button variant="ghost" size="icon" className="ml-auto rounded-full shrink-0" onClick={fetchData}><RefreshCw className="size-4" /></Button>
      </div>

      {/* ── Audio Grid ── */}
      {loading ? (
        <div className="flex justify-center py-16 bg-background border rounded-3xl"><Loader2 className="animate-spin text-muted-foreground size-10" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center bg-background border border-dashed rounded-3xl py-20">
          <Headphones className="size-20 mx-auto mb-6 opacity-10" />
          <h3 className="font-black text-2xl mb-3">Audio topilmadi</h3>
          <p className="text-muted-foreground mb-8">Yangi audio material qo'shing yoki filtrni o'zgartiring.</p>
          <Button onClick={() => openEditor()} className="rounded-full h-12 px-8 font-bold shadow-lg"><Plus className="size-5 mr-2" /> Audio Qo'shish</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(item => {
            const isPlaying = playingId === item.id
            const isProc = actionLoading === item.id

            return (
              <div key={item.id} className="group bg-background border rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
                {/* Cover Art */}
                <div className="relative h-44 bg-gradient-to-br from-violet-900 to-indigo-900 overflow-hidden">
                  {item.coverImageUrl
                    ? <img src={item.coverImageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" alt="" />
                    : <div className="w-full h-full flex items-center justify-center"><Music className="size-16 text-white/20" /></div>}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Play Button */}
                  <button
                    onClick={() => handlePlay(item)}
                    className="absolute bottom-4 left-4 size-12 rounded-full bg-white shadow-xl shadow-black/30 flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    {isPlaying
                      ? <PauseCircle className="size-7 text-violet-600" />
                      : <PlayCircle className="size-7 text-violet-600" />}
                  </button>

                  {/* Status + Actions */}
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                    <Badge className={`text-[9px] uppercase tracking-widest font-bold px-2.5 border-transparent ${item.isPublished ? "bg-emerald-500 text-white" : "bg-white/20 text-white backdrop-blur-md"}`}>
                      {item.isPublished ? "Faol" : "Yashirin"}
                    </Badge>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 rounded-full bg-white/20 text-white hover:bg-white/40 backdrop-blur-sm border-transparent">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2 shadow-xl">
                        <DropdownMenuItem className="py-2.5 font-medium cursor-pointer rounded-xl" onClick={() => openEditor(item)}>
                          <Edit className="size-4 mr-2 text-violet-500" /> Tahrirlash
                        </DropdownMenuItem>
                        <DropdownMenuItem className="py-2.5 font-medium cursor-pointer rounded-xl" onClick={() => handleTogglePublish(item)} disabled={isProc}>
                          {item.isPublished
                            ? <><Lock className="size-4 mr-2 text-amber-500" /> Yashirish</>
                            : <><Globe className="size-4 mr-2 text-emerald-500" /> Nashr etish</>}
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
                    <span className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-1">{item.category}</span>
                  )}
                  <h3 className="font-black text-base leading-tight mb-2 line-clamp-2 group-hover:text-violet-600 transition-colors">{item.title}</h3>
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{item.description}</p>
                  )}
                  <div className="mt-auto pt-4 border-t flex items-center justify-between text-xs font-bold text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="size-3" /> {formatDuration(item.duration)}</span>
                    <span className="flex items-center gap-1 text-violet-500"><TrendingUp className="size-3" /> {item.playCount.toLocaleString()} marta</span>
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