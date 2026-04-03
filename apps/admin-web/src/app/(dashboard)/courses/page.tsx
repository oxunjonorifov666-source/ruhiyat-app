"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/components/auth-provider"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"

interface Course {
  id: number
  title: string
  description: string | null
  duration: number | null
  price: number | null
  isActive: boolean
  createdAt: string
  _count?: { enrollments: number; groups: number }
}

export default function CoursesPage() {
  const { user } = useAuth()
  const centerId = user?.administrator?.centerId
  const [data, setData] = useState<Course[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    if (!centerId) return
    setLoading(true); setError(null)
    try {
      const res = await apiClient<PaginatedResponse<Course>>(`/education-centers/${centerId}/courses`, {
        params: { page, limit: 20, search },
      })
      setData(res.data); setTotal(res.total)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [centerId, page, search])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setSaving(true)
    const fd = new FormData(e.currentTarget)
    try {
      await apiClient(`/education-centers/${centerId}/courses`, {
        method: "POST",
        body: {
          title: fd.get("title"),
          description: fd.get("description") || null,
          duration: fd.get("duration") ? parseInt(fd.get("duration") as string) : null,
          price: fd.get("price") ? parseInt(fd.get("price") as string) : null,
        },
      })
      setDialogOpen(false); fetchData()
    } catch (e: any) { alert(e.message) }
    finally { setSaving(false) }
  }

  if (!centerId) return <div className="p-8 text-center text-muted-foreground">Markaz topilmadi</div>

  const columns = [
    { key: "title", title: "Nomi", render: (c: Course) => <span className="font-medium">{c.title}</span> },
    { key: "description", title: "Tavsif", render: (c: Course) => <span className="text-sm text-muted-foreground line-clamp-1">{c.description || "—"}</span> },
    { key: "duration", title: "Davomiyligi", render: (c: Course) => c.duration ? `${c.duration} soat` : "—" },
    { key: "price", title: "Narxi", render: (c: Course) => c.price ? `${c.price.toLocaleString()} so'm` : "Bepul" },
    { key: "enrollments", title: "O'quvchilar", render: (c: Course) => c._count?.enrollments ?? 0 },
    { key: "isActive", title: "Holat", render: (c: Course) => <Badge variant={c.isActive ? "default" : "secondary"}>{c.isActive ? "Faol" : "Nofaol"}</Badge> },
  ]

  return (
    <DataTable
      title="Kurslar" description="Markaz kurslarini boshqarish"
      columns={columns} data={data} total={total} page={page} limit={20}
      loading={loading} error={error} searchPlaceholder="Kurs qidirish..."
      onPageChange={setPage} onSearch={setSearch}
      headerAction={
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-2" />Yangi kurs</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Yangi kurs yaratish</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><Label>Nomi</Label><Input name="title" required /></div>
              <div><Label>Tavsif</Label><Textarea name="description" rows={3} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Davomiyligi (soat)</Label><Input name="duration" type="number" /></div>
                <div><Label>Narxi (so'm)</Label><Input name="price" type="number" /></div>
              </div>
              <Button type="submit" disabled={saving} className="w-full">{saving ? "Saqlanmoqda..." : "Saqlash"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    />
  )
}
