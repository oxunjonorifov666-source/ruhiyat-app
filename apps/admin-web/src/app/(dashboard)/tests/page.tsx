"use client"

import { useEffect, useState, useCallback } from "react"
import { ClipboardList, BarChart3, Users, CheckCircle } from "lucide-react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/page-header"
import { StatsCard, StatsGrid } from "@/components/stats-card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/auth-provider"
import { buildCenterEndpoint } from "@/lib/endpoints"

interface Test {
  id: number
  title: string
  description: string | null
  category: string | null
  difficulty: string | null
  duration: number | null
  isPublished: boolean
  createdAt: string
  _count?: { questions: number; results: number }
}

const difficultyLabels: Record<string, string> = {
  EASY: "Oson", MEDIUM: "O'rta", HARD: "Qiyin",
}

export default function TestsPage() {
  const { user } = useAuth()
  const centerId = user?.administrator?.centerId
  const [data, setData] = useState<Test[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Test | null>(null)
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const endpoint = buildCenterEndpoint("tests", centerId, false)
      const res = await apiClient<any>(endpoint, {
        params: { page, limit: 20, search, difficulty: activeFilters.difficulty !== "all" ? activeFilters.difficulty : undefined },
      })
      const respData = res.data || (Array.isArray(res) ? res : [])
      const respTotal = res.total ?? (Array.isArray(res) ? res.length : 0)
      setData(respData); setTotal(respTotal)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [centerId, page, search, activeFilters])

  useEffect(() => { fetchData() }, [fetchData])

  const totalTests = total
  const publishedTests = (data || []).filter(t => t.isPublished).length
  const totalQuestions = data.reduce((sum, t) => sum + (t._count?.questions || 0), 0)
  const totalResults = data.reduce((sum, t) => sum + (t._count?.results || 0), 0)

  const columns = [
    {
      key: "title", title: "Nomi",
      render: (t: Test) => (
        <button onClick={() => setSelected(t)} className="text-left hover:underline">
          <span className="font-medium">{t.title}</span>
          {t.description && <div className="text-xs text-muted-foreground line-clamp-1">{t.description}</div>}
        </button>
      ),
    },
    { key: "category", title: "Kategoriya", render: (t: Test) => t.category || "—" },
    { key: "difficulty", title: "Qiyinlik", render: (t: Test) => (
      <Badge variant="outline">{difficultyLabels[t.difficulty || ""] || t.difficulty || "—"}</Badge>
    )},
    { key: "questions", title: "Savollar", render: (t: Test) => t._count?.questions || 0 },
    { key: "results", title: "Natijalar", render: (t: Test) => t._count?.results || 0 },
    { key: "duration", title: "Vaqt", render: (t: Test) => t.duration ? `${t.duration} daq.` : "—" },
    { key: "isPublished", title: "Holat", render: (t: Test) => (
      <Badge variant={t.isPublished ? "default" : "secondary"}>{t.isPublished ? "Nashr etilgan" : "Qoralama"}</Badge>
    )},
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Testlar" subtitle="Psixologik testlarni ko'rish va boshqarish" icon={ClipboardList} />

      <StatsGrid>
        <StatsCard title="Jami testlar" value={totalTests} icon={ClipboardList} loading={loading} iconColor="text-blue-600" />
        <StatsCard title="Nashr etilgan" value={publishedTests} icon={CheckCircle} loading={loading} iconColor="text-green-600" />
        <StatsCard title="Savollar soni" value={totalQuestions} icon={BarChart3} loading={loading} iconColor="text-purple-600" />
        <StatsCard title="Natijalar soni" value={totalResults} icon={Users} loading={loading} iconColor="text-orange-600" />
      </StatsGrid>

      <DataTable
        title="Testlar ro'yxati" description="Barcha psixologik testlar"
        columns={columns} data={data} total={total} page={page} limit={20}
        loading={loading} error={error} searchPlaceholder="Test qidirish..."
        onPageChange={setPage} onSearchChange={setSearch}
        activeFilters={activeFilters}
        onFilterChange={(f, v) => setActiveFilters(prev => ({ ...prev, [f]: v }))}
        filterFields={[
          { id: "difficulty", placeholder: "Qiyinlik", options: [{ label: "Oson", value: "EASY" }, { label: "O'rta", value: "MEDIUM" }, { label: "Qiyin", value: "HARD" }] }
        ]}
      />

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.title}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {selected.description && (
                  <div><span className="text-sm font-medium">Tavsif</span><p className="text-sm text-muted-foreground mt-1">{selected.description}</p></div>
                )}
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="text-xs text-muted-foreground">Kategoriya</span><p className="text-sm font-medium">{selected.category || "—"}</p></div>
                  <div><span className="text-xs text-muted-foreground">Qiyinlik</span><p className="text-sm font-medium">{difficultyLabels[selected.difficulty || ""] || selected.difficulty || "—"}</p></div>
                  <div><span className="text-xs text-muted-foreground">Vaqt</span><p className="text-sm font-medium">{selected.duration ? `${selected.duration} daqiqa` : "—"}</p></div>
                  <div><span className="text-xs text-muted-foreground">Holat</span><p className="text-sm font-medium">{selected.isPublished ? "Nashr etilgan" : "Qoralama"}</p></div>
                  <div><span className="text-xs text-muted-foreground">Savollar</span><p className="text-sm font-medium">{selected._count?.questions || 0}</p></div>
                  <div><span className="text-xs text-muted-foreground">Natijalar</span><p className="text-sm font-medium">{selected._count?.results || 0}</p></div>
                </div>
                <Separator />
                <div><span className="text-xs text-muted-foreground">Yaratilgan</span><p className="text-sm font-medium">{new Date(selected.createdAt).toLocaleString("uz-UZ")}</p></div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
