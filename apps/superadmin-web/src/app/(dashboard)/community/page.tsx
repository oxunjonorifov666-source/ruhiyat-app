"use client"

import { useEffect, useState, useCallback } from "react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"

interface Post {
  id: number; title: string | null; content: string; likesCount: number; commentsCount: number
  isPublished: boolean; isFlagged: boolean; createdAt: string
  author: { id: number; email: string | null; firstName: string | null; lastName: string | null }
}

export default function CommunityPage() {
  const [data, setData] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await apiClient<PaginatedResponse<Post>>("/community/posts", { params: { page, limit: 20, search } })
      setData(res.data); setTotal(res.total)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { fetchData() }, [fetchData])

  const columns = [
    {
      key: "content", title: "Post",
      render: (p: Post) => (
        <div>
          {p.title && <span className="font-medium">{p.title}</span>}
          <div className="text-sm text-muted-foreground line-clamp-1">{p.content}</div>
        </div>
      ),
    },
    { key: "author", title: "Muallif", render: (p: Post) => p.author?.firstName ? `${p.author.firstName} ${p.author.lastName || ""}` : p.author?.email || `#${p.author?.id}` },
    { key: "likes", title: "Layklar", render: (p: Post) => p.likesCount },
    { key: "comments", title: "Izohlar", render: (p: Post) => p.commentsCount },
    {
      key: "flags", title: "Holat",
      render: (p: Post) => (
        <div className="flex gap-1">
          {p.isFlagged && <Badge variant="destructive">Belgilangan</Badge>}
          <Badge variant={p.isPublished ? "default" : "secondary"}>{p.isPublished ? "Faol" : "Yashirin"}</Badge>
        </div>
      ),
    },
    { key: "createdAt", title: "Sana", render: (p: Post) => new Date(p.createdAt).toLocaleDateString("uz-UZ") },
  ]

  return (
    <DataTable
      title="Hamjamiyat" description="Hamjamiyat postlarini boshqarish"
      columns={columns} data={data} total={total} page={page} limit={20}
      loading={loading} error={error} searchPlaceholder="Post qidirish..."
      onPageChange={setPage} onSearch={setSearch}
    />
  )
}
