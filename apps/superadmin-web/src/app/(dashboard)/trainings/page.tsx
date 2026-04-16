"use client"

import { useEffect, useState, useCallback } from "react"
import { apiClient } from "@/lib/api-client"
import {
  GraduationCap, Plus, Loader2, Trash2, Edit, Globe, Lock,
  RefreshCw, Clock, BookOpen, BarChart2, Check, X,
  Image as ImageIcon, Video, FileText, ChevronDown, ChevronUp,
  MoreVertical, Star, Zap, TrendingUp
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

// Uses correct DB schema fields: fileUrl (not courseUrl), isPublished (not isActive), difficulty, content, videoUrl
interface Training {
  id: number
  title: string
  description: string | null
  content: string | null
  category: string | null
  duration: number | null
  imageUrl: string | null
  videoUrl: string | null
  difficulty: string
  isPublished: boolean
  createdAt: string
}

const CATEGORIES = [
  "Stressni boshqarish", "Oilaviy munosabatlar", "O'ziga ishonch", 
  "Hissiy intellekt", "Kasbiy rivojlanish", "Uyqu va dam olish",
  "Motivatsiya", "Bolalar psixologiyasi"
]

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  beginner:     { label: "Boshlang'ich", color: "text-emerald-700", bg: "bg-emerald-100", icon: Star },
  intermediate: { label: "O'rta",        color: "text-amber-700",   bg: "bg-amber-100",   icon: TrendingUp },
  advanced:     { label: "Yuqori",       color: "text-red-700",     bg: "bg-red-100",     icon: Zap },
}

function formatDuration(min: number | null) {
  if (!min) return "N/A"
  if (min < 60) return `${min} daqiqa`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}s ${m}d` : `${h} soat`
}

export default function TrainingsPage() {
  const [data, setData] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // Editor
  const [showEditor, setShowEditor] = useState(false)
  const [editing, setEditing] = useState<Training | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: "", description: "", content: "", category: "Stressni boshqarish",
    duration: "", imageUrl: "", videoUrl: "", difficulty: "beginner", isPublished: true
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient<Training[]>("/trainings").catch(() => [])
      setData(res)
    } catch {
      toast.error("Treninglarni yuklashda xatolik")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openEditor = (t?: Training) => {
    if (t) {
      setEditing(t)
      setForm({
        title: t.title, description: t.description || "", content: t.content || "",
        category: t.category || "Stressni boshqarish",
        duration: t.duration?.toString() || "",
        imageUrl: t.imageUrl || "", videoUrl: t.videoUrl || "",
        difficulty: t.difficulty || "beginner", isPublished: t.isPublished
      })
    } else {
      setEditing(null)
      setForm({ title: "", description: "", content: "", category: "Stressni boshqarish", duration: "", imageUrl: "", videoUrl: "", difficulty: "beginner", isPublished: true })
    }
    setShowEditor(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Trening nomi kiritilishi shart!"); return }
    setSaving(true)
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        content: form.content || null,
        category: form.category || null,
        duration: form.duration ? parseInt(form.duration) : null,
        imageUrl: form.imageUrl || null,
        videoUrl: form.videoUrl || null,
        difficulty: form.difficulty,
        isPublished: form.isPublished,
      }
      if (editing) {
        await apiClient(`/trainings/${editing.id}`, { method: "PATCH", body: payload })
        toast.success("Trening yangilandi!")
      } else {
        await apiClient("/trainings", { method: "POST", body: payload })
        toast.success("🎓 Yangi trening qo'shildi!")
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
    if (!confirm("Bu treningni o'chirmoqchimisiz?")) return
    setActionLoading(id)
    try {
      await apiClient(`/trainings/${id}`, { method: "DELETE" })
      toast.success("Trening o'chirildi")
      fetchData()
    } catch { toast.error("O'chirishda xatolik") }
    finally { setActionLoading(null) }
  }

  const handleTogglePublish = async (t: Training) => {
    setActionLoading(t.id)
    try {
      await apiClient(`/trainings/${t.id}`, { method: "PATCH", body: { isPublished: !t.isPublished } })
      toast.success(t.isPublished ? "Yashirildi" : "Nashr etildi!")
      fetchData()
    } catch { toast.error("Xatolik") }
    finally { setActionLoading(null) }
  }

  const filtered = data.filter(t => {
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false
    if (difficultyFilter !== "all" && t.difficulty !== difficultyFilter) return false
    return true
  })

  return (
    <div className="space-y-8 pb-10">
      {/* ── Header ── */}
      <div className="relative bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-950 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full filter blur-3xl translate-y-1/3 -translate-x-1/4" />
        </div>
        <div className="relative z-10">
          <Badge className="bg-white/10 text-white mb-4 border-transparent uppercase tracking-widest text-[10px] px-3 font-bold">
            🎓 O'quv Markazi
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Treninglar va Kurslar</h1>
          <p className="text-white/70 max-w-xl text-base font-medium">
            Psixologik rivojlanish uchun tuzilgan treninglarni yarating va foydalanuvchilarga taqdim eting. Qiyinlik darajasi va davomiyligi bilan belgilang.
          </p>
          <div className="flex items-center gap-6 mt-6">
            <div className="text-center"><p className="text-3xl font-black">{data.length}</p><p className="text-white/40 text-xs font-bold uppercase tracking-widest">Jami</p></div>
            <Separator orientation="vertical" className="h-10 bg-white/20" />
            <div className="text-center"><p className="text-3xl font-black text-emerald-400">{data.filter(t => t.isPublished).length}</p><p className="text-white/40 text-xs font-bold uppercase tracking-widest">Faol</p></div>
            <Separator orientation="vertical" className="h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-black text-cyan-300">{data.filter(t => t.difficulty === "beginner").length}</p>
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Boshlang'ich</p>
            </div>
          </div>
        </div>
        <Button onClick={() => openEditor()} className="relative z-10 w-full md:w-auto h-14 rounded-2xl bg-white text-black hover:bg-emerald-50 text-base font-black px-8 shadow-xl">
          <Plus className="size-5 mr-2" /> Yangi Trening
        </Button>
      </div>

      {/* ── Inline Editor ── */}
      {showEditor && (
        <div className="bg-background border-2 border-emerald-500/30 rounded-[2rem] overflow-hidden shadow-2xl shadow-emerald-500/10">
          <div className="bg-emerald-500/5 px-6 py-4 border-b flex items-center justify-between">
            <h3 className="font-black text-lg flex items-center gap-2">
              <GraduationCap className="size-5 text-emerald-600" />
              {editing ? "Treningni Tahrirlash" : "Yangi Trening Yaratish"}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setShowEditor(false)} className="rounded-full"><X className="size-4" /></Button>
          </div>

          <div className="p-6 grid md:grid-cols-2 gap-8">
            {/* Left */}
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
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
                  <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Qiyinlik darajasi</Label>
                  <Select value={form.difficulty} onValueChange={v => setForm({...form, difficulty: v})}>
                    <SelectTrigger className="h-12 rounded-xl bg-muted/40 border-transparent font-medium"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {Object.entries(DIFFICULTY_CONFIG).map(([k, v]) => (
                        <SelectItem key={k} value={k}><span className={`font-bold ${v.color}`}>{v.label}</span></SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Trening Nomi</Label>
                <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="M-n: Stressni boshqarishning 5 usuli" className="h-12 rounded-xl bg-muted/40 border-transparent font-bold text-lg" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1"><FileText className="size-3" /> Qisqa Tavsif</Label>
                <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Trening haqida qisqa ma'lumot – ro'yxatda ko'rinadi..." className="min-h-[90px] rounded-xl bg-muted/40 border-transparent resize-none font-medium leading-relaxed" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1"><BookOpen className="size-3" /> To'liq Kontent / Dastur</Label>
                <Textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="Trening tarkibi, o'quv dasturi, modullar ketma-ketligi..." className="min-h-[150px] rounded-xl bg-muted/40 border-transparent resize-none font-medium leading-relaxed" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1"><Clock className="size-3" /> Davomiyligi (daqiqa)</Label>
                  <Input type="number" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} placeholder="60" className="h-12 rounded-xl bg-muted/40 border-transparent font-bold font-mono" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1"><Video className="size-3" /> Video URL (ixtiyoriy)</Label>
                  <Input value={form.videoUrl} onChange={e => setForm({...form, videoUrl: e.target.value})} placeholder="https://youtube.com/..." className="h-12 rounded-xl bg-muted/40 border-transparent font-mono text-sm" />
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1"><ImageIcon className="size-3" /> Muqova Rasmi URL</Label>
                <Input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} placeholder="https://..." className="h-12 rounded-xl bg-muted/40 border-transparent" />
                {form.imageUrl && (
                  <div className="h-40 rounded-2xl overflow-hidden border bg-muted">
                    <img src={form.imageUrl} className="w-full h-full object-cover" alt="" />
                  </div>
                )}
              </div>

              {/* Live Preview Card */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Ko'rinishi Preview</p>
                <div className="bg-background border-2 border-emerald-200 dark:border-emerald-900 rounded-2xl overflow-hidden shadow-sm">
                  {form.imageUrl && (
                    <div className="h-28 overflow-hidden"><img src={form.imageUrl} className="w-full h-full object-cover" alt="" /></div>
                  )}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {form.category && <Badge variant="outline" className="text-[9px] font-bold border-emerald-200 text-emerald-700">{form.category}</Badge>}
                      {form.difficulty && (
                        <Badge className={`text-[9px] font-bold border-transparent ${DIFFICULTY_CONFIG[form.difficulty]?.bg} ${DIFFICULTY_CONFIG[form.difficulty]?.color}`}>
                          {DIFFICULTY_CONFIG[form.difficulty]?.label}
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-black text-base leading-tight">{form.title || "Trening nomi..."}</h4>
                    {form.description && <p className="text-xs text-muted-foreground line-clamp-2">{form.description}</p>}
                    <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground">
                      {form.duration && <span className="flex items-center gap-1"><Clock className="size-3" /> {formatDuration(parseInt(form.duration))}</span>}
                      <Badge className={`text-[9px] border-transparent ml-auto ${form.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>{form.isPublished ? "Faol" : "Qoralama"}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-muted/30 rounded-xl px-4 py-3">
                <Switch id="pub" checked={form.isPublished} onCheckedChange={v => setForm({...form, isPublished: v})} />
                <Label htmlFor="pub" className="font-bold cursor-pointer">
                  {form.isPublished ? "🌐 Ommaviy – Foydalanuvchilarga ko'rinadi" : "🔒 Qoralama – Yashirilgan"}
                </Label>
              </div>

              <Button onClick={handleSave} disabled={saving || !form.title} className="w-full h-14 rounded-xl font-black text-base bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">
                {saving ? <Loader2 className="size-5 animate-spin mr-2" /> : <Check className="size-5 mr-2" />}
                {editing ? "Yangilash" : "Saqlash"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3 bg-background border px-5 py-3 rounded-2xl shadow-sm">
        <GraduationCap className="size-4 text-muted-foreground shrink-0" />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setCategoryFilter("all")} className={`px-4 py-1.5 rounded-full text-xs font-bold border ${categoryFilter === "all" ? "bg-foreground text-background" : "border-muted text-muted-foreground"}`}>Barchasi ({data.length})</button>
          {CATEGORIES.filter(c => data.some(t => t.category === c)).map(c => (
            <button key={c} onClick={() => setCategoryFilter(c)} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${categoryFilter === c ? "bg-emerald-600 text-white border-emerald-600" : "border-muted text-muted-foreground hover:border-emerald-300"}`}>{c}</button>
          ))}
        </div>
        <Separator orientation="vertical" className="h-5 hidden sm:block" />
        <div className="flex gap-2">
          {Object.entries(DIFFICULTY_CONFIG).map(([k, v]) => (
            <button key={k} onClick={() => setDifficultyFilter(difficultyFilter === k ? "all" : k)} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${difficultyFilter === k ? `${v.bg} ${v.color} border-current` : "border-muted text-muted-foreground"}`}>
              {v.label}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="icon" className="ml-auto rounded-full shrink-0" onClick={fetchData}><RefreshCw className="size-4" /></Button>
      </div>

      {/* ── Training Cards ── */}
      {loading ? (
        <div className="flex justify-center py-16 bg-background border rounded-3xl"><Loader2 className="animate-spin size-10 text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center bg-background border border-dashed rounded-3xl py-20">
          <GraduationCap className="size-20 mx-auto mb-6 opacity-10" />
          <h3 className="font-black text-2xl mb-3">Treninglar yo'q</h3>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Foydalanuvchilarga psixologik rivojlanish uchun trening yarating.</p>
          <Button onClick={() => openEditor()} className="rounded-full h-12 px-8 font-bold shadow-lg bg-emerald-600 hover:bg-emerald-700">
            <Plus className="size-5 mr-2" /> Birinchi Trening
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(item => {
            const diff = DIFFICULTY_CONFIG[item.difficulty] || DIFFICULTY_CONFIG.beginner
            const DiffIcon = diff.icon
            const isExpanded = expandedId === item.id
            const isProc = actionLoading === item.id

            return (
              <div key={item.id} className={`bg-background border rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${!item.isPublished ? "opacity-70" : ""}`}>
                <div className="flex items-start gap-4 p-5">
                  {/* Cover */}
                  <div className="size-20 rounded-2xl overflow-hidden bg-emerald-50 border shrink-0">
                    {item.imageUrl
                      ? <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full flex items-center justify-center"><GraduationCap className="size-9 text-emerald-300" /></div>}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-black text-lg leading-tight">{item.title}</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {item.category && <Badge variant="outline" className="text-[9px] font-bold border-emerald-200 text-emerald-700 uppercase tracking-widest">{item.category}</Badge>}
                          <Badge className={`text-[9px] font-bold border-transparent uppercase tracking-widest ${diff.bg} ${diff.color}`}>
                            <DiffIcon className="size-2.5 mr-1" /> {diff.label}
                          </Badge>
                          <Badge className={`text-[9px] border-transparent font-bold ${item.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                            {item.isPublished ? "Faol" : "Qoralama"}
                          </Badge>
                        </div>
                        {item.description && <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{item.description}</p>}
                        <div className="flex items-center gap-4 mt-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {item.duration && <span className="flex items-center gap-1"><Clock className="size-3" /> {formatDuration(item.duration)}</span>}
                          {item.videoUrl && <span className="flex items-center gap-1 text-red-500"><Video className="size-3" /> Video bor</span>}
                          {item.content && <span className="flex items-center gap-1 text-blue-500"><BookOpen className="size-3" /> Kontent bor</span>}
                          <span>{format(new Date(item.createdAt), "d MMM yyyy", {locale: uz})}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {(item.content || item.videoUrl) && (
                          <Button variant="ghost" size="icon" className="size-9 rounded-full hover:bg-muted" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                            {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-9 rounded-full hover:bg-muted">
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl">
                            <DropdownMenuItem className="py-2.5 font-medium cursor-pointer rounded-xl" onClick={() => openEditor(item)}>
                              <Edit className="size-4 mr-2 text-emerald-500" /> Tahrirlash
                            </DropdownMenuItem>
                            <DropdownMenuItem className="py-2.5 font-medium cursor-pointer rounded-xl" onClick={() => handleTogglePublish(item)} disabled={isProc}>
                              {item.isPublished ? <><Lock className="size-4 mr-2 text-amber-500" /> Yashirish</> : <><Globe className="size-4 mr-2 text-emerald-500" /> Nashr etish</>}
                            </DropdownMenuItem>
                            {item.videoUrl && (
                              <DropdownMenuItem className="py-2.5 font-medium cursor-pointer rounded-xl" onClick={() => window.open(item.videoUrl!, "_blank")}>
                                <Video className="size-4 mr-2 text-red-500" /> Videoni ochish
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="py-2.5 text-destructive font-semibold cursor-pointer rounded-xl focus:bg-destructive/10" onClick={() => handleDelete(item.id)} disabled={isProc}>
                              <Trash2 className="size-4 mr-2" /> O'chirish
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-0 border-t bg-muted/20">
                    <div className="grid md:grid-cols-2 gap-6 pt-5">
                      {item.content && (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-black text-emerald-600 mb-2 flex items-center gap-1"><BookOpen className="size-3" /> Trening Dasturi</p>
                          <div className="bg-background rounded-xl p-4 border text-sm leading-relaxed whitespace-pre-wrap font-medium">{item.content}</div>
                        </div>
                      )}
                      {item.videoUrl && (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-black text-emerald-600 mb-2 flex items-center gap-1"><Video className="size-3" /> Video Havola</p>
                          <a href={item.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-background rounded-xl p-4 border hover:border-red-300 hover:bg-red-50 transition-colors group">
                            <div className="size-10 rounded-full bg-red-100 flex items-center justify-center shrink-0"><Video className="size-5 text-red-600" /></div>
                            <span className="text-sm font-bold text-blue-600 group-hover:underline truncate">{item.videoUrl}</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}