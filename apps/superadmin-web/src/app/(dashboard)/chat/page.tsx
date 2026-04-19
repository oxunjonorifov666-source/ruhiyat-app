"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { useAuth } from "@/components/auth-provider"
import { 
  Search, Plus, Paperclip, Send, MoreVertical, 
  Phone, Video, Info, Image as ImageIcon, FileText, 
  Check, CheckCheck, Loader2, Users, User, Shield, Smile, MessageSquare,
  Settings2, Trash2,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { uz } from "date-fns/locale"
import { toast } from "sonner"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { getChatSocket, disconnectChatSocket } from "@/lib/chat-socket"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ChatParticipant {
  id: number
  userId: number
  user: {
    id: number
    email: string | null
    firstName: string | null
    lastName: string | null
    role: string
  }
}

interface ChatMessage {
  id: number
  content: string | null
  type: string
  attachmentUrl: string | null
  senderId: number
  isRead: boolean
  createdAt: string
  sender: {
    id: number
    firstName: string | null
    lastName: string | null
  }
}

interface Chat {
  id: number
  type: string
  title: string | null
  imageUrl?: string | null
  createdBy?: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  participants: ChatParticipant[]
  lastMessage: ChatMessage | null
  messageCount: number
  unreadCount?: number
}

function getUserName(p?: { firstName?: string | null; lastName?: string | null; email?: string | null }) {
  if (!p) return "Noma'lum"
  if (p.firstName) return `${p.firstName} ${p.lastName || ""}`.trim()
  return p.email || "Foydalanuvchi"
}

function getInitials(name: string) {
  return name.substring(0, 2).toUpperCase()
}

function getApiOrigin(): string {
  if (typeof window === "undefined") return "http://localhost:3001"
  const env = process.env.NEXT_PUBLIC_API_URL
  if (env && env.startsWith("http")) {
    return env.replace(/\/api\/?$/i, "").replace(/\/+$/, "")
  }
  return "http://localhost:3001"
}

function resolveMediaUrl(path?: string | null) {
  if (!path) return ""
  if (path.startsWith("http")) return path
  const base = getApiOrigin()
  return `${base}${path.startsWith("/") ? path : `/${path}`}`
}

export default function ChatPage() {
  const { user } = useAuth()
  const currentUserId = user?.id

  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  
  const [loadingChats, setLoadingChats] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [messageInput, setMessageInput] = useState("")
  
  // New Group Dialog state
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [memberQuery, setMemberQuery] = useState("")
  const [memberResults, setMemberResults] = useState<Array<{ id: number; email: string | null; firstName: string | null; lastName: string | null }>>([])
  const [memberLoading, setMemberLoading] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<Array<{ id: number; email: string | null; firstName: string | null; lastName: string | null }>>([])
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false)
  const [editGroupTitle, setEditGroupTitle] = useState("")
  const [groupSaving, setGroupSaving] = useState(false)
  const [deleteGroupOpen, setDeleteGroupOpen] = useState(false)
  const [deletingGroup, setDeletingGroup] = useState(false)
  const groupAvatarInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchChats = useCallback(async () => {
    try {
      const res = await apiClient<PaginatedResponse<Chat>>("/chats", {
        params: { limit: 100, search: searchQuery }
      })
      setChats(res.data)
    } catch (e: any) {
      toast.error("Chatlarni yuklashda xatolik: " + e.message)
    } finally {
      setLoadingChats(false)
    }
  }, [searchQuery])

  const refreshChatById = useCallback(async (chatId: number) => {
    try {
      const c = await apiClient<Chat>(`/chats/${chatId}`)
      setChats((prev) =>
        prev.map((x) =>
          x.id === chatId ? { ...x, ...c, lastMessage: x.lastMessage } : x,
        ),
      )
      setActiveChat((prev) =>
        prev?.id === chatId ? { ...prev, ...c, lastMessage: prev.lastMessage } : prev,
      )
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    fetchChats()
    // Real-time will keep sidebar fresh; keep a light refresh on focus.
  }, [fetchChats])

  const fetchMessages = useCallback(async (chatId: number) => {
    setLoadingMessages(true)
    try {
      const res = await apiClient<PaginatedResponse<ChatMessage>>(`/chats/${chatId}/messages`, {
        params: { limit: 100 }
      })
      // Messages come paginated, we need to sort them chronologically for display
      setMessages(res.data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()))
      scrollToBottom()
      fetchChats()
    } catch (e: any) {
      toast.error("Xabarlarni yuklashda xatolik: " + e.message)
    } finally {
      setLoadingMessages(false)
    }
  }, [fetchChats])

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id)
    }
  }, [activeChat, fetchMessages])

  // Socket real-time
  useEffect(() => {
    let cancelled = false
    let detach: (() => void) | undefined

    void getChatSocket().then((s) => {
      if (cancelled || !s) return
      const onNewMessage = (msg: any) => {
        if (!msg?.chatId) return
        if (activeChat?.id === msg.chatId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          scrollToBottom()
          if (msg.senderId !== currentUserId) {
            s.emit("markRead", { chatId: msg.chatId })
          }
        }
        fetchChats()
      }

      const onAddedToChat = (data: any) => {
        if (data?.chatId) {
          fetchChats()
        }
      }

      s.on("newMessage", onNewMessage)
      s.on("addedToChat", onAddedToChat)
      detach = () => {
        s.off("newMessage", onNewMessage)
        s.off("addedToChat", onAddedToChat)
      }
    })

    return () => {
      cancelled = true
      detach?.()
    }
  }, [activeChat?.id, currentUserId, fetchChats])

  useEffect(() => {
    return () => disconnectChatSocket()
  }, [])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!messageInput.trim() || !activeChat) return
    
    setSending(true)
    try {
      await apiClient(`/chats/${activeChat.id}/messages`, {
        method: "POST",
        body: { content: messageInput, type: "text" }
      })
      setMessageInput("")
      // Socket event will update UI; still refresh in case of network delay.
      fetchChats()
    } catch (e: any) {
      toast.error("Xabar yuborishda xatolik: " + e.message)
    } finally {
      setSending(false)
    }
  }

  const uploadAndSendFile = async (file: File) => {
    if (!activeChat) return
    setSending(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/chats/${activeChat.id}/attachments`, {
        method: 'POST',
        body: fd,
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `Upload xatolik: ${res.status}`)
      }
      const data = await res.json()
      await apiClient(`/chats/${activeChat.id}/messages`, {
        method: "POST",
        body: { content: null, type: "attachment", attachmentUrl: data.url }
      })
      fetchChats()
    } catch (e: any) {
      toast.error(e.message || "Fayl yuborilmadi")
    } finally {
      setSending(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return
    try {
      const res = await apiClient<Chat>("/chats", {
        method: "POST",
        body: { title: groupName, type: "GROUP", participantIds: selectedMembers.map(m => m.id) }
      })
      toast.success("Guruh yaratildi")
      setIsNewGroupOpen(false)
      setGroupName("")
      setMemberQuery("")
      setMemberResults([])
      setSelectedMembers([])
      fetchChats()
      setActiveChat(res)
    } catch (e: any) {
      toast.error("Guruh yaratishda xatolik: " + e.message)
    }
  }

  const lookupMembers = useCallback(async (q: string) => {
    const s = q.trim()
    if (!s) { setMemberResults([]); return }
    setMemberLoading(true)
    try {
      const res = await apiClient<{ data: any[] }>(`/chats/participants/lookup`, { params: { q: s } })
      setMemberResults(res.data || [])
    } catch (e: any) {
      setMemberResults([])
    } finally {
      setMemberLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => lookupMembers(memberQuery), 250)
    return () => clearTimeout(t)
  }, [memberQuery, lookupMembers])

  const selectedMemberIds = useMemo(() => new Set(selectedMembers.map(m => m.id)), [selectedMembers])

  useEffect(() => {
    if (groupSettingsOpen && activeChat?.type === "GROUP") {
      setEditGroupTitle(activeChat.title || "")
    }
  }, [groupSettingsOpen, activeChat])

  const handleSaveGroupTitle = async () => {
    if (!activeChat || activeChat.type !== "GROUP") return
    setGroupSaving(true)
    try {
      const updated = await apiClient<Chat>(`/chats/${activeChat.id}`, {
        method: "PATCH",
        body: { title: editGroupTitle.trim() },
      })
      setActiveChat((p) => (p ? { ...p, ...updated, lastMessage: p.lastMessage } : p))
      setChats((list) =>
        list.map((x) => (x.id === activeChat.id ? { ...x, title: updated.title } : x)),
      )
      toast.success("Guruh nomi saqlandi")
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Saqlanmadi"
      toast.error(msg)
    } finally {
      setGroupSaving(false)
    }
  }

  const handleUploadGroupAvatar = async (file: File) => {
    if (!activeChat) return
    setGroupSaving(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch(`/api/chats/${activeChat.id}/avatar`, {
        method: "POST",
        body: fd,
        credentials: "include",
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { message?: string }).message || `Xato ${res.status}`)
      }
      const data = (await res.json()) as Chat
      const url = data.imageUrl
      setActiveChat((p) => (p ? { ...p, ...data, lastMessage: p.lastMessage } : p))
      setChats((list) =>
        list.map((x) => (x.id === activeChat.id ? { ...x, imageUrl: url ?? x.imageUrl } : x)),
      )
      toast.success("Guruh rasmi yangilandi")
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Rasm yuklanmadi"
      toast.error(msg)
    } finally {
      setGroupSaving(false)
    }
  }

  const handleRemoveFromGroup = async (userId: number) => {
    if (!activeChat) return
    try {
      await apiClient(`/chats/${activeChat.id}/participants/${userId}`, { method: "DELETE" })
      toast.success(userId === currentUserId ? "Guruhdan chiqdingiz" : "Ishtirokchi olib tashlandi")
      if (userId === currentUserId) {
        setGroupSettingsOpen(false)
        setActiveChat(null)
      } else {
        await refreshChatById(activeChat.id)
      }
      fetchChats()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Amal bajarilmadi"
      toast.error(msg)
    }
  }

  const handleDeleteGroup = async () => {
    if (!activeChat) return
    setDeletingGroup(true)
    try {
      await apiClient(`/chats/${activeChat.id}`, { method: "DELETE" })
      toast.success("Guruh o'chirildi")
      setDeleteGroupOpen(false)
      setGroupSettingsOpen(false)
      setActiveChat(null)
      fetchChats()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "O'chirilmadi"
      toast.error(msg)
    } finally {
      setDeletingGroup(false)
    }
  }

  const getChatName = (chat: Chat) => {
    if (chat.title) return chat.title
    const otherParticipant = chat.participants.find(p => p.userId !== currentUserId)
    return getUserName(otherParticipant?.user)
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-background border rounded-3xl overflow-hidden shadow-xl shadow-black/5">
      {/* Sidebar - Chat List */}
      <div className="w-80 lg:w-96 flex flex-col border-r bg-muted/10">
        {/* Sidebar Header */}
        <div className="p-4 border-b bg-background z-10 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black tracking-tight">Xabarlar</h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="rounded-full size-8 bg-muted hover:bg-primary/10 hover:text-primary">
                <Search className="size-4" />
              </Button>
              <Button size="icon" className="rounded-full size-8" onClick={() => setIsNewGroupOpen(true)}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
          <div>
            <Input 
              placeholder="Qidirish..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-muted/50 border-none rounded-2xl h-10 px-4"
            />
          </div>
        </div>

        {/* Chats List */}
        <ScrollArea className="flex-1">
          {loadingChats ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : chats.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground text-sm font-medium">Bitta ham suhbat topilmadi</div>
          ) : (
            <div className="p-2 space-y-1">
              {chats.map(chat => {
                const isActive = activeChat?.id === chat.id
                const otherParticipant = chat.participants.find(p => p.userId !== currentUserId)
                const chatName = getChatName(chat)
                
                return (
                  <div 
                    key={chat.id} 
                    onClick={() => setActiveChat(chat)}
                    className={`flex items-center gap-3 p-3 text-sm rounded-2xl cursor-pointer transition-all ${
                      isActive ? "bg-primary/10 text-primary shadow-sm" : "hover:bg-muted/60"
                    }`}
                  >
                    <Avatar className={`size-12 rounded-2xl border-2 ${isActive ? 'border-primary/20' : 'border-transparent'}`}>
                      {chat.type === "GROUP" && chat.imageUrl ? (
                        <AvatarImage src={resolveMediaUrl(chat.imageUrl)} alt="" className="object-cover" />
                      ) : null}
                      <AvatarFallback className={isActive ? "bg-primary text-primary-foreground font-bold" : "font-bold"}>
                        {chat.type === "GROUP" ? <Users className="size-5" /> : getInitials(chatName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`font-bold truncate ${isActive ? "text-primary" : ""}`}>
                          {chatName}
                        </span>
                        {chat.lastMessage && (
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2 font-medium">
                            {format(new Date(chat.lastMessage.createdAt), "HH:mm")}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <p className={`text-xs truncate flex-1 ${isActive ? "text-primary/70" : "text-muted-foreground"}`}>
                          {chat.lastMessage?.content || (chat.lastMessage?.attachmentUrl ? "📸 Media fayl" : "Hali xabar yo'q")}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {(chat.unreadCount ?? 0) > 0 ? (
                            <span className="text-[9px] font-semibold text-amber-600 whitespace-nowrap">O'qilmagan</span>
                          ) : chat.lastMessage ? (
                            <span className="text-[9px] text-muted-foreground whitespace-nowrap">O'qilgan</span>
                          ) : null}
                          {chat.type === "GROUP" && <Badge variant="secondary" className="px-1.5 py-0 text-[8px] rounded-sm">Guruh</Badge>}
                          {!!chat.unreadCount && chat.unreadCount > 0 && (
                            <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center">
                              {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-zinc-950/50 relative">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-6 border-b bg-background flex items-center justify-between z-10 shrink-0">
              <div className="flex items-center gap-4">
                <Avatar className="size-10 rounded-xl">
                  {activeChat.type === "GROUP" && activeChat.imageUrl ? (
                    <AvatarImage src={resolveMediaUrl(activeChat.imageUrl)} alt="" className="object-cover" />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {activeChat.type === "GROUP" ? (
                      <Users className="size-5" />
                    ) : activeChat.type === "SUPPORT" ? (
                      <Shield className="size-5 text-primary" />
                    ) : (
                      <User className="size-5" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold">{getChatName(activeChat)}</h3>
                  <p className="text-xs text-emerald-600 font-medium">
                    {activeChat.type === "GROUP" ? `${activeChat.participants.length} ishtirokchilar` : "Onlayn"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Button variant="ghost" size="icon" className="rounded-full hover:text-primary"><Phone className="size-4" /></Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:text-primary"><Video className="size-4" /></Button>
                <Separator orientation="vertical" className="h-6 mx-1" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full hover:text-primary"><MoreVertical className="size-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {activeChat.type === "GROUP" && (
                      <>
                        <DropdownMenuItem
                          onClick={() => {
                            setGroupSettingsOpen(true)
                            void refreshChatById(activeChat.id)
                          }}
                        >
                          <Settings2 className="size-4 mr-2" /> Guruh sozlamalari
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem><Info className="size-4 mr-2" /> Ma'lumotlar</DropdownMenuItem>
                    <DropdownMenuItem><Search className="size-4 mr-2" /> Qidirish</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-6">
              {loadingMessages && messages.length === 0 ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-muted-foreground size-8" /></div>
              ) : (
                <div className="space-y-6 pb-4">
                  {/* Fake Date Separator */}
                  <div className="flex justify-center text-xs font-medium text-muted-foreground my-4">
                    <span className="bg-muted/50 px-3 py-1 rounded-full border">Bugun</span>
                  </div>

                  {messages.map((msg, idx) => {
                    const isMe = msg.senderId === currentUserId
                    const showAvatar = !isMe && (idx === messages.length - 1 || messages[idx + 1]?.senderId !== msg.senderId)

                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} gap-2`}>
                        {!isMe && (
                          <div className="w-8 flex items-end pb-1">
                            {showAvatar ? (
                              <Avatar className="size-8 rounded-lg border">
                                <AvatarFallback className="text-[10px] bg-white">{getInitials(getUserName(msg.sender))}</AvatarFallback>
                              </Avatar>
                            ) : null}
                          </div>
                        )}
                        
                        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[70%]`}>
                          {!isMe && activeChat.type === "GROUP" && showAvatar && (
                            <span className="text-[10px] font-bold text-muted-foreground ml-1 mb-1">{getUserName(msg.sender)}</span>
                          )}
                          <div 
                            className={`px-4 py-2.5 shadow-sm text-sm ${
                              isMe 
                                ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm" 
                                : "bg-white dark:bg-zinc-900 border rounded-2xl rounded-bl-sm"
                            }`}
                          >
                            {msg.attachmentUrl && (
                              <div className="mb-2">
                                <img src={msg.attachmentUrl} alt="Attachment" className="rounded-xl max-w-full h-auto max-h-64 object-cover" />
                              </div>
                            )}
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {format(new Date(msg.createdAt), "HH:mm")}
                              {isMe && (
                                msg.isRead ? <CheckCheck className="size-3" /> : <Check className="size-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input Area */}
            <div className="p-4 bg-background border-t mt-auto z-10 shrink-0">
              <form onSubmit={handleSendMessage} className="flex items-end gap-3 max-w-4xl mx-auto">
                <div className="flex gap-1 mb-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-muted-foreground hover:text-primary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="size-5" />
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) uploadAndSendFile(file)
                    e.currentTarget.value = ""
                  }}
                />
                <div className="flex-1 relative">
                  <Input 
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Xabar yozing..."
                    className="w-full bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary h-12 rounded-full px-6 pr-12 shadow-inner"
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-1.5 rounded-full text-muted-foreground hover:text-amber-500"
                  >
                    <Smile className="size-5" />
                  </Button>
                </div>
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!messageInput.trim() || sending}
                  className="rounded-full size-12 shadow-lg shadow-primary/20 shrink-0"
                >
                  {sending ? <Loader2 className="animate-spin size-5" /> : <Send className="size-5 ml-1" />}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="size-24 bg-primary/5 rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="size-10 text-primary opacity-50" />
            </div>
            <h2 className="text-2xl font-black mb-2 tracking-tight">Superadmin Chat</h2>
            <p className="text-muted-foreground max-w-md">
              Muloqotni boshlash uchun chap tomondagi ro'yxatdan suhbatdoshni tanlang yoki yangi guruh yarating.
            </p>
            <Button onClick={() => setIsNewGroupOpen(true)} className="mt-8 rounded-full px-8 shadow-xl shadow-primary/20">
              <Plus className="size-4 mr-2" /> Yangi Guruh
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isNewGroupOpen} onOpenChange={setIsNewGroupOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Yangi Guruh Yaratish</DialogTitle>
            <DialogDescription>
              Guruh nomini kiriting va foydalanuvchilarni email orqali qo'shing.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-5">
            <Input 
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Guruh nomi (masalan: Rahbariyat)"
              className="rounded-2xl h-14 px-4 bg-muted/50 text-lg font-medium"
              autoFocus
            />

            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground">Ishtirokchilar (email orqali)</Label>
              <Input
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                placeholder="Email yoki ism bilan qidiring..."
                className="rounded-2xl h-11 bg-muted/30"
              />
              {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedMembers.map((m) => (
                    <Badge
                      key={m.id}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => setSelectedMembers((prev) => prev.filter((x) => x.id !== m.id))}
                    >
                      {getUserName(m as any)} ×
                    </Badge>
                  ))}
                </div>
              )}

              {memberQuery.trim() && (
                <div className="rounded-2xl border bg-background max-h-56 overflow-auto">
                  {memberLoading ? (
                    <div className="p-3 text-xs text-muted-foreground flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" /> Qidirilmoqda...
                    </div>
                  ) : memberResults.length === 0 ? (
                    <div className="p-3 text-xs text-muted-foreground">Natija topilmadi</div>
                  ) : (
                    <div className="p-1">
                      {memberResults.map((u) => {
                        const disabled = u.id === currentUserId || selectedMemberIds.has(u.id)
                        return (
                          <button
                            type="button"
                            key={u.id}
                            disabled={disabled}
                            className={`w-full text-left px-3 py-2 rounded-xl hover:bg-muted/50 disabled:opacity-50`}
                            onClick={() => {
                              setSelectedMembers((prev) => [...prev, u])
                              setMemberQuery("")
                              setMemberResults([])
                            }}
                          >
                            <div className="text-sm font-bold">{getUserName(u as any)}</div>
                            <div className="text-[11px] text-muted-foreground">{u.email || "—"}</div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsNewGroupOpen(false)} className="rounded-xl">Bekor qilish</Button>
            <Button onClick={handleCreateGroup} disabled={!groupName.trim()} className="rounded-xl px-8 shadow-lg shadow-primary/20">
              Yaratish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={groupSettingsOpen} onOpenChange={setGroupSettingsOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Guruh sozlamalari</SheetTitle>
            <SheetDescription>Guruh nomi, logo va ishtirokchilar ro&apos;yxati</SheetDescription>
          </SheetHeader>
          {activeChat?.type === "GROUP" && (
            <div className="space-y-6 py-6">
              <div className="space-y-2">
                <Label>Guruh nomi</Label>
                <Input
                  value={editGroupTitle}
                  onChange={(e) => setEditGroupTitle(e.target.value)}
                  className="rounded-xl"
                />
                <Button onClick={handleSaveGroupTitle} disabled={groupSaving} size="sm" type="button">
                  {groupSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                  Nomi saqlansin
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Guruh rasmi (logo)</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="size-16 rounded-2xl border">
                    {activeChat.imageUrl ? (
                      <AvatarImage
                        src={resolveMediaUrl(activeChat.imageUrl)}
                        alt=""
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback>
                      <Users className="size-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <input
                      ref={groupAvatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) void handleUploadGroupAvatar(f)
                        e.target.value = ""
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => groupAvatarInputRef.current?.click()}
                      disabled={groupSaving}
                    >
                      <ImageIcon className="size-4 mr-2" />
                      Rasm tanlash
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ishtirokchilar</Label>
                <div className="rounded-xl border divide-y max-h-56 overflow-auto">
                  {activeChat.participants.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-2 p-3 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate">{getUserName(p.user)}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {p.user.email || "—"}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive shrink-0"
                        type="button"
                        onClick={() => void handleRemoveFromGroup(p.userId)}
                      >
                        {p.userId === currentUserId ? "Chiqish" : "Olib tashlash"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <SheetFooter className="flex-col gap-2 sm:flex-col border-t pt-4">
                <Button
                  variant="destructive"
                  type="button"
                  onClick={() => setDeleteGroupOpen(true)}
                >
                  <Trash2 className="size-4 mr-2" />
                  Guruhni o&apos;chirish
                </Button>
              </SheetFooter>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteGroupOpen} onOpenChange={setDeleteGroupOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Guruhni o&apos;chirish?</AlertDialogTitle>
            <AlertDialogDescription>
              Barcha xabarlar o&apos;chib ketadi. Bu amalni qaytarib bo&apos;lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel type="button">Bekor qilish</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deletingGroup}
              onClick={() => void handleDeleteGroup()}
            >
              {deletingGroup ? <Loader2 className="animate-spin size-4" /> : "O'chirish"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
