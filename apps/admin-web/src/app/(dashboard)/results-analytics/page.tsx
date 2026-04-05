"use client"

import { useEffect, useState, useCallback } from "react"
import { BarChart3, Users, Award, TrendingUp } from "lucide-react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/page-header"
import { StatsCard, StatsGrid } from "@/components/stats-card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

interface TestResult {
  id: number
  score: number | null
  maxScore: number | null
  percentage: number | null
  status: string
  completedAt: string | null
  createdAt: string
  test: { id: number; title: string; category: string | null } | null
  user: { id: number; email: string | null; firstName: string | null; lastName: string | null } | null
}

export default function ResultsAnalyticsPage() {
  const [data, setData] = useState<TestResult[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<TestResult | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await apiClient<PaginatedResponse<TestResult>>("/test-results", {
        params: { page, limit: 20, search },
      })
      setData(res.data); setTotal(res.total)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { fetchData() }, [fetchData])

  const completed = data.filter(r => r.status === "COMPLETED").length
  const avgScore = data.length > 0
    ? Math.round(data.reduce((sum, r) => sum + (r.percentage || 0), 0) / data.length)
    : 0

  const columns = [
    {
      key: "user", title: "Foydalanuvchi",
      render: (r: TestResult) => (
        <button onClick={() => setSelected(r)} className="text-left hover:underline">
          <span className="font-medium">
            {r.user?.firstName && r.user?.lastName ? `${r.user.firstName} ${r.user.lastName}` : r.user?.email || "—"}
          </span>
        </button>
      ),
    },
    { key: "test", title: "Test", render: (r: TestResult) => r.test?.title || "—" },
    { key: "score", title: "Ball", render: (r: TestResult) => r.score !== null ? `${r.score}/${r.maxScore || "—"}` : "—" },
    { key: "percentage", title: "Foiz", render: (r: TestResult) => r.percentage !== null ? (
      <Badge variant={r.percentage >= 70 ? "default" : r.percentage >= 40 ? "secondary" : "destructive"}>
        {r.percentage}%
      </Badge>
    ) : "—"},
    { key: "status", title: "Holat", render: (r: TestResult) => (
      <Badge variant={r.status === "COMPLETED" ? "default" : "secondary"}>
        {r.status === "COMPLETED" ? "Tugatilgan" : r.status === "IN_PROGRESS" ? "Jarayonda" : r.status}
      </Badge>
    )},
    { key: "completedAt", title: "Sana", render: (r: TestResult) => r.completedAt ? new Date(r.completedAt).toLocaleDateString("uz-UZ") : "—" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Natijalar analitikasi" subtitle="Test natijalari va tahlil" icon={BarChart3} />

      <StatsGrid>
        <StatsCard title="Jami natijalar" value={total} icon={BarChart3} loading={loading} iconColor="text-blue-600" />
        <StatsCard title="Tugatilgan" value={completed} icon={Award} loading={loading} iconColor="text-green-600" />
        <StatsCard title="O'rtacha ball" value={`${avgScore}%`} icon={TrendingUp} loading={loading} iconColor="text-purple-600" />
        <StatsCard title="Foydalanuvchilar" value={new Set(data.map(r => r.user?.id)).size} icon={Users} loading={loading} iconColor="text-orange-600" />
      </StatsGrid>

      <DataTable
        title="Test natijalari" description="Barcha test natijalari"
        columns={columns} data={data} total={total} page={page} limit={20}
        loading={loading} error={error} searchPlaceholder="Natija qidirish..."
        onPageChange={setPage} onSearch={setSearch}
      />

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>
                  {selected.user?.firstName ? `${selected.user.firstName} ${selected.user.lastName || ""}` : selected.user?.email || "Natija"}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div><span className="text-sm font-medium">Test</span><p className="text-sm text-muted-foreground mt-1">{selected.test?.title || "—"}</p></div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="text-xs text-muted-foreground">Ball</span><p className="text-sm font-medium">{selected.score ?? "—"} / {selected.maxScore ?? "—"}</p></div>
                  <div><span className="text-xs text-muted-foreground">Foiz</span><p className="text-sm font-medium">{selected.percentage !== null ? `${selected.percentage}%` : "—"}</p></div>
                  <div><span className="text-xs text-muted-foreground">Holat</span><p className="text-sm font-medium">{selected.status === "COMPLETED" ? "Tugatilgan" : selected.status}</p></div>
                  <div><span className="text-xs text-muted-foreground">Sana</span><p className="text-sm font-medium">{selected.completedAt ? new Date(selected.completedAt).toLocaleString("uz-UZ") : "—"}</p></div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
