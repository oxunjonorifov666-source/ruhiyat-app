"use client"

import { useEffect, useState, useCallback } from "react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"

interface Psychologist {
  id: number
  firstName: string
  lastName: string
  specialization: string | null
  experienceYears: number | null
  isVerified: boolean
  isAvailable: boolean
  rating: number | null
  hourlyRate: number | null
  user: { email: string | null; phone: string | null } | null
  center: { name: string } | null
  createdAt: string
}

export default function PsychologistsPage() {
  const [data, setData] = useState<Psychologist[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient<PaginatedResponse<Psychologist>>("/psychologists", {
        params: { page, limit: 20, search },
      })
      setData(res.data)
      setTotal(res.total)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    try {
      await apiClient("/psychologists", {
        method: "POST",
        body: {
          firstName: fd.get("firstName"),
          lastName: fd.get("lastName"),
          email: fd.get("email") || null,
          phone: fd.get("phone") || null,
          specialization: fd.get("specialization") || null,
          licenseNumber: fd.get("licenseNumber") || null,
          experienceYears: fd.get("experienceYears") ? parseInt(fd.get("experienceYears") as string) : null,
          hourlyRate: fd.get("hourlyRate") ? parseInt(fd.get("hourlyRate") as string) : null,
        },
      })
      setDialogOpen(false)
      fetchData()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      key: "name", title: "Ism",
      render: (p: Psychologist) => (
        <div>
          <span className="font-medium">{p.firstName} {p.lastName}</span>
          <div className="text-xs text-muted-foreground">{p.user?.email || p.user?.phone || ""}</div>
        </div>
      ),
    },
    { key: "specialization", title: "Mutaxassislik", render: (p: Psychologist) => p.specialization || "—" },
    { key: "experience", title: "Tajriba", render: (p: Psychologist) => p.experienceYears ? `${p.experienceYears} yil` : "—" },
    { key: "center", title: "Markaz", render: (p: Psychologist) => p.center?.name || "Mustaqil" },
    {
      key: "status", title: "Holat",
      render: (p: Psychologist) => (
        <div className="flex gap-1 flex-wrap">
          <Badge variant={p.isVerified ? "default" : "secondary"}>{p.isVerified ? "Tasdiqlangan" : "Kutilmoqda"}</Badge>
          <Badge variant={p.isAvailable ? "default" : "outline"}>{p.isAvailable ? "Mavjud" : "Band"}</Badge>
        </div>
      ),
    },
    { key: "rating", title: "Reyting", render: (p: Psychologist) => p.rating ? `${p.rating.toFixed(1)} ★` : "—" },
  ]

  return (
    <DataTable
      title="Psixologlar"
      description="Barcha psixologlarni boshqarish"
      columns={columns} data={data} total={total} page={page} limit={20}
      loading={loading} error={error}
      searchPlaceholder="Ism yoki mutaxassislik bo'yicha qidirish..."
      onPageChange={setPage} onSearch={setSearch}
      headerAction={
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="size-4 mr-2" />Yangi psixolog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Yangi psixolog qo'shish</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Ism</Label><Input name="firstName" required /></div>
                <div><Label>Familiya</Label><Input name="lastName" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Email</Label><Input name="email" type="email" /></div>
                <div><Label>Telefon</Label><Input name="phone" placeholder="+998..." /></div>
              </div>
              <div><Label>Mutaxassislik</Label><Input name="specialization" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Litsenziya raqami</Label><Input name="licenseNumber" /></div>
                <div><Label>Tajriba (yil)</Label><Input name="experienceYears" type="number" /></div>
              </div>
              <div><Label>Soatlik narx (so'm)</Label><Input name="hourlyRate" type="number" /></div>
              <Button type="submit" disabled={saving} className="w-full">{saving ? "Saqlanmoqda..." : "Saqlash"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    />
  )
}
