"use client"

import { useEffect, useState, useCallback } from "react"
import { apiClient } from "@/lib/api-client"
import {
  Brain, Plus, Loader2, Trash2, Edit, Globe, Lock,
  RefreshCw, FileText, ClipboardList, Check, X,
  Image as ImageIcon, BookOpen, Eye, EyeOff, MoreVertical, ChevronDown, ChevronUp
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

interface ProjectiveMethod {
  id: number
  title: string
  description: string | null
  instructions: string | null
  imageUrl: string | null
  category: string | null
  isPublished: boolean
  createdAt: string
}

const CATEGORIES = [
  "Rasm tahlili", "So'z assotsiatsiyasi", "Hikoya to'ldirish", 
  "Ranlar testi", "Grafik metodika", "Rolevaya o'yin", "Vizual proyeksiya", "Simvollar testi"
]

const CATEGORY_ICONS: Record<string, string> = {
  "Rasm tahlili": "🖼️",
  "So'z assotsiatsiyasi": "💬",
  "Hikoya to'ldirish": "📖",
  "Ranlar testi": "🎨",
  "Grafik metodika": "✏️",
  "Rolevaya o'yin": "🎭",
  "Vizual proyeksiya": "🔮",
  "Simvollar testi": "🔣",
}

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&auto=format",
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=600&auto=format",
  "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&auto=format",
  "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600&auto=format",
]

export default function ProjectiveMethodsPage() {
  const [data, setData] = useState<ProjectiveMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // Editor
  const [showEditor, setShowEditor] = useState(false)
  const [editing, setEditing] = useState<ProjectiveMethod | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: "", description: "", instructions: "",
    imageUrl: "", category: "Rasm tahlili", isPublished: true
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient<ProjectiveMethod[]>("/projective-methods").catch(() => [])
      setData(res)
    } catch {
      toast.error("Proyektiv metodikalarni yuklashda xatolik")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openEditor = (method?: ProjectiveMethod) => {
    if (method) {
      setEditing(method)
      setForm({
        title: method.title,
        description: method.description || "",
        instructions: method.instructions || "",
        imageUrl: method.imageUrl || "",
        category: method.category || "Rasm tahlili",
        isPublished: method.isPublished
      })
    } else {
      setEditing(null)
      setForm({ title: "", description: "", instructions: "", imageUrl: "", category: "Rasm tahlili", isPublished: true })
    }
    setShowEditor(true)
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Metodika nomi kiritilishi shart!"); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        imageUrl: form.imageUrl || null,
        category: form.category || null,
        description: form.description || null,
        instructions: form.instructions || null,
      }
      if (editing) {
        await apiClient(`/projective-methods/${editing.id}`, { method: "PATCH", body: payload })
        toast.success("Metodika yangilandi!")
      } else {
        await apiClient("/projective-methods", { method: "POST", body: payload })
        toast.success("🧠 Yangi proyektiv metodika qo'shildi!")
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
    if (!confirm("Bu metodikani o'chirmoqchimisiz?")) return
    setActionLoading(id)
    try {
      await apiClient(`/projective-methods/${id}`, { method: "DELETE" })
      toast.success("Metodika o'chirildi")
      fetchData()
    } catch { toast.error("O'chirishda xatolik") }
    finally { setActionLoading(null) }
  }

  const handleTogglePublish = async (m: ProjectiveMethod) => {
    setActionLoading(m.id)
    try {
      await apiClient(`/projective-methods/${m.id}`, { method: "PATCH", body: { isPublished: !m.isPublished } })
      toast.success(m.isPublished ? "Yashirildi" : "Nashr etildi!")
      fetchData()
    } catch { toast.error("Xatolik") }
    finally { setActionLoading(null) }
  }

  const filtered = data.filter(m => categoryFilter === "all" || m.category === categoryFilter)

  return (
    <div className="space-y-8 pb-10">
      {/* ── Header ── */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 right-10 w-80 h-80 bg-indigo-600/20 rounded-full filter blur-3xl -translate-y-1/2" />
          <div className="absolute -bottom-10 left-10 w-60 h-60 bg-purple-600/20 rounded-full filter blur-3xl" />
        </div>
        <div className="relative z-10">
          <Badge className="bg-white/10 text-white mb-4 border-transparent uppercase tracking-widest text-[10px] px-3 font-bold">
            🔮 Psixodiagnostika
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Proyektiv Metodikalar</h1>
          <p className="text-white/70 max-w-xl text-base font-medium">
            Foydalanuvchilarning ichki psixologik holatini rasm, rang va assotsiatsiyalar orqali o'rganuvchi professional diagnostika metodikalari.
          </p>
          <div className="flex items-center gap-6 mt-6">
            <div className="text-center"><p className="text-3xl font-black">{data.length}</p><p className="text-white/40 text-xs font-bold uppercase tracking-widest">Jami</p></div>
            <Separator orientation="vertical" className="h-10 bg-white/20" />
            <div className="text-center"><p className="text-3xl font-black text-emerald-400">{data.filter(m => m.isPublished).length}</p><p className="text-white/40 text-xs font-bold uppercase tracking-widest">Faol</p></div>
            <Separator orientation="vertical" className="h-10 bg-white/20" />
            <div className="text-center"><p className="text-3xl font-black text-indigo-300">{new Set(data.map(m => m.category).filter(Boolean)).size}</p><p className="text-white/40 text-xs font-bold uppercase tracking-widest">Kategoriya</p></div>
          </div>
        </div>
        <Button onClick={() => openEditor()} className="relative z-10 w-full md:w-auto h-14 rounded-2xl bg-white text-black hover:bg-indigo-50 text-base font-black px-8 shadow-xl">
          <Plus className="size-5 mr-2" /> Yangi Metodika
        </Button>
      </div>

      {/* ── Inline Editor ── */}
      {showEditor && (
        <div className="bg-background border-2 border-indigo-500/30 rounded-[2rem] overflow-hidden shadow-2xl shadow-indigo-500/10">
          <div className="bg-indigo-500/5 px-6 py-4 border-b flex items-center justify-between">
            <h3 className="font-black text-lg flex items-center gap-2">
              <Brain className="size-5 text-indigo-600" />
              {editing ? "Metodikani Tahrirlash" : "Yangi Proyektiv Metodika"}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setShowEditor(false)} className="rounded-full"><X className="size-4" /></Button>
          </div>

          <div className="p-6 grid md:grid-cols-2 gap-8">
            {/* Left column */}
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Kategoriya</Label>
                  <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                    <SelectTrigger className="h-12 rounded-xl bg-muted/40 border-transparent font-medium"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{CATEGORY_ICONS[c]} {c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Metodika Nomi</Label>
                  <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="M-n: Daraxt testi" className="h-12 rounded-xl bg-muted/40 border-transparent font-bold" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1">
                  <FileText className="size-3" /> Tavsif (Psixologga ko'rinadigan izoh)
                </Label>
                <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Metodikaning vazifasi va nima aniqlashi haqida..." className="min-h-[100px] rounded-xl bg-muted/40 border-transparent resize-none font-medium leading-relaxed" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1">
                  <ClipboardList className="size-3" /> Yo'riqnoma (Foydalanuvchiga ko'rsatiladigan qadamlar)
                </Label>
                <Textarea value={form.instructions} onChange={e => setForm({...form, instructions: e.target.value})} placeholder="1. Rasm chizing..&#10;2. Natijani tahlil qiling...&#10;3. ..." className="min-h-[180px] rounded-xl bg-muted/40 border-transparent resize-none font-medium leading-relaxed" />
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1">
                  <ImageIcon className="size-3" /> Metodika Rasmi URL
                </Label>
                <Input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} placeholder="https://..." className="h-12 rounded-xl bg-muted/40 border-transparent" />
                
                {/* Sample image picker */}
                {!form.imageUrl && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Namuna rasmlar</p>
                    <div className="grid grid-cols-4 gap-2">
                      {SAMPLE_IMAGES.map((url, i) => (
                        <button key={i} onClick={() => setForm({...form, imageUrl: url})} className="h-16 rounded-xl overflow-hidden border-2 border-transparent hover:border-indigo-500 transition-all">
                          <img src={url} className="w-full h-full object-cover" alt="" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {form.imageUrl && (
                  <div className="relative h-48 rounded-2xl overflow-hidden border bg-muted group">
                    <img src={form.imageUrl} className="w-full h-full object-cover" alt="" />
                    <button onClick={() => setForm({...form, imageUrl: ""})} className="absolute top-3 right-3 size-8 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80">
                      <X className="size-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Preview Card */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Ko'rinishi Preview</p>
                <div className="bg-background border-2 border-indigo-500/20 rounded-2xl overflow-hidden shadow-sm">
                  {form.imageUrl && (
                    <div className="h-32 overflow-hidden">
                      <img src={form.imageUrl} className="w-full h-full object-cover" alt="" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{CATEGORY_ICONS[form.category] || "🔮"}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{form.category}</span>
                    </div>
                    <h4 className="font-black text-base">{form.title || "Metodika nomi..."}</h4>
                    {form.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{form.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      {form.instructions && <Badge variant="outline" className="text-[9px] border-indigo-200 text-indigo-600"><ClipboardList className="size-2.5 mr-1" /> Yo'riqnoma bor</Badge>}
                      <Badge className={`text-[9px] border-transparent ${form.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>{form.isPublished ? "Faol" : "Qoralama"}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-muted/30 rounded-xl px-4 py-3">
                <Switch id="pub" checked={form.isPublished} onCheckedChange={v => setForm({...form, isPublished: v})} />
                <Label htmlFor="pub" className="font-bold cursor-pointer">
                  {form.isPublished ? "🌐 Ommaviy – Ko'rinadi" : "🔒 Qoralama – Yashirilgan"}
                </Label>
              </div>

              <Button onClick={handleSave} disabled={saving || !form.title} className="w-full h-14 rounded-xl font-black text-base bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
                {saving ? <Loader2 className="size-5 animate-spin mr-2" /> : <Check className="size-5 mr-2" />}
                {editing ? "Yangilash" : "Saqlash"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Category Filters ── */}
      <div className="flex flex-wrap items-center gap-3 bg-background border px-5 py-3 rounded-2xl shadow-sm">
        <Brain className="size-4 text-muted-foreground shrink-0" />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setCategoryFilter("all")} className={`px-4 py-1.5 rounded-full text-xs font-bold border ${categoryFilter === "all" ? "bg-foreground text-background" : "border-muted text-muted-foreground hover:border-foreground/50"}`}>
            Barchasi ({data.length})
          </button>
          {CATEGORIES.map(c => {
            const count = data.filter(m => m.category === c).length
            if (!count) return null
            return (
              <button key={c} onClick={() => setCategoryFilter(c)} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${categoryFilter === c ? "bg-indigo-600 text-white border-indigo-600" : "border-muted text-muted-foreground hover:border-indigo-300"}`}>
                {CATEGORY_ICONS[c]} {c} ({count})
              </button>
            )
          })}
        </div>
        <Button variant="ghost" size="icon" className="ml-auto rounded-full shrink-0" onClick={fetchData}><RefreshCw className="size-4" /></Button>
      </div>

      {/* ── Method Cards ── */}
      {loading ? (
        <div className="flex justify-center py-16 bg-background border rounded-3xl">
          <Loader2 className="animate-spin size-10 text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center bg-background border border-dashed rounded-3xl py-20">
          <Brain className="size-20 mx-auto mb-6 opacity-10" />
          <h3 className="font-black text-2xl mb-3">Metodikalar yo'q</h3>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Professional psixodiagnostika metodikalarini qo'shing.</p>
          <Button onClick={() => openEditor()} className="rounded-full h-12 px-8 font-bold shadow-lg bg-indigo-600 hover:bg-indigo-700">
            <Plus className="size-5 mr-2" /> Birinchi Metodika
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(item => {
            const isExpanded = expandedId === item.id
            const isProc = actionLoading === item.id

            return (
              <div key={item.id} className={`bg-background border rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${item.isPublished ? "" : "opacity-70"}`}>
                {/* Card Header */}
                <div className="flex items-center gap-4 p-5">
                  {/* Image */}
                  <div className="size-16 rounded-2xl overflow-hidden bg-indigo-50 border shrink-0 flex items-center justify-center">
                    {item.imageUrl
                      ? <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                      : <span className="text-3xl">{CATEGORY_ICONS[item.category || ""] || "🔮"}</span>}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <h3 className="font-black text-lg leading-tight">{item.title}</h3>
                      {item.category && (
                        <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest border-indigo-200 text-indigo-600 shrink-0">
                          {CATEGORY_ICONS[item.category]} {item.category}
                        </Badge>
                      )}
                      <Badge className={`text-[9px] border-transparent font-bold uppercase tracking-widest shrink-0 ${item.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                        {item.isPublished ? "Faol" : "Qoralama"}
                      </Badge>
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <span>{format(new Date(item.createdAt), "d MMM, yyyy", {locale: uz})}</span>
                      {item.instructions && (
                        <span className="flex items-center gap-1 text-indigo-500"><ClipboardList className="size-3" /> Yo'riqnoma bor</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost" size="icon"
                      className="size-9 rounded-full hover:bg-muted"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      title={isExpanded ? "Yopish" : "To'liq ko'rish"}
                    >
                      {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-9 rounded-full hover:bg-muted">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl">
                        <DropdownMenuItem className="py-2.5 font-medium cursor-pointer rounded-xl" onClick={() => openEditor(item)}>
                          <Edit className="size-4 mr-2 text-indigo-500" /> Tahrirlash
                        </DropdownMenuItem>
                        <DropdownMenuItem className="py-2.5 font-medium cursor-pointer rounded-xl" onClick={() => handleTogglePublish(item)} disabled={isProc}>
                          {item.isPublished
                            ? <><EyeOff className="size-4 mr-2 text-amber-500" /> Yashirish</>
                            : <><Eye className="size-4 mr-2 text-emerald-500" /> Nashr etish</>}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="py-2.5 text-destructive font-semibold cursor-pointer rounded-xl focus:bg-destructive/10" onClick={() => handleDelete(item.id)} disabled={isProc}>
                          <Trash2 className="size-4 mr-2" /> O'chirish
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Expandable Detail Panel */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-0 border-t bg-muted/20">
                    <div className="grid md:grid-cols-2 gap-6 pt-5">
                      {item.imageUrl && (
                        <div className="md:col-span-2">
                          <div className="h-48 rounded-2xl overflow-hidden border bg-muted">
                            <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.title} />
                          </div>
                        </div>
                      )}
                      {item.description && (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-black text-indigo-600 mb-2 flex items-center gap-1"><FileText className="size-3" /> Tavsif</p>
                          <p className="text-sm leading-relaxed text-foreground font-medium">{item.description}</p>
                        </div>
                      )}
                      {item.instructions && (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-black text-indigo-600 mb-2 flex items-center gap-1"><ClipboardList className="size-3" /> Yo'riqnoma</p>
                          <div className="text-sm leading-relaxed text-foreground font-medium bg-background rounded-xl p-4 border whitespace-pre-wrap">
                            {item.instructions}
                          </div>
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