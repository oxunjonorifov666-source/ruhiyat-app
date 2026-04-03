"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/components/auth-provider"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"

interface Staff {
  id: number
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  position: string | null
  isActive: boolean
  createdAt: string
}

export default function StaffPage() {
  const { user } = useAuth()
  const centerId = user?.administrator?.centerId
  const [data, setData] = useState<Staff[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!centerId) return
    setLoading(true); setError(null)
    try {
      const res = await apiClient<PaginatedResponse<Staff>>(`/education-centers/${centerId}/staff`, {
        params: { page, limit: 20, search },
      })
      setData(res.data); setTotal(res.total)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [centerId, page, search])

  useEffect(() => { fetchData() }, [fetchData])

  if (!centerId) return <div className="p-8 text-center text-muted-foreground">Markaz topilmadi</div>

  const columns = [
    {
      key: "name", title: "Ism",
      render: (s: Staff) => (
        <div>
          <span className="font-medium">{s.firstName && s.lastName ? `${s.firstName} ${s.lastName}` : s.email || `#${s.id}`}</span>
          <div className="text-xs text-muted-foreground">{s.email || s.phone || ""}</div>
        </div>
      ),
    },
    { key: "position", title: "Lavozim", render: (s: Staff) => s.position || "—" },
    { key: "isActive", title: "Holat", render: (s: Staff) => <Badge variant={s.isActive ? "default" : "secondary"}>{s.isActive ? "Faol" : "Nofaol"}</Badge> },
    { key: "createdAt", title: "Qo'shilgan sana", render: (s: Staff) => new Date(s.createdAt).toLocaleDateString("uz-UZ") },
  ]

  return (
    <DataTable
      title="Xodimlar" description="Markaz xodimlarini boshqarish"
      columns={columns} data={data} total={total} page={page} limit={20}
      loading={loading} error={error} searchPlaceholder="Xodim qidirish..."
      onPageChange={setPage} onSearch={setSearch}
    />
  )
}
