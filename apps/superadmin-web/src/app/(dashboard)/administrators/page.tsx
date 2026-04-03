"use client"

import { useEffect, useState, useCallback } from "react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"

interface User {
  id: number; email: string | null; phone: string | null; firstName: string | null; lastName: string | null
  role: string; isActive: boolean; createdAt: string
}

export default function AdministratorsPage() {
  const [data, setData] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await apiClient<PaginatedResponse<User>>("/users", {
        params: { page, limit: 20, search, role: "ADMINISTRATOR" },
      })
      setData(res.data); setTotal(res.total)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { fetchData() }, [fetchData])

  const columns = [
    {
      key: "name", title: "Ism",
      render: (u: User) => (
        <div>
          <span className="font-medium">{u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.email || u.phone || `#${u.id}`}</span>
          <div className="text-xs text-muted-foreground">{u.email || u.phone}</div>
        </div>
      ),
    },
    {
      key: "isActive", title: "Holat",
      render: (u: User) => <Badge variant={u.isActive ? "default" : "secondary"}>{u.isActive ? "Faol" : "Nofaol"}</Badge>,
    },
    { key: "createdAt", title: "Qo'shilgan sana", render: (u: User) => new Date(u.createdAt).toLocaleDateString("uz-UZ") },
  ]

  return (
    <DataTable
      title="Administratorlar"
      description="Ta'lim markaz administratorlarini boshqarish"
      columns={columns} data={data} total={total} page={page} limit={20}
      loading={loading} error={error}
      searchPlaceholder="Ism yoki email bo'yicha qidirish..."
      onPageChange={setPage} onSearch={setSearch}
    />
  )
}
