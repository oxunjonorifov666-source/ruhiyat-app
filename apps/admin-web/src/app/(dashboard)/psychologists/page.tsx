"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/components/auth-provider"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"

interface Psychologist {
  id: number
  firstName: string
  lastName: string
  specialization: string | null
  experienceYears: number | null
  isVerified: boolean
  isAvailable: boolean
  rating: number | null
  user: { email: string | null; phone: string | null } | null
  createdAt: string
}

export default function PsychologistsPage() {
  const { user } = useAuth()
  const centerId = user?.administrator?.centerId
  const [data, setData] = useState<Psychologist[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params: Record<string, any> = { page, limit: 20, search }
      if (centerId) params.centerId = centerId
      const res = await apiClient<PaginatedResponse<Psychologist>>("/psychologists", { params })
      setData(res.data); setTotal(res.total)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [centerId, page, search])

  useEffect(() => { fetchData() }, [fetchData])

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
      title="Psixologlar" description="Markaz psixologlarini ko'rish"
      columns={columns} data={data} total={total} page={page} limit={20}
      loading={loading} error={error} searchPlaceholder="Psixolog qidirish..."
      onPageChange={setPage} onSearch={setSearch}
    />
  )
}
