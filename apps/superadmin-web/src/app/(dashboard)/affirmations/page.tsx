"use client"

import { useEffect, useState, useCallback } from "react"
import { apiClient } from "@/lib/api-client"
import {
  Heart, Plus, Loader2, Trash2, Edit, Globe, Lock,
  RefreshCw, Sparkles, Quote, Hash, Check, X, Image as ImageIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

interface Affirmation {
  id: number
  content: string
  category: string | null
  imageUrl: string | null
  isActive: boolean
  orderIndex: number
  createdAt: string
}

const CATEGORIES = ["O'ziga ishonch", "Sevgi va qabul", "Motivatsiya", "Tinchlanish", "Baxt va minnatdorlik", "Sog'liq", "Muvaffaqiyat", "Sabr"]

const GRADIENT_BG = [
  "from-rose-400 to-pink-600",
  "from-violet-400 to-purple-600",
  "from-blue-400 to-cyan-600",
  "from-emerald-400 to-teal-600",
  "from-amber-400 to-orange-500",
  "from-fuchsia-400 to-pink-600",
  "from-sky-400 to-indigo-500",
  "from-lime-400 to-emerald-500",
]

const SAMPLE_AFFIRMATIONS = [
  "Men har kuni yangi kuch va ishonch bilan uyg'onaman.",
  "Men o'zimni sevaman va qadrlayapman.",
  "Hayotim go'zal imkoniyatlarga to'la.",
  "Men barcha qiyinchiliklarni yengishga qodirman.",
  "Men tinchlik va baxtga loyiqman.",
]

export default function AffirmationsPage() {
  const [data, setData] = useState<Affirmation[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [categoryFilter, setCategoryFilter] = useState("all")

  // Editor
  const [showEditor, setShowEditor] = useState(false)
  const [editing, setEditing] = useState<Affirmation | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    content: "", category: "Motivatsiya", imageUrl: "",
    isActive: true, orderIndex: 0
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient<Affirmation[]>("/affirmations").catch(() => [])
      setData(res)
    } catch {
      toast.error("Affirmatsiyalarni yuklashda xatolik")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openEditor = (aff?: Affirmation) => {
    if (aff) {
      setEditing(aff)
      setForm({ content: aff.content, category: aff.category || "Motivatsiya", imageUrl: aff.imageUrl || "", isActive: aff.isActive, orderIndex: aff.orderIndex })
    } else {
      setEditing(null)
      setForm({ content: "", category: "Motivatsiya", imageUrl: "", isActive: true, orderIndex: data.length })
    }
    setShowEditor(true)
  }

  const handleSave = async () => {
    if (!form.content.trim()) { toast.error("Matn kiritilishi shart!"); return }
    setSaving(true)
    try {
      if (editing) {
        await apiClient(`/affirmations/${editing.id}`, { method: "PATCH", body: { ...form, imageUrl: form.imageUrl || null, category: form.category || null } })
        toast.success("Affirmatsiya yangilandi!")
      } else {
        await apiClient("/affirmations", { method: "POST", body: { ...form, imageUrl: form.imageUrl || null, category: form.category || null } })
        toast.success("✨ Yangi affirmatsiya qo'shildi!")
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
    if (!confirm("Bu affirmatsiyani o'chirmoqchimisiz?")) return
    setActionLoading(id)
    try {
      await apiClient(`/affirmations/${id}`, { method: "DELETE" })
      toast.success("O'chirildi")
      fetchData()
    } catch { toast.error("Xatolik") }
    finally { setActionLoading(null) }
  }

  const handleToggle = async (a: Affirmation) => {
    setActionLoading(a.id)
    try {
      await apiClient(`/affirmations/${a.id}`, { method: "PATCH", body: { isActive: !a.isActive } })
      toast.success(a.isActive ? "Nofaol qilindi" : "Faollashtirildi!")
      fetchData()
    } catch { toast.error("Xatolik") }
    finally { setActionLoading(null) }
  }

  const filtered = data.filter(a => categoryFilter === "all" || a.category === categoryFilter)

  return (
    <div className="space-y-8 pb-10">
      {/* ── Header ── */}
      <div className="relative bg-gradient-to-br from-pink-600 via-rose-600 to-fuchsia-700 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          {["✨", "💫", "🌸", "💝", "🌟", "💖", "🦋", "🌈"].map((e, i) => (
            <span key={i} className="absolute text-4xl" style={{ top: `${(i * 37) % 85}%`, left: `${(i * 53 + 10) % 90}%`, opacity: 0.6 }}>{e}</span>
          ))}
        </div>
        <div className="relative z-10">
          <Badge className="bg-white/20 text-white mb-4 border-transparent uppercase tracking-widest text-[10px] px-3 font-bold">✨ Kundalik Affirmatsiyalar</Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Affirmatsiyalar</h1>
          <p className="text-white/80 max-w-xl text-base font-medium">
            Foydalanuvchilarga har kuni ijobiy fikrlash va ruhiy salomatlikni qo'llab-quvvatlash uchun ilhomlantiruvchi iboralar to'plami.
          </p>
          <div className="flex items-center gap-6 mt-6">
            <div className="text-center"><p className="text-3xl font-black">{data.length}</p><p className="text-white/50 text-xs font-bold uppercase tracking-widest">Jami</p></div>
            <Separator orientation="vertical" className="h-10 bg-white/30" />
            <div className="text-center"><p className="text-3xl font-black text-emerald-300">{data.filter(a => a.isActive).length}</p><p className="text-white/50 text-xs font-bold uppercase tracking-widest">Faol</p></div>
          </div>
        </div>
        <Button onClick={() => openEditor()} className="relative z-10 w-full md:w-auto h-14 rounded-2xl bg-white text-black hover:bg-white/90 text-base font-black px-8 shadow-xl">
          <Plus className="size-5 mr-2" /> Yangi Affirmatsiya
        </Button>
      </div>

      {/* ── Inline Editor ── */}
      {showEditor && (
        <div className="bg-background border-2 border-pink-500/30 rounded-[2rem] overflow-hidden shadow-xl shadow-pink-500/10">
          <div className="bg-pink-500/5 px-6 py-4 border-b flex items-center justify-between">
            <h3 className="font-black text-lg flex items-center gap-2">
              <Sparkles className="size-5 text-pink-500" />
              {editing ? "Affirmatsiyani Tahrirlash" : "Yangi Affirmatsiya Yozish"}
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
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Affirmatsiya Matni</Label>
                  <span className="text-[10px] text-muted-foreground">{form.content.length}/200</span>
                </div>
                <Textarea
                  value={form.content}
                  onChange={e => setForm({...form, content: e.target.value})}
                  placeholder="Qisqa, kuchli va ijobiy ibora yozing..."
                  className="min-h-[120px] rounded-xl bg-muted/40 border-transparent resize-none font-medium text-base leading-relaxed"
                  maxLength={200}
                />
              </div>

              {/* Sample suggestions */}
              {!form.content && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Tayyor namunalar</p>
                  <div className="flex flex-col gap-2">
                    {SAMPLE_AFFIRMATIONS.slice(0, 3).map((s, i) => (
                      <button key={i} onClick={() => setForm({...form, content: s})} className="text-left text-xs px-4 py-2.5 rounded-xl border bg-muted/30 hover:bg-pink-50 hover:border-pink-300 dark:hover:bg-pink-950/30 transition-colors font-medium text-muted-foreground hover:text-pink-700 dark:hover:text-pink-300">
                        "{s}"
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1"><Hash className="size-3" /> Tartib Raqami</Label>
                <Input type="number" value={form.orderIndex} onChange={e => setForm({...form, orderIndex: parseInt(e.target.value) || 0})} className="h-12 rounded-xl bg-muted/40 border-transparent font-bold font-mono w-32" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1"><ImageIcon className="size-3" /> Fon Rasmi URL (ixtiyoriy)</Label>
                <Input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} placeholder="https://..." className="h-12 rounded-xl bg-muted/40 border-transparent" />
                {form.imageUrl && (
                  <div className="h-24 rounded-2xl overflow-hidden border bg-muted">
                    <img src={form.imageUrl} className="w-full h-full object-cover" alt="" />
                  </div>
                )}
              </div>

              {/* Live Preview Card */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Mobil Ko'rinish (Preview)</p>
                <div className={`relative bg-gradient-to-br ${GRADIENT_BG[CATEGORIES.indexOf(form.category) % GRADIENT_BG.length] || GRADIENT_BG[0]} rounded-3xl p-6 min-h-[140px] flex flex-col justify-between overflow-hidden shadow-lg`}>
                  {form.imageUrl && <img src={form.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-20" alt="" />}
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-white/70" />
                    <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest">{form.category}</span>
                  </div>
                  <p className="text-white font-bold text-lg leading-relaxed italic relative z-10">
                    "{form.content || "Affirmatsiya matni bu yerda..."}"
                  </p>
                  <div className="flex items-center gap-2">
                    <Heart className="size-4 text-white/50" />
                    <span className="text-white/50 text-[10px] font-medium">Ruhiyat</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-muted/30 rounded-xl px-4 py-3">
                <Switch id="active" checked={form.isActive} onCheckedChange={v => setForm({...form, isActive: v})} />
                <Label htmlFor="active" className="font-bold cursor-pointer">{form.isActive ? "✅ Faol – Foydalanuvchilarga ko'rinadi" : "⏸️ Nofaol – Yashirilgan"}</Label>
              </div>

              <Button onClick={handleSave} disabled={saving || !form.content} className="w-full h-14 rounded-xl font-black text-base bg-pink-600 hover:bg-pink-700 shadow-lg shadow-pink-500/20">
                {saving ? <Loader2 className="size-5 animate-spin mr-2" /> : <Check className="size-5 mr-2" />}
                {editing ? "Yangilash" : "Saqlash"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Category Filter ── */}
      <div className="flex flex-wrap items-center gap-3 bg-background border px-5 py-3 rounded-2xl shadow-sm">
        <Sparkles className="size-4 text-muted-foreground" />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setCategoryFilter("all")} className={`px-4 py-1.5 rounded-full text-xs font-bold border ${categoryFilter === "all" ? "bg-foreground text-background" : "border-muted text-muted-foreground hover:border-foreground/50"}`}>Barchasi ({data.length})</button>
          {CATEGORIES.map(c => {
            const count = data.filter(a => a.category === c).length
            if (!count) return null
            return (
              <button key={c} onClick={() => setCategoryFilter(c)} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${categoryFilter === c ? "bg-pink-600 text-white border-pink-600" : "border-muted text-muted-foreground hover:border-pink-300"}`}>{c} ({count})</button>
            )
          })}
        </div>
        <Button variant="ghost" size="icon" className="ml-auto rounded-full shrink-0" onClick={fetchData}><RefreshCw className="size-4" /></Button>
      </div>

      {/* ── Affirmation Cards Masonry ── */}
      {loading ? (
        <div className="flex justify-center py-16 bg-background border rounded-3xl"><Loader2 className="animate-spin size-10 text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center bg-background border border-dashed rounded-3xl py-20">
          <Heart className="size-20 mx-auto mb-6 opacity-10" />
          <h3 className="font-black text-2xl mb-3">Affirmatsiyalar yo'q</h3>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Yangi affirmatsiya qo'shing va u foydalanuvchilarni har kuni ilhomlantirsin.</p>
          <Button onClick={() => openEditor()} className="rounded-full h-12 px-8 font-bold shadow-lg bg-pink-600 hover:bg-pink-700">
            <Plus className="size-5 mr-2" /> Birinchi Affirmatsiya
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.sort((a, b) => a.orderIndex - b.orderIndex).map((item, idx) => {
            const isProc = actionLoading === item.id
            const grad = GRADIENT_BG[idx % GRADIENT_BG.length]

            return (
              <div key={item.id} className={`relative bg-gradient-to-br ${grad} rounded-[2rem] p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden min-h-[200px] flex flex-col justify-between`}>
                {item.imageUrl && <img src={item.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-15" alt="" />}

                {/* Header */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-white/70" />
                    <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest">{item.category || "Umumiy"}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => openEditor(item)} className="size-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors" title="Tahrirlash">
                      <Edit className="size-3.5" />
                    </button>
                    <button onClick={() => handleToggle(item)} disabled={isProc} className={`size-8 rounded-full flex items-center justify-center text-white transition-colors ${item.isActive ? "bg-white/20 hover:bg-amber-500/60" : "bg-white/20 hover:bg-emerald-500/60"}`} title={item.isActive ? "Nofaol qilish" : "Faollashtirish"}>
                      {item.isActive ? <Lock className="size-3.5" /> : <Globe className="size-3.5" />}
                    </button>
                    <button onClick={() => handleDelete(item.id)} disabled={isProc} className="size-8 rounded-full bg-white/20 hover:bg-red-500/60 flex items-center justify-center text-white transition-colors" title="O'chirish">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10 py-4">
                  <Quote className="size-6 text-white/30 mb-2" />
                  <p className="text-white font-bold text-lg leading-relaxed italic">"{item.content}"</p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-1.5">
                    <Heart className="size-3.5 text-white/60" />
                    <span className="text-white/60 text-[10px] font-bold">№{item.orderIndex + 1}</span>
                  </div>
                  <Badge className={`text-[9px] border-transparent font-bold uppercase tracking-widest ${item.isActive ? "bg-white/20 text-white" : "bg-black/30 text-white/60"}`}>
                    {item.isActive ? "Faol" : "Nofaol"}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}