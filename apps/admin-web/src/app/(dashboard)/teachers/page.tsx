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

interface Teacher {
  id: number
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  subject: string | null
  isActive: boolean
  createdAt: string
}

export default function TeachersPage() {
  const { user } = useAuth()
  const centerId = user?.administrator?.centerId
  const [data, setData] = useState<Teacher[]>([])
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
      const res = await apiClient<PaginatedResponse<Teacher>>(`/education-centers/${centerId}/teachers`, {
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
      await apiClient(`/education-centers/${centerId}/teachers`, {
        method: "POST",
        body: { firstName: fd.get("firstName"), lastName: fd.get("lastName"), subject: fd.get("subject") || null, email: fd.get("email") || null, phone: fd.get("phone") || null },
      })
      setDialogOpen(false); fetchData()
    } catch (e: any) { alert(e.message) }
    finally { setSaving(false) }
  }

  if (!centerId) return <div className="p-8 text-center text-muted-foreground">Markaz topilmadi</div>

  const columns = [
    {
      key: "name", title: "Ism",
      render: (t: Teacher) => (
        <div>
          <span className="font-medium">{t.firstName && t.lastName ? `${t.firstName} ${t.lastName}` : t.email || t.phone || `#${t.id}`}</span>
          <div className="text-xs text-muted-foreground">{t.email || t.phone || ""}</div>
        </div>
      ),
    },
    { key: "subject", title: "Fan", render: (t: Teacher) => t.subject || "—" },
    { key: "isActive", title: "Holat", render: (t: Teacher) => <Badge variant={t.isActive ? "default" : "secondary"}>{t.isActive ? "Faol" : "Nofaol"}</Badge> },
    { key: "createdAt", title: "Qo'shilgan sana", render: (t: Teacher) => new Date(t.createdAt).toLocaleDateString("uz-UZ") },
  ]

  return (
    <DataTable
      title="O'qituvchilar" description="Markaz o'qituvchilarini boshqarish"
      columns={columns} data={data} total={total} page={page} limit={20}
      loading={loading} error={error} searchPlaceholder="O'qituvchi qidirish..."
      onPageChange={setPage} onSearch={setSearch}
      headerAction={
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-2" />Yangi o'qituvchi</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Yangi o'qituvchi qo'shish</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Ism</Label><Input name="firstName" required /></div>
                <div><Label>Familiya</Label><Input name="lastName" required /></div>
              </div>
              <div><Label>Fan</Label><Input name="subject" /></div>
              <div><Label>Email</Label><Input name="email" type="email" /></div>
              <div><Label>Telefon</Label><Input name="phone" placeholder="+998..." /></div>
              <Button type="submit" disabled={saving} className="w-full">{saving ? "Saqlanmoqda..." : "Saqlash"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    />
  )
}
