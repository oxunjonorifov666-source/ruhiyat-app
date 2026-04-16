"use client"

import { useEffect, useState, useCallback } from "react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import {
  Bell, BellRing, Send, Loader2, Trash2, User, CheckCheck,
  Info, AlertTriangle, CheckCircle, Zap, RefreshCw, 
  Users, UserCheck, Clock, Filter, Circle, TrendingUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow, format } from "date-fns"
import { uz } from "date-fns/locale"
import { toast } from "sonner"

interface Notification {
  id: number
  title: string
  body: string | null
  type: string
  isRead: boolean
  createdAt: string
  user: {
    id: number
    email: string | null
    firstName: string | null
    lastName: string | null
  }
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any; emoji: string }> = {
  general:  { label: "Umumiy",        color: "text-blue-600",   bg: "bg-blue-500/10",   icon: Info,          emoji: "💬" },
  system:   { label: "Tizim",         color: "text-purple-600", bg: "bg-purple-500/10", icon: Zap,           emoji: "⚡" },
  warning:  { label: "Ogohlantirish", color: "text-amber-600",  bg: "bg-amber-500/10",  icon: AlertTriangle, emoji: "⚠️" },
  success:  { label: "Muvaffaqiyat",  color: "text-emerald-600",bg: "bg-emerald-500/10",icon: CheckCircle,   emoji: "✅" },
  reminder: { label: "Eslatma",       color: "text-rose-600",   bg: "bg-rose-500/10",   icon: Bell,          emoji: "🔔" },
}

function getUserName(u: { firstName?: string | null; lastName?: string | null; email?: string | null }) {
  if (u.firstName) return `${u.firstName} ${u.lastName || ""}`.trim()
  return u.email || "Foydalanuvchi"
}

export default function NotificationsPage() {
  const [data, setData] = useState<Notification[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [filterType, setFilterType] = useState("all")
  const [filterRead, setFilterRead] = useState("all")
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  // Compose form
  const [form, setForm] = useState({
    title: "",
    body: "",
    type: "general",
    userId: "",
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient<PaginatedResponse<Notification>>("/notifications", {
        params: { page, limit: 30 }
      }).catch(() => ({ data: [], total: 0 }))
      setData(res.data)
      setTotal(res.total)
    } catch {
      toast.error("Bildirishnomalarni yuklashda xatolik")
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSend = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Sarlavha va matn bo'sh bo'lishi mumkin emas!")
      return
    }
    setSending(true)
    try {
      await apiClient("/notifications", {
        method: "POST",
        body: {
          title: form.title,
          body: form.body,
          type: form.type,
          userId: form.userId ? parseInt(form.userId) : undefined,
        }
      })
      toast.success(form.userId ? `✅ Foydalanuvchi #${form.userId} ga bildirishnoma yuborildi!` : "📢 Bildirishnoma barcha foydalanuvchilarga yuborildi!")
      setForm({ title: "", body: "", type: "general", userId: "" })
      fetchData()
    } catch (e: any) {
      toast.error(e.message || "Yuborishda xatolik yuz berdi")
    } finally {
      setSending(false)
    }
  }

  const handleMarkRead = async (id: number) => {
    setActionLoading(id)
    try {
      await apiClient(`/notifications/${id}/read`, { method: "PATCH" })
      toast.success("O'qilgan deb belgilandi")
      setData(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch {
      toast.error("Xatolik yuz berdi")
    } finally {
      setActionLoading(null)
    }
  }

  // Filtered view
  const filtered = data.filter(n => {
    if (filterType !== "all" && n.type !== filterType) return false
    if (filterRead === "unread" && n.isRead) return false
    if (filterRead === "read" && !n.isRead) return false
    return true
  })

  const unreadCount = data.filter(n => !n.isRead).length

  return (
    <div className="space-y-8 pb-10">
      {/* ── Header ── */}
      <div className="bg-gradient-to-br from-violet-700 to-indigo-700 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-indigo-900/30 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <Badge className="bg-white/20 hover:bg-white/30 text-white mb-4 border-transparent uppercase tracking-widest text-[10px] px-3 font-bold">
            <BellRing className="size-3 mr-1.5 animate-[wiggle_1s_ease-in-out_infinite]" /> Push Bildirishnomalar
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Xabarnomalar Markazi</h1>
          <p className="text-white/80 max-w-xl text-base font-medium">
            Barcha foydalanuvchilarga yoki tanlangan shaxslarga zudlik bilan tizim, eslatma yoki aksiya bildirishnomasi yuboring. Tarix va holat real bazadan yuklanadi.
          </p>
          <div className="flex items-center gap-6 mt-6">
            <div className="text-center">
              <p className="text-3xl font-black">{total}</p>
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Jami yuborilgan</p>
            </div>
            <Separator orientation="vertical" className="h-10 bg-white/30" />
            <div className="text-center">
              <p className="text-3xl font-black text-amber-300">{unreadCount}</p>
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest">O'qilmagan</p>
            </div>
            <Separator orientation="vertical" className="h-10 bg-white/30" />
            <div className="text-center">
              <p className="text-3xl font-black text-emerald-300">{total - unreadCount}</p>
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest">O'qilgan</p>
            </div>
          </div>
        </div>
        <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 min-w-[220px] flex flex-col items-center text-center gap-3">
          <TrendingUp className="size-8 text-white/70" />
          <div>
            <p className="text-4xl font-black">{total > 0 ? Math.round(((total - unreadCount) / total) * 100) : 0}%</p>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">O'qilganlik darajasi</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* ── Left: Compose Panel ── */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-background border rounded-[2rem] overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-violet-600/10 to-indigo-600/5 px-6 py-5 border-b">
              <h2 className="font-black text-xl flex items-center gap-2"><Send className="size-5 text-violet-600" /> Bildirishnoma Yuborish</h2>
              <p className="text-sm text-muted-foreground mt-1">Real bazaga saqlanadi va foydalanuvchiga darhol ko'rinadi</p>
            </div>

            <div className="p-6 space-y-5">
              {/* Type selector as toggle chips */}
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Tur</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                    const Icon = cfg.icon
                    return (
                      <button
                        key={key}
                        onClick={() => setForm({...form, type: key})}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${
                          form.type === key 
                            ? `${cfg.bg} ${cfg.color} border-current ring-2 ring-current/20` 
                            : "border-muted-foreground/20 text-muted-foreground hover:border-muted-foreground/50"
                        }`}
                      >
                        <Icon className="size-3" /> {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Recipient */}
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Kimga?</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setForm({...form, userId: ""})}
                    className={`py-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${!form.userId ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20" : "border-muted-foreground/20 text-muted-foreground hover:border-indigo-300"}`}
                  >
                    <Users className="size-4" /> Barcha
                  </button>
                  <button
                    onClick={() => setForm({...form, userId: form.userId || " "})}
                    className={`py-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${form.userId ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20" : "border-muted-foreground/20 text-muted-foreground hover:border-indigo-300"}`}
                  >
                    <UserCheck className="size-4" /> Alohida
                  </button>
                </div>
                {form.userId !== "" && (
                  <Input
                    type="number"
                    value={form.userId.trim()}
                    onChange={e => setForm({...form, userId: e.target.value})}
                    placeholder="Foydalanuvchi ID raqamini kiriting..."
                    className="h-12 rounded-xl bg-muted/40 border-transparent font-bold font-mono"
                    autoFocus
                  />
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Sarlavha</Label>
                <Input
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  placeholder="Qisqa va ravshan sarlavha..."
                  className="h-12 rounded-xl bg-muted/40 border-transparent font-bold"
                />
              </div>

              {/* Body */}
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Xabar Matni</Label>
                <Textarea
                  value={form.body}
                  onChange={e => setForm({...form, body: e.target.value})}
                  placeholder="Kengroq tushuntirish yoki harakatga undash xabari..."
                  className="min-h-[100px] rounded-xl bg-muted/40 border-transparent resize-none font-medium leading-relaxed"
                />
              </div>

              {/* Live Preview in notification style */}
              {(form.title || form.body) && (
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-3">Ko'rinishi (Preview)</p>
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border shadow-sm flex gap-3">
                    <div className={`size-10 rounded-full ${TYPE_CONFIG[form.type]?.bg} ${TYPE_CONFIG[form.type]?.color} flex items-center justify-center shrink-0 text-lg`}>
                      {TYPE_CONFIG[form.type]?.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm leading-tight">{form.title || "Sarlavha..."}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{form.body || "Matn..."}</p>
                      <p className="text-[10px] text-muted-foreground font-bold mt-2">Hozirgina • Ruhiyat</p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSend}
                disabled={sending || !form.title || !form.body}
                className="w-full h-14 rounded-xl font-black text-base bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/20"
              >
                {sending ? <Loader2 className="size-5 animate-spin mr-2" /> : <Send className="size-5 mr-2" />}
                {form.userId ? `Foydalanuvchi #${form.userId.trim()} ga Yuborish` : "Barcha Foydalanuvchilarga Yuborish"}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Right: Notification History Feed ── */}
        <div className="lg:col-span-7 space-y-5">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 bg-background border px-5 py-3 rounded-2xl shadow-sm">
            <Filter className="size-4 text-muted-foreground" />
            <div className="flex gap-2 flex-wrap">
              {["all", "unread", "read"].map(v => (
                <button key={v} onClick={() => setFilterRead(v)} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${filterRead === v ? "bg-indigo-600 text-white border-indigo-600" : "border-muted text-muted-foreground hover:border-indigo-300"}`}>
                  {v === "all" ? "Barchasi" : v === "unread" ? `O'qilmagan (${unreadCount})` : "O'qilgan"}
                </button>
              ))}
            </div>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            <div className="flex gap-2 flex-wrap">
              {["all", ...Object.keys(TYPE_CONFIG)].map(v => (
                <button key={v} onClick={() => setFilterType(v)} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${filterType === v ? "bg-foreground text-background border-foreground" : "border-muted text-muted-foreground hover:border-foreground/30"}`}>
                  {v === "all" ? "Har tur" : TYPE_CONFIG[v]?.emoji + " " + TYPE_CONFIG[v]?.label}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="icon" className="ml-auto rounded-full shrink-0" onClick={fetchData}><RefreshCw className="size-4" /></Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-14 bg-background border rounded-3xl"><Loader2 className="animate-spin text-muted-foreground size-8" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center bg-background border border-dashed rounded-3xl py-16">
              <Bell className="size-16 mx-auto mb-4 opacity-10" />
              <h3 className="font-bold text-xl mb-2">Bildirishnomalar yo'q</h3>
              <p className="text-muted-foreground">Filtr shartlariga mos bildirishnoma topilmadi</p>
            </div>
          ) : (
            <ScrollArea className="h-[700px] pr-2">
              <div className="space-y-3">
                {filtered.map(notif => {
                  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.general
                  const Icon = cfg.icon
                  const isProc = actionLoading === notif.id

                  return (
                    <div key={notif.id} className={`group bg-background border rounded-[1.5rem] p-5 shadow-sm flex gap-4 transition-all hover:shadow-md ${!notif.isRead ? "border-l-4 border-l-indigo-500" : ""}`}>
                      {/* Type icon */}
                      <div className={`size-12 rounded-2xl ${cfg.bg} ${cfg.color} flex items-center justify-center shrink-0 text-xl`}>
                        {cfg.emoji}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <h4 className={`font-bold text-base leading-tight ${!notif.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                              {notif.title}
                            </h4>
                            {notif.body && (
                              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{notif.body}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {!notif.isRead && (
                              <Button
                                variant="ghost" size="icon"
                                className="size-8 rounded-full opacity-0 group-hover:opacity-100 text-emerald-600 hover:bg-emerald-50 transition-all"
                                onClick={() => handleMarkRead(notif.id)}
                                disabled={isProc}
                                title="O'qilgan deb belgilash"
                              >
                                {isProc ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Footer row */}
                        <div className="flex items-center gap-3 flex-wrap mt-3 pt-3 border-t">
                          <div className="flex items-center gap-2">
                            <Avatar className="size-6">
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${notif.user.email}`} />
                              <AvatarFallback className="text-[9px] font-bold">{getUserName(notif.user).substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-bold text-muted-foreground">{getUserName(notif.user)}</span>
                          </div>

                          <Badge className={`${cfg.bg} ${cfg.color} border-transparent text-[9px] uppercase tracking-widest font-bold`}>
                            <Icon className="size-2.5 mr-1" /> {cfg.label}
                          </Badge>

                          <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground font-bold">
                            <Clock className="size-3" />
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: uz })}
                          </span>

                          {notif.isRead ? (
                            <Badge variant="outline" className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest"><CheckCheck className="size-2.5 mr-1" /> O'qilgan</Badge>
                          ) : (
                            <Badge className="bg-indigo-100 text-indigo-700 border-transparent text-[9px] font-bold uppercase tracking-widest animate-pulse"><Circle className="size-2 mr-1 fill-current" /> Yangi</Badge>
                          )}
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
