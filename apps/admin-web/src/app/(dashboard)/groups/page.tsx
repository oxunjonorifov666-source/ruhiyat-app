"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/components/auth-provider"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"

interface Group {
  id: number
  name: string
  description: string | null
  maxStudents: number | null
  isActive: boolean
  createdAt: string
  course: { title: string } | null
  _count?: { enrollments: number }
}

export default function GroupsPage() {
  const { user } = useAuth()
  const centerId = user?.administrator?.centerId
  const [data, setData] = useState<Group[]>([])
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
      const res = await apiClient<PaginatedResponse<Group>>(`/education-centers/${centerId}/groups`, {
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
      await apiClient(`/education-centers/${centerId}/groups`, {
        method: "POST",
        body: {
          name: fd.get("name"),
          description: fd.get("description") || null,
          maxStudents: fd.get("maxStudents") ? parseInt(fd.get("maxStudents") as string) : null,
        },
      })
      setDialogOpen(false); fetchData()
    } catch (e: any) { alert(e.message) }
    finally { setSaving(false) }
  }

  if (!centerId) return <div className="p-8 text-center text-muted-foreground">Markaz topilmadi</div>

  const columns = [
    { key: "name", title: "Nomi", render: (g: Group) => <span className="font-medium">{g.name}</span> },
    { key: "course", title: "Kurs", render: (g: Group) => g.course?.title || "—" },
    { key: "enrollments", title: "O'quvchilar", render: (g: Group) => `${g._count?.enrollments ?? 0}${g.maxStudents ? `/${g.maxStudents}` : ""}` },
    { key: "isActive", title: "Holat", render: (g: Group) => <Badge variant={g.isActive ? "default" : "secondary"}>{g.isActive ? "Faol" : "Nofaol"}</Badge> },
    { key: "createdAt", title: "Yaratilgan", render: (g: Group) => new Date(g.createdAt).toLocaleDateString("uz-UZ") },
  ]

  return (
    <DataTable
      title="Guruhlar" description="O'quv guruhlarini boshqarish"
      columns={columns} data={data} total={total} page={page} limit={20}
      loading={loading} error={error} searchPlaceholder="Guruh qidirish..."
      onPageChange={setPage} onSearch={setSearch}
      headerAction={
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-2" />Yangi guruh</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Yangi guruh yaratish</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><Label>Nomi</Label><Input name="name" required /></div>
              <div><Label>Tavsif</Label><Input name="description" /></div>
              <div><Label>Maks. o'quvchilar soni</Label><Input name="maxStudents" type="number" /></div>
              <Button type="submit" disabled={saving} className="w-full">{saving ? "Saqlanmoqda..." : "Saqlash"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    />
  )
}
