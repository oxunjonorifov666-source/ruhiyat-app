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

interface Article {
  id: number; title: string; content: string; category: string | null
  isPublished: boolean; viewCount: number; createdAt: string
}

export default function ArticlesPage() {
  const [data, setData] = useState<Article[]>([])
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
      const res = await apiClient<PaginatedResponse<Article>>("/articles", { params: { page, limit: 20, search } })
      setData(res.data); setTotal(res.total)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setSaving(true)
    const fd = new FormData(e.currentTarget)
    try {
      await apiClient("/articles", {
        method: "POST",
        body: { title: fd.get("title"), content: fd.get("content"), category: fd.get("category") || null, isPublished: true },
      })
      setDialogOpen(false); fetchData()
    } catch (e: any) { alert(e.message) }
    finally { setSaving(false) }
  }

  const columns = [
    { key: "title", title: "Sarlavha", render: (a: Article) => <span className="font-medium">{a.title}</span> },
    { key: "category", title: "Kategoriya", render: (a: Article) => a.category || "Umumiy" },
    { key: "isPublished", title: "Holat", render: (a: Article) => <Badge variant={a.isPublished ? "default" : "secondary"}>{a.isPublished ? "Nashr etilgan" : "Qoralama"}</Badge> },
    { key: "viewCount", title: "Ko'rishlar", render: (a: Article) => a.viewCount?.toLocaleString() || "0" },
    { key: "createdAt", title: "Sana", render: (a: Article) => new Date(a.createdAt).toLocaleDateString("uz-UZ") },
  ]

  return (
    <DataTable
      title="Maqolalar" description="Maqolalarni yaratish va boshqarish"
      columns={columns} data={data} total={total} page={page} limit={20}
      loading={loading} error={error} searchPlaceholder="Maqola qidirish..."
      onPageChange={setPage} onSearch={setSearch}
      headerAction={
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-2" />Yangi maqola</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Yangi maqola yaratish</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><Label>Sarlavha</Label><Input name="title" required /></div>
              <div><Label>Kategoriya</Label><Input name="category" placeholder="Masalan: Psixologiya" /></div>
              <div><Label>Mazmun</Label><Textarea name="content" required rows={6} /></div>
              <Button type="submit" disabled={saving} className="w-full">{saving ? "Saqlanmoqda..." : "Nashr etish"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    />
  )
}
