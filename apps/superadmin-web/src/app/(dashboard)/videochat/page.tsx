"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { useAuth } from "@/components/auth-provider"
import { 
  Video, Mic, MicOff, VideoOff, PhoneOff, MonitorUp, 
  MessageSquare, Users, Settings, Maximize, Calendar, 
  Plus, Play, CheckCircle, Clock, Link as LinkIcon, Download, Loader2, Copy, User
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { uz } from "date-fns/locale"
import { toast } from "sonner"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from "@/components/ui/dialog"

interface VideoSession {
  id: number
  title: string
  description: string | null
  type: string
  status: string
  hostId: number
  scheduledAt: string
  duration: number
  meetingUrl: string | null
  createdAt: string
  host: {
    id: number
    firstName: string | null
    lastName: string | null
    email: string | null
  }
}

interface JoinTokenResponse {
  domain: string
  roomId: string
  token: string | null
  displayName: string
  url: string
}

function getUserName(user?: { firstName?: string | null; lastName?: string | null; email?: string | null }) {
  if (!user) return "Noma'lum"
  if (user.firstName) return `${user.firstName} ${user.lastName || ""}`.trim()
  return user.email || "Foydalanuvchi"
}

export default function VideochatPage() {
  const { user } = useAuth()
  const currentUserId = user?.id

  // State Management
  const [sessions, setSessions] = useState<VideoSession[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  
  // Meeting Room Mode
  const [activeMeeting, setActiveMeeting] = useState<VideoSession | null>(null)
  const [joinUrl, setJoinUrl] = useState<string | null>(null)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(true)
  
  // Schedule Mode
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [newMeeting, setNewMeeting] = useState({
    title: "", type: "CONSULTATION", date: "", time: "", duration: 60
  })

  const fetchSessions = useCallback(async () => {
    try {
      const res = await apiClient<PaginatedResponse<VideoSession>>("/video/sessions", {
        params: { limit: 50, status: "SCHEDULED,IN_PROGRESS" } // Fetch active and upcoming
      })
      setSessions(res.data.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()))
    } catch (e: any) {
      toast.error("Seanslarni yuklashda xatolik: " + e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
    const interval = setInterval(fetchSessions, 15000)
    return () => clearInterval(interval)
  }, [fetchSessions])

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMeeting.title || !newMeeting.date || !newMeeting.time) return
    
    setActionLoading(true)
    try {
      const scheduledAt = new Date(`${newMeeting.date}T${newMeeting.time}:00`).toISOString()
      await apiClient("/video/schedule", {
        method: "POST",
        body: {
          title: newMeeting.title,
          type: newMeeting.type,
          scheduledAt,
          duration: newMeeting.duration,
          hostId: currentUserId
        }
      })
      toast.success("Seans rejalashtirildi")
      setIsScheduleOpen(false)
      fetchSessions()
      setNewMeeting({ title: "", type: "CONSULTATION", date: "", time: "", duration: 60 })
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleStartMeeting = async (session: VideoSession) => {
    if (session.status !== "IN_PROGRESS") {
      try {
        await apiClient(`/video/${session.id}/start`, { method: "PATCH" })
      } catch (e: any) {
        toast.error("Avvalgi xatolik (boshlash): " + e.message) // Proceed anyway for UI demo purposes if API strictly validates state
      }
    }
    try {
      const join = await apiClient<JoinTokenResponse>(`/video/sessions/${session.id}/join-token`)
      setJoinUrl(join.url)
      setActiveMeeting(session)
      toast.success("Konferensiyaga ulandingiz")
    } catch (e: any) {
      toast.error(e.message || "Ulanib bo'lmadi")
    }
  }

  const handleEndMeeting = async () => {
    if (!activeMeeting) return
    try {
      await apiClient(`/video/${activeMeeting.id}/end`, { method: "PATCH" })
      toast.success("Seans yakunlandi")
    } catch (e: any) {
      // ignore strict validation in demo
    }
    setActiveMeeting(null)
    setJoinUrl(null)
    fetchSessions()
  }

  // --- RENDERING ACTIVE MEETING (ZOOM/MEET CLONE) ---
  if (activeMeeting) {
    return (
      <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col h-screen w-screen overflow-hidden text-white font-sans">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 bg-zinc-900/50 backdrop-blur-md border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="bg-red-500 animate-pulse size-2.5 rounded-full" />
            <span className="font-bold text-lg tracking-tight">{activeMeeting.title}</span>
            <Badge variant="outline" className="bg-zinc-800 border-zinc-700 text-zinc-300">Superadmin</Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-zinc-400 bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800">
              {format(new Date(), "HH:mm")}
            </span>
          </div>
        </div>

        {/* Meeting Area (Jitsi) */}
        <div className="flex-1 p-4 md:p-6 overflow-hidden">
          <div className="h-full w-full rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl">
            {joinUrl ? (
              <iframe
                src={joinUrl}
                className="w-full h-full"
                allow="camera; microphone; fullscreen; display-capture"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-zinc-400">
                <Loader2 className="size-6 animate-spin mr-2" /> Ulanmoqda...
              </div>
            )}
          </div>
        </div>

        {/* Footer Controls */}
        <div className="h-24 bg-zinc-950 flex items-center justify-between px-8 border-t border-zinc-900 pb-2">
          {/* Left info */}
          <div className="flex items-center gap-2 w-64">
            <Button variant="ghost" className="text-zinc-400 hover:text-white" onClick={() => {
              navigator.clipboard.writeText(activeMeeting.meetingUrl || window.location.href)
              toast.success("Havola nusxalandi")
            }}>
              <LinkIcon className="size-4 mr-2" /> Havola
            </Button>
          </div>

          {/* Center controls */}
          <div className="flex items-center gap-4">
            <Button 
              size="icon" 
              className={`rounded-full size-12 shadow-lg transition-all border ${isMicOn ? "bg-zinc-800 hover:bg-zinc-700 border-zinc-700" : "bg-red-500 hover:bg-red-600 border-red-500 text-white"}`}
              onClick={() => setIsMicOn(!isMicOn)}
            >
              {isMicOn ? <Mic className="size-5" /> : <MicOff className="size-5" />}
            </Button>
            <Button 
              size="icon" 
              className={`rounded-full size-12 shadow-lg transition-all border ${isVideoOn ? "bg-zinc-800 hover:bg-zinc-700 border-zinc-700" : "bg-red-500 hover:bg-red-600 border-red-500 text-white"}`}
              onClick={() => setIsVideoOn(!isVideoOn)}
            >
              {isVideoOn ? <Video className="size-5" /> : <VideoOff className="size-5" />}
            </Button>
            <Button size="icon" className="rounded-full size-12 bg-zinc-800 hover:bg-zinc-700 border-zinc-700">
              <MonitorUp className="size-5" />
            </Button>
            
            <Separator orientation="vertical" className="h-8 mx-2 bg-zinc-800" />
            
            <Button size="icon" className="rounded-full size-12 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20" onClick={handleEndMeeting}>
              <PhoneOff className="size-5" />
            </Button>
          </div>

          {/* Right controls */}
          <div className="flex items-center justify-end gap-2 w-64">
             <Button variant="ghost" size="icon" className="rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 relative">
               <Users className="size-5" />
               <span className="absolute top-1 right-0 text-[9px] bg-blue-500 text-white px-1 rounded-full font-bold">4</span>
             </Button>
             <Button variant="ghost" size="icon" className="rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800">
               <MessageSquare className="size-5" />
             </Button>
             <Button variant="ghost" size="icon" className="rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800">
               <Settings className="size-5" />
             </Button>
          </div>
        </div>
      </div>
    )
  }

  // --- RENDERING DASHBOARD LIST ---
  return (
    <div className="space-y-8 pb-10 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-8 rounded-[2rem] shadow-2xl shadow-blue-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Video className="size-40" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2 tracking-tight">Superadmin Videochat</h1>
          <p className="text-blue-200 font-medium max-w-xl">
            Tizimdagi barcha psixologik video konsultatsiyalar, terapiya va uchrashuvlarni professional WebRTC interfeysida olib boring.
          </p>
        </div>
        <div className="relative z-10 flex gap-3">
          <Button onClick={() => setIsScheduleOpen(true)} className="bg-white text-blue-900 hover:bg-blue-50 rounded-2xl font-bold h-12 shadow-lg">
            <Calendar className="mr-2 size-4 border" />
            Yangi seans belgilash
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Kelgusi va faol uchrashuvlar</h2>
            <Button variant="outline" size="sm" onClick={fetchSessions} className="rounded-xl">Yangilash</Button>
          </div>
          
          {loading ? (
             <div className="h-64 flex flex-col justify-center items-center rounded-3xl bg-muted/20 border border-dashed">
               <Loader2 className="animate-spin text-muted-foreground mb-4 size-8" />
             </div>
          ) : sessions.length === 0 ? (
            <div className="h-64 flex flex-col justify-center items-center rounded-3xl bg-muted/20 border border-dashed text-center p-6">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Calendar className="size-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-1">Rejalashtirilgan seanslar yo'q</h3>
              <p className="text-muted-foreground text-sm">Hozircha hech qanday video qo'ng'iroq yo'q.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {sessions.map(s => {
                const isNow = s.status === "IN_PROGRESS" || new Date(s.scheduledAt).getTime() < Date.now() + 15 * 60000 // 15 mins before
                
                return (
                  <Card key={s.id} className={`border-none shadow-xl ${isNow ? 'bg-primary/5 shadow-primary/5 ring-1 ring-primary/20' : 'bg-background shadow-black/5'} rounded-3xl overflow-hidden transition-all hover:scale-[1.01]`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex items-start gap-4">
                          <div className={`mt-1 size-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${isNow ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                            {s.type === 'GROUP_SESSION' ? <Users className="size-6" /> : <Video className="size-6" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={`rounded-xl px-2 font-bold uppercase text-[9px] tracking-widest ${isNow ? 'bg-primary/20 text-primary border-primary/30' : ''}`}>
                                {s.type}
                              </Badge>
                              {s.status === "IN_PROGRESS" && (
                                <span className="flex items-center text-[10px] font-bold text-red-500 uppercase tracking-widest animate-pulse">
                                  <div className="size-1.5 rounded-full bg-red-500 mr-1.5" /> LIVE
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg font-black tracking-tight mb-1">{s.title}</h3>
                            <div className="flex flex-col gap-1 text-sm text-muted-foreground font-medium">
                              <span className="flex items-center"><Clock className="size-3.5 mr-2" /> {format(new Date(s.scheduledAt), "d MMMM, HH:mm", { locale: uz })} ({s.duration} daqiqa)</span>
                              <span className="flex items-center"><User className="size-3.5 mr-2" /> Boshlovchi: {getUserName(s.host)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end justify-center border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
                           {isNow ? (
                             <Button onClick={() => handleStartMeeting(s)} className="rounded-2xl px-8 shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 w-full md:w-auto h-12 text-base font-bold">
                               <Play className="mr-2 fill-current size-4" /> Boshlash
                             </Button>
                           ) : (
                             <div className="text-center w-full md:w-auto">
                               <Button variant="outline" className="rounded-2xl px-8 w-full md:w-auto h-12 pointer-events-none opacity-50 font-bold border-2">
                                 Kutilmoqda
                               </Button>
                               <p className="text-[10px] text-muted-foreground mt-2 font-medium uppercase tracking-widest">Vaqt kelganida faollashadi</p>
                             </div>
                           )}
                           
                           {s.meetingUrl && (
                             <div className="flex items-center mt-3 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg border w-full justify-center group cursor-pointer hover:bg-muted" onClick={() => {navigator.clipboard.writeText(s.meetingUrl!); toast.success("Nusxalandi")}}>
                               <LinkIcon className="size-3 mr-1.5" /> 
                               <span className="truncate max-w-[120px] font-mono">{s.meetingUrl}</span>
                               <Copy className="size-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                             </div>
                           )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="rounded-3xl border-none shadow-xl shadow-black/5 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-amber-400 to-orange-500 w-full" />
            <CardHeader className="bg-muted/10 pb-4">
               <CardTitle className="flex items-center text-lg"><Calendar className="size-5 mr-2 text-amber-500" /> Kunlik tartib</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="p-6 text-center text-muted-foreground">
                 Bugungi kunga xos tayyorlangan hisobot yoki uchrashuvlar tartibi kiritilmagan.
               </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Yangi uchrashuv</DialogTitle>
            <DialogDescription className="font-medium text-xs">Video seans qachon bo'lib o'tishini belgilang</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSchedule} className="space-y-6 py-4 font-bold">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Sarlavha</Label>
              <Input 
                value={newMeeting.title}
                onChange={e => setNewMeeting({...newMeeting, title: e.target.value})}
                placeholder="M-n: Yakshanba trengingi"
                className="rounded-2xl h-12"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Sana</Label>
                 <Input 
                   type="date"
                   value={newMeeting.date}
                   onChange={e => setNewMeeting({...newMeeting, date: e.target.value})}
                   className="rounded-2xl h-12"
                   required
                 />
               </div>
               <div className="space-y-2">
                 <Label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Vaqt</Label>
                 <Input 
                   type="time"
                   value={newMeeting.time}
                   onChange={e => setNewMeeting({...newMeeting, time: e.target.value})}
                   className="rounded-2xl h-12"
                   required
                 />
               </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Davomiylik (daqiqa)</Label>
              <Input 
                type="number"
                min="15"
                step="15"
                value={newMeeting.duration}
                onChange={e => setNewMeeting({...newMeeting, duration: parseInt(e.target.value)})}
                className="rounded-2xl h-12"
                required
              />
            </div>
            <DialogFooter className="pt-4 gap-2 sm:gap-0 sm:justify-between w-full">
              <Button type="button" variant="ghost" onClick={() => setIsScheduleOpen(false)} className="rounded-xl w-full sm:w-auto">Bekor qilish</Button>
              <Button type="submit" disabled={actionLoading} className="rounded-xl px-12 shadow-xl shadow-primary/20 h-12 w-full sm:w-auto">
                {actionLoading ? <Loader2 className="animate-spin size-4" /> : "Saqlash"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
