"use client"

import { useEffect, useState, useCallback } from "react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"

interface Announcement {
  id: number; title: string; content: string; type: string; targetAudience: string
  isPublished: boolean; publishedAt: string | null; createdAt: string
}

export default function AnnouncementsPage() {
  const [data, setData] = useState<Announcement[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await apiClient<PaginatedResponse<Announcement>>("/announcements", { params: { page, limit: 20, search } })
      setData(res.data); setTotal(res.total)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setSaving(true)
    const fd = new FormData(e.currentTarget)
    try {
      await apiClient("/announcements", {
        method: "POST",
        body: { title: fd.get("title"), content: fd.get("content"), type: "general", targetAudience: "all", isPublished: true, publishedAt: new Date().toISOString() },
      })
      setDialogOpen(false); fetchData()
    } catch (e: any) { alert(e.message) }
    finally { setSaving(false) }
  }

  const columns = [
    { key: "title", title: "Sarlavha", render: (a: Announcement) => <span className="font-medium">{a.title}</span> },
    { key: "content", title: "Mazmun", render: (a: Announcement) => <span className="text-sm text-muted-foreground line-clamp-1">{a.content}</span> },
    { key: "targetAudience", title: "Maqsadli guruh", render: (a: Announcement) => a.targetAudience === "all" ? "Barchaga" : a.targetAudience },
    { key: "isPublished", title: "Holat", render: (a: Announcement) => <Badge variant={a.isPublished ? "default" : "secondary"}>{a.isPublished ? "Nashr etilgan" : "Qoralama"}</Badge> },
    { key: "createdAt", title: "Sana", render: (a: Announcement) => new Date(a.createdAt).toLocaleDateString("uz-UZ") },
  ]

  return (
    <DataTable
      title="E'lonlar" description="Platformadagi e'lonlarni boshqarish"
      columns={columns} data={data} total={total} page={page} limit={20}
      loading={loading} error={error} searchPlaceholder="E'lon qidirish..."
      onPageChange={setPage} onSearch={setSearch}
      headerAction={
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-2" />Yangi e'lon</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Yangi e'lon yaratish</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><Label>Sarlavha</Label><Input name="title" required /></div>
              <div><Label>Mazmun</Label><Textarea name="content" required rows={4} /></div>
              <Button type="submit" disabled={saving} className="w-full">{saving ? "Saqlanmoqda..." : "Nashr etish"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    />
  )
}
