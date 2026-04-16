"use client"

import { useEffect, useState, useCallback } from "react"
import { 
  Globe, MessageSquare, Heart, ShieldAlert, ShieldCheck, 
  MoreHorizontal, Trash2, Shield, Loader2, Image as ImageIcon, 
  Search, SlidersHorizontal, User, Clock, ArrowRight, CornerDownRight, Check
} from "lucide-react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, 
  DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { formatDistanceToNow } from "date-fns"
import { uz } from "date-fns/locale"
import { toast } from "sonner"

interface Comment {
  id: number
  content: string
  createdAt: string
  author: {
    id: number
    firstName: string | null
    lastName: string | null
    email: string | null
  }
}

interface PostDetail {
  id: number
  title: string | null
  content: string
  imageUrl: string | null
  likesCount: number
  commentsCount: number
  isPublished: boolean
  isFlagged: boolean
  createdAt: string
  updatedAt: string
  author: {
    id: number
    email: string | null
    firstName: string | null
    lastName: string | null
  }
  comments?: Comment[]
  isLiked?: boolean
}

interface PostReport {
  id: number
  subject: string
  description: string | null
  status: string
  priority: string
  createdAt: string
  reporter: {
    id: number
    email: string | null
    firstName: string | null
    lastName: string | null
  }
}

export default function CommunityPage() {
  const [data, setData] = useState<PostDetail[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<"published" | "unpublished" | "flagged">("published")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  
  // Dialogs
  const [selectedPost, setSelectedPost] = useState<PostDetail | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [reportsLoading, setReportsLoading] = useState(false)
  const [reports, setReports] = useState<PostReport[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const tabParams =
        tab === "flagged"
          ? { isFlagged: "true" }
          : tab === "unpublished"
            ? { isPublished: "false" }
            : { isPublished: "true" }
      const res = await apiClient<PaginatedResponse<PostDetail>>("/community/posts", {
        params: { page, limit, search, ...tabParams }
      })
      setData(res.data)
      setTotal(res.total)
    } catch (e: any) {
      toast.error(e.message || "Postlarni yuklashda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }, [search, tab, page, limit])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openDetail = async (post: PostDetail) => {
    setSelectedPost(post)
    setIsDetailOpen(true)
    setCommentsLoading(true)
    setReports([])
    setReportsLoading(!!post.isFlagged)
    try {
      // The backend returns comments with the post or via separate endpoint.
      // Based on controller: @Get('community/posts/:id/comments') gets comments.
      const commentsRes = await apiClient<Comment[]>(`/community/posts/${post.id}/comments`)
      setSelectedPost((prev) => prev ? { ...prev, comments: commentsRes } : null)

      if (post.isFlagged) {
        const reportsRes = await apiClient<PostReport[]>(`/community/posts/${post.id}/reports`)
        setReports(reportsRes)
      }
    } catch (e: any) {
      toast.error("Izohlarni yuklashda xatolik")
    } finally {
      setCommentsLoading(false)
      setReportsLoading(false)
    }
  }

  const handleTogglePublish = async (post: PostDetail) => {
    setActionLoading(true)
    try {
      await apiClient(`/community/posts/${post.id}`, {
        method: "PATCH",
        body: { isPublished: !post.isPublished }
      })
      toast.success(post.isPublished ? "Post yashirildi" : "Post nashr etildi")
      fetchData()
      if (selectedPost?.id === post.id) {
         setSelectedPost({ ...selectedPost, isPublished: !post.isPublished })
      }
    } catch (e: any) {
      toast.error("Amalni bajarishda xatolik: " + e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleClearFlags = async (post: PostDetail) => {
    setActionLoading(true)
    try {
      await apiClient(`/community/posts/${post.id}`, {
        method: "PATCH",
        body: { isFlagged: false }
      })
      toast.success("Moderatsiya qarori qaytarildi")
      fetchData()
      if (selectedPost?.id === post.id) {
         setSelectedPost({ ...selectedPost, isFlagged: false })
      }
    } catch (e: any) {
      toast.error("Xatolik: " + e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (postId: number) => {
    if (!confirm("Haqiqatan ham o'chirmoqchimisiz?")) return
    setActionLoading(true)
    try {
      await apiClient(`/community/posts/${postId}`, { method: "DELETE" })
      toast.success("Post o'chirildi")
      setIsDetailOpen(false)
      fetchData()
    } catch (e: any) {
      toast.error("Xatolik: " + e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const getUserName = (user: { firstName?: string | null; lastName?: string | null; email?: string | null }) => {
    if (user.firstName) return `${user.firstName} ${user.lastName || ""}`.trim()
    return user.email || "Noma'lum foydalanuvchi"
  }

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase()

  return (
    <div className="space-y-8 pb-10">
      {/* Header Area */}
      <div className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl shadow-fuchsia-900/20 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none mix-blend-overlay">
           <Globe className="w-64 h-64" />
         </div>
         <div className="relative z-10">
            <Badge className="bg-white/20 hover:bg-white/30 text-white mb-4 border-transparent backdrop-blur-md">Ruhiyat Community</Badge>
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Hamjamiyat va Forum</h1>
            <p className="text-white/80 max-w-2xl text-lg font-medium">
               Foydalanuvchilar fikrlari, maqolalari va muhokamalar maydoni. Kontent filtratsiyasi, moderatsiya va ijtimoiy faollikni shu yerdan nazorat qiling.
            </p>
         </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8 items-start">
        {/* Main Feed */}
        <div className="lg:col-span-3 space-y-6">
          {/* Feed Controls */}
          <div className="flex bg-background border rounded-2xl p-2 shadow-sm items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-5" />
              <Input 
                placeholder="Postlar, mualliflar yoki kalit so'zlarni qidirish..." 
                className="border-none bg-transparent h-12 pl-10 text-base shadow-none focus-visible:ring-0"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Separator orientation="vertical" className="h-8 mx-2" />
            <Button variant="ghost" className="rounded-xl font-bold bg-muted/50 hover:bg-muted text-foreground">
               <SlidersHorizontal className="mr-2 size-4" /> Filterlar
            </Button>
          </div>

          {/* Moderation Tabs */}
          <div className="flex gap-2">
            <Button
              variant={tab === "published" ? "default" : "outline"}
              className="rounded-2xl font-bold"
              onClick={() => { setTab("published"); setPage(1); }}
            >
              <ShieldCheck className="size-4 mr-2" /> Published
            </Button>
            <Button
              variant={tab === "unpublished" ? "default" : "outline"}
              className="rounded-2xl font-bold"
              onClick={() => { setTab("unpublished"); setPage(1); }}
            >
              <Shield className="size-4 mr-2" /> Unpublished
            </Button>
            <Button
              variant={tab === "flagged" ? "destructive" : "outline"}
              className="rounded-2xl font-bold"
              onClick={() => { setTab("flagged"); setPage(1); }}
            >
              <ShieldAlert className="size-4 mr-2" /> Flagged
            </Button>
          </div>

          {loading ? (
             <div className="flex justify-center p-12 bg-background border rounded-3xl"><Loader2 className="animate-spin text-muted-foreground size-10" /></div>
          ) : data.length === 0 ? (
             <div className="flex flex-col justify-center items-center p-16 bg-background border border-dashed rounded-3xl text-muted-foreground text-center">
                <MessageSquare className="size-16 mb-4 opacity-20" />
                <h3 className="text-xl font-bold text-foreground mb-2">Postlar topilmadi</h3>
                <p>Joriy filter yoki qidiruv so'rovi bo'yicha ma'lumot yo'q.</p>
             </div>
          ) : (
             <div className="space-y-6">
                {data.map(post => (
                   <div key={post.id} className="bg-background border rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                      {/* Post Header */}
                      <div className="p-6 flex justify-between items-start">
                         <div className="flex gap-4">
                            <Avatar className="size-12 border-2 border-background shadow-md">
                               <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.email}`} />
                               <AvatarFallback className="font-bold bg-primary/10 text-primary">{getInitials(getUserName(post.author))}</AvatarFallback>
                            </Avatar>
                            <div>
                               <h4 className="font-bold text-base flex items-center gap-2">
                                 {getUserName(post.author)}
                                 {post.author.email?.includes("admin") && <Check className="size-4 text-white bg-blue-500 rounded-full p-0.5" />}
                               </h4>
                               <p className="text-xs text-muted-foreground flex items-center">
                                 <Clock className="size-3 mr-1" />
                                 {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: uz })}
                               </p>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            {post.isFlagged && (
                               <Badge variant="destructive" className="animate-pulse shadow-lg shadow-red-500/20"><ShieldAlert className="size-3 mr-1" /> Shikoyat</Badge>
                            )}
                            {!post.isPublished && (
                               <Badge variant="secondary"><Shield className="size-3 mr-1" /> Nofaol</Badge>
                            )}
                            <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                 <Button variant="ghost" size="icon" className="rounded-full"><MoreHorizontal className="size-5" /></Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end" className="w-56 rounded-xl">
                                  <DropdownMenuItem onClick={() => openDetail(post)}>To'liq ko'rish</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleTogglePublish(post)}>
                                     {post.isPublished ? "Postni yashirish (Muzlatish)" : "Ommaviy nashr etish"}
                                  </DropdownMenuItem>
                                  {post.isFlagged && (
                                    <DropdownMenuItem onClick={() => handleClearFlags(post)} className="text-amber-600">Shikoyatlarni bekor qilish</DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleDelete(post.id)} className="text-destructive">
                                     <Trash2 className="size-4 mr-2" /> O'chirish
                                  </DropdownMenuItem>
                               </DropdownMenuContent>
                            </DropdownMenu>
                         </div>
                      </div>

                      {/* Post Content */}
                      <div className="px-6 pb-4">
                         {post.title && <h3 className="text-xl font-bold tracking-tight mb-2">{post.title}</h3>}
                         <p className="text-sm/relaxed text-muted-foreground whitespace-pre-wrap">{post.content}</p>
                      </div>

                      {/* Post Media */}
                      {post.imageUrl && (
                         <div className="px-6 pb-2">
                            <div className="rounded-2xl border overflow-hidden bg-muted flex items-center justify-center max-h-[500px]">
                               <img src={post.imageUrl} alt="Post biriktirma" className="w-full h-full object-cover" />
                            </div>
                         </div>
                      )}

                      {/* Post Footer/Stats */}
                      <div className="p-4 px-6 bg-muted/30 border-t flex items-center gap-6">
                         <div className="flex items-center gap-2 text-pink-600 font-bold bg-pink-500/10 px-3 py-1.5 rounded-full text-sm">
                            <Heart className="size-4 fill-pink-600" /> {post.likesCount}
                         </div>
                         <Button variant="ghost" size="sm" onClick={() => openDetail(post)} className="text-blue-600 font-bold hover:bg-blue-500/10 rounded-full px-4 border">
                            <MessageSquare className="size-4 mr-2 fill-blue-600/20" /> {post.commentsCount} Kamentariya
                         </Button>
                         <Button variant="ghost" size="sm" onClick={() => openDetail(post)} className="ml-auto rounded-full font-bold">
                            Moderatsiya <ArrowRight className="size-4 ml-1" />
                         </Button>
                      </div>
                   </div>
                ))}

                {/* Pagination */}
                <div className="flex items-center justify-between bg-background border rounded-2xl p-4">
                  <div className="text-sm text-muted-foreground font-medium">
                    {total} ta natija • Sahifa {page}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="rounded-xl font-bold"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Oldingi
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-xl font-bold"
                      disabled={page * limit >= total}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Keyingi
                    </Button>
                  </div>
                </div>
             </div>
          )}
        </div>

        {/* Right Sidebar Stats & Active Users */}
        <div className="space-y-6">
           <div className="bg-background border rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold flex items-center mb-6"><SlidersHorizontal className="size-5 text-primary mr-2" /> Hamjamiyat Holati</h3>
              <div className="space-y-6">
                 <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Jami nashrlar</p>
                    <p className="text-3xl font-black tracking-tight">{total}</p>
                 </div>
                 <Separator />
                 <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Moderatsiya navbati</p>
                    <div className="flex items-end gap-3">
                       <p className="text-3xl font-black tracking-tight text-red-500">{tab === "flagged" ? total : data.filter(p => p.isFlagged).length}</p>
                       <Badge variant="destructive" className="mb-1 rounded-full"><ShieldAlert className="size-3 mr-1" /> Xavf</Badge>
                    </div>
                 </div>
                 <Separator />
                 <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Yangi ishtirokchilar</p>
                    <div className="flex -space-x-3 mt-2">
                       {[1,2,3,4,5].map(i => (
                         <Avatar key={i} className="border-2 border-background size-10">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=new${i}`} />
                         </Avatar>
                       ))}
                    </div>
                 </div>
                 <Button className="w-full rounded-2xl shadow-lg mt-4 h-12 font-bold" onClick={fetchData}>
                   Yangilash
                 </Button>
              </div>
           </div>

           <div className="bg-background border rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold mb-4 flex items-center"><User className="size-5 text-amber-500 mr-2" /> Qoidalarni sozlash</h3>
              <p className="text-sm text-muted-foreground mb-4 font-medium">Barcha postlar uchun so'z filtrlash va avtomatik qulflashni sozlang.</p>
              <Button variant="outline" className="w-full rounded-2xl border-2 font-bold">Siyosatlarni ko'rish</Button>
           </div>
        </div>
      </div>

      {/* Moderation Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none shadow-2xl rounded-[2rem] h-[85vh] flex flex-col">
          {selectedPost && (
             <>
               <div className="p-6 bg-muted/50 border-b flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-4">
                     <Avatar className="size-12 border shadow-sm">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedPost.author.email}`} />
                        <AvatarFallback>{getInitials(getUserName(selectedPost.author))}</AvatarFallback>
                     </Avatar>
                     <div>
                        <h3 className="font-bold text-lg">{getUserName(selectedPost.author)}</h3>
                        <p className="text-sm text-muted-foreground">{selectedPost.author.email}</p>
                     </div>
                  </div>
                  <div>
                    {selectedPost.isFlagged && <Badge variant="destructive" className="mr-2">Shikoyat tushgan</Badge>}
                    <Badge variant={selectedPost.isPublished ? "default" : "secondary"}>
                       {selectedPost.isPublished ? "Ommaviy faol" : "Muzlatilgan"}
                    </Badge>
                  </div>
               </div>

               <ScrollArea className="flex-1">
                  <div className="p-8 space-y-6">
                     <div className="prose max-w-none">
                        {selectedPost.title && <h2 className="text-2xl font-black mb-3">{selectedPost.title}</h2>}
                        <p className="text-base/relaxed font-medium whitespace-pre-wrap">{selectedPost.content}</p>
                     </div>

                     {selectedPost.imageUrl && (
                        <div className="rounded-2xl overflow-hidden border">
                           <img src={selectedPost.imageUrl} alt="Media" className="w-full" />
                        </div>
                     )}

                     <Separator className="my-8" />

                     <div>
                        <h3 className="font-bold text-lg mb-6 flex items-center">
                           <MessageSquare className="size-5 mr-2 text-primary" /> Kamentariyalar ({selectedPost.commentsCount})
                        </h3>
                        
                        {commentsLoading ? (
                           <div className="flex justify-center py-6"><Loader2 className="animate-spin text-muted-foreground" /></div>
                        ) : selectedPost.comments?.length ? (
                           <div className="space-y-4">
                              {selectedPost.comments.map(comment => (
                                 <div key={comment.id} className="flex gap-4">
                                    <CornerDownRight className="size-5 text-muted-foreground shrink-0 mt-2" />
                                    <div className="bg-muted/40 p-4 rounded-2xl flex-1 border">
                                       <div className="flex justify-between items-center mb-2">
                                          <span className="font-bold text-sm">{getUserName(comment.author)}</span>
                                          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                                             {formatDistanceToNow(new Date(comment.createdAt), { locale: uz })}
                                          </span>
                                       </div>
                                       <p className="text-sm whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        ) : (
                           <p className="text-center bg-muted/30 py-8 rounded-2xl border border-dashed font-medium text-muted-foreground">
                             Bu nashrda hozircha hech qanday kamentariya yo'q
                           </p>
                        )}
                     </div>

                     {selectedPost.isFlagged && (
                       <>
                         <Separator className="my-8" />
                         <div>
                           <h3 className="font-bold text-lg mb-4 flex items-center">
                             <ShieldAlert className="size-5 mr-2 text-destructive" /> Shikoyatlar
                           </h3>
                           {reportsLoading ? (
                             <div className="flex justify-center py-6"><Loader2 className="animate-spin text-muted-foreground" /></div>
                           ) : reports.length ? (
                             <div className="space-y-3">
                               {reports.map((r) => (
                                 <div key={r.id} className="border rounded-2xl p-4 bg-muted/30">
                                   <div className="flex items-center justify-between gap-3">
                                     <div className="font-bold">{r.subject}</div>
                                     <Badge variant="secondary" className="rounded-full">{r.status}</Badge>
                                   </div>
                                   {r.description ? <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{r.description}</p> : null}
                                   <div className="text-xs text-muted-foreground mt-3">
                                     Reporter: {getUserName(r.reporter)} • {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: uz })}
                                   </div>
                                 </div>
                               ))}
                             </div>
                           ) : (
                             <p className="text-sm text-muted-foreground">Shikoyat detali topilmadi.</p>
                           )}
                         </div>
                       </>
                     )}
                  </div>
               </ScrollArea>

               <div className="p-4 bg-background border-t shrink-0 flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-xl h-12 font-bold"
                    onClick={() => handleTogglePublish(selectedPost)}
                    disabled={actionLoading}
                  >
                    {selectedPost.isPublished ? "Nashrni yashirish (O'chirmasdan)" : "Ommaga faollashtirish"}
                  </Button>
                  
                  {selectedPost.isFlagged && (
                     <Button 
                       variant="secondary" 
                       className="flex-1 rounded-xl h-12 font-bold text-amber-600 border-amber-200 bg-amber-50"
                       onClick={() => handleClearFlags(selectedPost)}
                       disabled={actionLoading}
                     >
                        Shikoyat xavfini olib tashlash
                     </Button>
                  )}

                  <Button 
                    variant="destructive" 
                    className="flex-1 rounded-xl h-12 font-bold shadow-lg shadow-red-500/20"
                    onClick={() => handleDelete(selectedPost.id)}
                    disabled={actionLoading}
                  >
                     <Trash2 className="size-4 mr-2" /> Tizimdan butunlay o'chirish
                  </Button>
               </div>
             </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
