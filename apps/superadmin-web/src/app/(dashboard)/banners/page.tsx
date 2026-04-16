"use client"

import { useEffect, useState, useCallback } from "react"
import { apiClient } from "@/lib/api-client"
import {
  Image as ImageIcon, Plus, Loader2, Trash2, Edit,
  Globe, Lock, Calendar, ChevronLeft, ChevronRight,
  Smartphone, GripVertical, ExternalLink, RefreshCw, Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { format } from "date-fns"
import { uz } from "date-fns/locale"

interface Banner {
  id: number
  title: string
  imageUrl: string
  linkUrl: string | null
  position: string
  orderIndex: number
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
  createdAt: string
}

const POSITIONS = [
  { value: "home", label: "🏠 Bosh sahifa (Home)" },
  { value: "library", label: "📚 Kutubxona (Library)" },
  { value: "profile", label: "👤 Profil (Profile)" },
  { value: "search", label: "🔍 Qidiruv (Search)" },
]

const DEFAULT_BANNERS = [
  "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1492681290082-e951e9cc9e07?w=800&auto=format&fit=crop",
]

export default function BannersPage() {
  const [data, setData] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  // Mobile carousel state
  const [previewIdx, setPreviewIdx] = useState(0)

  // Editor state
  const [editing, setEditing] = useState<Banner | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState({
    title: "",
    imageUrl: "",
    linkUrl: "",
    position: "home",
    orderIndex: 0,
    isActive: true,
    startsAt: "",
    endsAt: "",
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient<Banner[]>("/banners")
      setData(res)
    } catch {
      toast.error("Bannerlarni yuklashda xatolik")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Keep preview carousel in bounds
  useEffect(() => {
    const active = data.filter(b => b.isActive)
    if (previewIdx >= active.length && active.length > 0) setPreviewIdx(0)
  }, [data, previewIdx])

  const openNew = () => {
    setEditing(null)
    setIsNew(true)
    setForm({ title: "", imageUrl: "", linkUrl: "", position: "home", orderIndex: data.length, isActive: true, startsAt: "", endsAt: "" })
  }

  const openEdit = (b: Banner) => {
    setEditing(b)
    setIsNew(false)
    setForm({
      title: b.title,
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl || "",
      position: b.position,
      orderIndex: b.orderIndex,
      isActive: b.isActive,
      startsAt: b.startsAt ? new Date(b.startsAt).toISOString().split("T")[0] : "",
      endsAt: b.endsAt ? new Date(b.endsAt).toISOString().split("T")[0] : "",
    })
  }

  const handleSave = async () => {
    if (!form.title || !form.imageUrl) {
      toast.error("Sarlavha va rasm URL kiritilishi shart!")
      return
    }
    setSaving(true)
    const payload = {
      ...form,
      linkUrl: form.linkUrl || null,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    }
    try {
      if (editing) {
        await apiClient(`/banners/${editing.id}`, { method: "PATCH", body: payload })
        toast.success("Banner yangilandi!")
      } else {
        await apiClient("/banners", { method: "POST", body: payload })
        toast.success("🎉 Yangi banner qo'shildi! Mobil ilovada darhol ko'rinadi.")
      }
      setEditing(null)
      setIsNew(false)
      fetchData()
    } catch (e: any) {
      toast.error(e.message || "Xatolik yuz berdi")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Bu bannerni o'chirmoqchimisiz?")) return
    setActionLoading(id)
    try {
      await apiClient(`/banners/${id}`, { method: "DELETE" })
      toast.success("Banner o'chirildi")
      fetchData()
    } catch {
      toast.error("O'chirishda xatolik")
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggle = async (b: Banner) => {
    setActionLoading(b.id)
    try {
      await apiClient(`/banners/${b.id}`, { method: "PATCH", body: { isActive: !b.isActive } })
      toast.success(b.isActive ? "Banner o'chirildi" : "Banner faollashtirildi!")
      fetchData()
    } catch {
      toast.error("Xatolik")
    } finally {
      setActionLoading(null)
    }
  }

  const activeBanners = data.filter(b => b.isActive).sort((a, b) => a.orderIndex - b.orderIndex)
  const previewBanners = [
    ...(isNew && form.imageUrl ? [{ id: -1, ...form, linkUrl: null, createdAt: new Date().toISOString(), startsAt: null, endsAt: null }] : []),
    ...activeBanners.filter(b => b.id !== editing?.id),
    ...(editing && form.imageUrl ? [{ ...editing, ...form, linkUrl: null }] : []),
  ]
  const currentPreviewBanner = previewBanners[previewIdx % Math.max(previewBanners.length, 1)]

  return (
    <div className="space-y-8 pb-10">
      {/* ── Hero Banner ── */}
      <div className="relative bg-gradient-to-r from-rose-600 to-orange-500 rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl shadow-rose-900/20 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative z-10">
          <Badge className="bg-white/20 hover:bg-white/30 text-white mb-4 border-transparent uppercase tracking-widest text-[10px] px-3 font-bold">Visual Marketing</Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">Bannerlar Markazi</h1>
          <p className="text-white/80 max-w-xl text-base font-medium">
            Mobil ilova bosh sahifasidagi karusel bannerlarini real vaqt rejimida boshqaring. Yaratilgan banner darhol ilovada ko'rinadi.
          </p>
          <div className="flex items-center gap-6 mt-6">
            <div className="text-center"><p className="text-3xl font-black">{data.length}</p><p className="text-white/60 text-xs font-bold uppercase tracking-widest">Jami</p></div>
            <Separator orientation="vertical" className="h-10 bg-white/30" />
            <div className="text-center"><p className="text-3xl font-black text-emerald-300">{activeBanners.length}</p><p className="text-white/60 text-xs font-bold uppercase tracking-widest">Faol</p></div>
            <Separator orientation="vertical" className="h-10 bg-white/30" />
            <div className="text-center"><p className="text-3xl font-black text-white/50">{data.filter(b => !b.isActive).length}</p><p className="text-white/60 text-xs font-bold uppercase tracking-widest">Nofaol</p></div>
          </div>
        </div>
        <Button onClick={openNew} className="relative z-10 w-full md:w-auto h-14 rounded-2xl bg-white text-black hover:bg-white/90 text-base font-black px-8 shadow-xl">
          <Plus className="size-5 mr-2" /> Yangi Banner
        </Button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* ── Left: Editor + Banner Cards ── */}
        <div className="lg:col-span-7 space-y-6">
          {/* Inline Editor Panel */}
          {(isNew || editing) && (
            <div className="bg-background border-2 border-blue-500/30 rounded-[2rem] overflow-hidden shadow-xl shadow-blue-500/10">
              <div className="bg-blue-500/5 px-6 py-4 border-b flex items-center justify-between">
                <h3 className="font-black text-lg flex items-center gap-2">
                  <Edit className="size-5 text-blue-500" />
                  {isNew ? "Yangi Banner Qo'shish" : "Bannerni Tahrirlash"}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => { setIsNew(false); setEditing(null) }} className="rounded-full text-muted-foreground">Bekor qilish</Button>
              </div>

              <div className="p-6 space-y-5">
                {/* Image Preview + URL */}
                {form.imageUrl && (
                  <div className="h-36 rounded-2xl overflow-hidden border bg-muted">
                    <img src={form.imageUrl} alt="Banner" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1"><ImageIcon className="size-3" /> Rasm URL</Label>
                  <Input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} placeholder="https://... (1200×400 tavsiya etiladi)" className="h-12 rounded-xl bg-muted/40 border-transparent" />
                  {!form.imageUrl && (
                    <div className="flex gap-2 flex-wrap">
                      {DEFAULT_BANNERS.map((url, i) => (
                        <button key={i} onClick={() => setForm({...form, imageUrl: url})} className="text-[10px] px-3 py-1.5 rounded-full bg-muted hover:bg-primary/10 hover:text-primary font-bold transition-colors border">
                          Namuna {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Sarlavha</Label>
                    <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="M-n: Yangi aksiya!" className="h-12 rounded-xl bg-muted/40 border-transparent font-medium" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Joylashuv</Label>
                    <Select value={form.position} onValueChange={v => setForm({...form, position: v})}>
                      <SelectTrigger className="h-12 rounded-xl bg-muted/40 border-transparent font-medium"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {POSITIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Havola URL</Label>
                    <Input value={form.linkUrl} onChange={e => setForm({...form, linkUrl: e.target.value})} placeholder="https://..." className="h-12 rounded-xl bg-muted/40 border-transparent" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1"><Calendar className="size-3" /> Boshlanish</Label>
                    <Input type="date" value={form.startsAt} onChange={e => setForm({...form, startsAt: e.target.value})} className="h-12 rounded-xl bg-muted/40 border-transparent" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1"><Calendar className="size-3" /> Tugash</Label>
                    <Input type="date" value={form.endsAt} onChange={e => setForm({...form, endsAt: e.target.value})} className="h-12 rounded-xl bg-muted/40 border-transparent" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <Switch id="isActive" checked={form.isActive} onCheckedChange={v => setForm({...form, isActive: v})} />
                    <Label htmlFor="isActive" className="font-bold cursor-pointer">{form.isActive ? "Faol – Mobil ilovada ko'rinadi" : "Nofaol – Yashirilgan"}</Label>
                  </div>
                  <Button onClick={handleSave} disabled={saving || !form.title || !form.imageUrl} className="rounded-xl h-12 px-8 font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                    {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Check className="size-4 mr-2" />}
                    {isNew ? "Nashr Etish" : "Yangilash"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Banner List */}
          <div className="flex items-center justify-between bg-background border px-6 py-3 rounded-2xl shadow-sm">
            <h2 className="font-bold flex items-center gap-2"><GripVertical className="size-5 text-muted-foreground" /> Barcha bannerlar ({data.length})</h2>
            <Button variant="ghost" size="icon" onClick={fetchData} className="rounded-full"><RefreshCw className="size-4" /></Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12 bg-background border rounded-3xl"><Loader2 className="animate-spin text-muted-foreground size-8" /></div>
          ) : data.length === 0 ? (
            <div className="text-center bg-background border border-dashed rounded-3xl py-16">
              <ImageIcon className="size-16 mx-auto mb-4 text-muted-foreground opacity-10" />
              <h3 className="font-bold text-xl mb-2">Bannerlar yo'q</h3>
              <p className="text-muted-foreground mb-6">Birinchi bannerni qo'shing.</p>
              <Button onClick={openNew} className="rounded-full font-bold h-12 px-8"><Plus className="size-4 mr-2" /> Yangi Banner</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {data.sort((a, b) => a.orderIndex - b.orderIndex).map(item => {
                const isProc = actionLoading === item.id
                return (
                  <div key={item.id} className={`bg-background border rounded-[1.5rem] overflow-hidden shadow-sm flex gap-0 items-stretch transition-all hover:shadow-md ${editing?.id === item.id ? 'ring-2 ring-blue-500/30' : ''}`}>
                    {/* Thumbnail */}
                    <div className="w-32 h-24 shrink-0 relative bg-muted overflow-hidden rounded-l-[1.5rem]">
                      {item.imageUrl
                        ? <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                        : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="size-8 text-slate-300" /></div>}
                      <div className={`absolute top-2 left-2 w-2.5 h-2.5 rounded-full border-2 border-white ${item.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 px-5 py-4 flex flex-col justify-center min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-base truncate">{item.title}</span>
                        <Badge variant="outline" className="text-[9px] uppercase tracking-widest shrink-0 px-2">
                          {POSITIONS.find(p => p.value === item.position)?.label.split(" ")[0]} {item.position}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                        <span>Tartib: #{item.orderIndex}</span>
                        {item.startsAt && <span><Calendar className="size-3 inline mr-1" />{format(new Date(item.startsAt), "d MMM", {locale: uz})}</span>}
                        {item.linkUrl && <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline"><ExternalLink className="size-3" /> Havola</a>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-center justify-center gap-2 px-4 border-l">
                      <Button variant="ghost" size="icon" className="size-9 rounded-full hover:bg-blue-50 hover:text-blue-600" onClick={() => openEdit(item)} title="Tahrirlash">
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className={`size-9 rounded-full ${item.isActive ? 'hover:bg-amber-50 hover:text-amber-600' : 'hover:bg-emerald-50 hover:text-emerald-600'}`}
                        onClick={() => handleToggle(item)}
                        disabled={isProc}
                        title={item.isActive ? "O'chirish" : "Faollashtirish"}
                      >
                        {isProc ? <Loader2 className="size-4 animate-spin" /> : item.isActive ? <Lock className="size-4" /> : <Globe className="size-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="size-9 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(item.id)} disabled={isProc} title="O'chirish">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Right: Live Mobile Preview ── */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-background border rounded-2xl px-6 py-4 shadow-sm flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2"><Smartphone className="size-5 text-rose-500" /> Mobil Ilova Oldindan Ko'rish</h3>
            <Badge className="bg-emerald-100 text-emerald-700 font-bold">Live ●</Badge>
          </div>

          <div className="flex justify-center">
            {/* iPhone Frame */}
            <div className="relative w-[300px] bg-white dark:bg-zinc-900 rounded-[3rem] shadow-[0_0_0_12px_#1f2937,0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden border border-zinc-800" style={{height: "620px"}}>
              {/* Notch */}
              <div className="absolute top-0 inset-x-0 mx-auto w-32 h-7 bg-[#1f2937] rounded-b-3xl z-20" />

              {/* HomeScreen simulation */}
              <div className="w-full h-full bg-white dark:bg-black overflow-y-auto pt-12">
                {/* App Header */}
                <div className="px-5 pt-4 pb-3">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Assalomu alaykum</p>
                  <p className="text-xl font-black text-zinc-900">Foydalanuvchi</p>
                </div>

                {/* Banner Carousel – mirrors actual HomeScreen */}
                <div className="px-5 mb-5">
                  <div className="relative rounded-[1.5rem] overflow-hidden" style={{height: "150px"}}>
                    {previewBanners.length > 0 && currentPreviewBanner ? (
                      <>
                        <img
                          src={currentPreviewBanner.imageUrl || DEFAULT_BANNERS[0]}
                          alt={currentPreviewBanner.title}
                          className="w-full h-full object-cover transition-all duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-4 right-4">
                          <p className="text-white font-black text-base leading-tight line-clamp-1">{currentPreviewBanner.title}</p>
                        </div>
                        {/* Carousel dots */}
                        <div className="absolute top-3 right-3 flex gap-1">
                          {previewBanners.map((_, i) => (
                            <button key={i} onClick={() => setPreviewIdx(i)} className={`rounded-full transition-all ${i === previewIdx % previewBanners.length ? 'w-4 h-2 bg-white' : 'w-2 h-2 bg-white/50'}`} />
                          ))}
                        </div>
                        {/* Nav arrows */}
                        {previewBanners.length > 1 && (
                          <>
                            <button onClick={() => setPreviewIdx(i => (i - 1 + previewBanners.length) % previewBanners.length)} className="absolute left-2 top-1/2 -translate-y-1/2 size-7 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition-colors">
                              <ChevronLeft className="size-4" />
                            </button>
                            <button onClick={() => setPreviewIdx(i => (i + 1) % previewBanners.length)} className="absolute right-2 top-1/2 -translate-y-1/2 size-7 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition-colors">
                              <ChevronRight className="size-4" />
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-rose-100 to-orange-100 flex flex-col items-center justify-center">
                        <ImageIcon className="size-10 text-rose-300 mb-2" />
                        <p className="text-xs font-bold text-rose-400">Banner qo'shing</p>
                      </div>
                    )}
                  </div>

                  {/* Quick categories mock */}
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {["🧘", "📖", "🎯", "💬"].map((e, i) => (
                      <div key={i} className="aspect-square rounded-2xl bg-slate-100 flex flex-col items-center justify-center gap-1">
                        <span className="text-lg">{e}</span>
                        <div className="w-8 h-1.5 rounded-full bg-slate-200" />
                      </div>
                    ))}
                  </div>

                  {/* Featured section mock */}
                  <p className="mt-4 font-black text-zinc-900 text-base">Siz uchun</p>
                  <div className="mt-2 space-y-2">
                    {[1,2].map(i => (
                      <div key={i} className="flex gap-3 bg-slate-50 rounded-2xl p-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0" />
                        <div className="flex flex-col justify-center gap-1.5">
                          <div className="w-28 h-2.5 rounded-full bg-slate-200" />
                          <div className="w-20 h-2 rounded-full bg-slate-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview note */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 text-sm font-medium text-blue-700 dark:text-blue-400">
            <p className="font-bold mb-1">💡 Qanday ishlaydi?</p>
            <p>Yangi banner yaratilsa yoki tahrirlansa, yuqoridagi mobil simulyatorda darhol ko'rinadi. Nashr etilgan bannerlar foydalanuvchilarning haqiqiy ilovasida aynan shu tartibda chapdan-o'ngga siypilib o'tadi.</p>
          </div>
        </div>
      </div>
    </div>
  )
}