"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { ClipboardList, BarChart3, Users, CheckCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/page-header"
import { StatsCard, StatsGrid } from "@/components/stats-card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { classifyApiError, formatEmbeddedApiError } from "@/lib/api-error"
import { AccessDeniedPlaceholder } from "@/components/access-denied-placeholder"

/** GET /assessments/tests — Prisma Test + _count (testResults, questions) */
interface Test {
  id: number
  title: string
  description: string | null
  category: string | null
  type?: string | null
  duration: number | null
  isPublished: boolean
  createdAt: string
  _count?: { questions: number; testResults: number }
}

const LIMIT = 20

export default function TestsPage() {
  const [raw, setRaw] = useState<Test[]>([])
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [selected, setSelected] = useState<Test | null>(null)
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    setPermissionDenied(false)
    try {
      const res = await apiClient<{ data: Test[]; total: number }>("/assessments/tests")
      const list = res.data ?? []
      setRaw(Array.isArray(list) ? list : [])
    } catch (e: unknown) {
      const { permissionDenied: denied } = classifyApiError(e)
      if (denied) setPermissionDenied(true)
      else setError(formatEmbeddedApiError(e))
      setRaw([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filtered = useMemo(() => {
    let list = raw
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.category && t.category.toLowerCase().includes(q)),
      )
    }
    const cat = activeFilters.category
    if (cat && cat !== "all") {
      list = list.filter((t) => (t.category || "") === cat)
    }
    return list
  }, [raw, search, activeFilters])

  const total = filtered.length
  const pageData = useMemo(
    () => filtered.slice((page - 1) * LIMIT, page * LIMIT),
    [filtered, page],
  )

  useEffect(() => {
    setPage(1)
  }, [search, activeFilters])

  const publishedTests = raw.filter((t) => t.isPublished).length
  const totalQuestions = raw.reduce((sum, t) => sum + (t._count?.questions || 0), 0)
  const totalResults = raw.reduce((sum, t) => sum + (t._count?.testResults || 0), 0)

  const categoryOptions = useMemo(() => {
    const set = new Set<string>()
    raw.forEach((t) => {
      if (t.category) set.add(t.category)
    })
    return Array.from(set)
      .sort()
      .map((c) => ({ label: c, value: c }))
  }, [raw])

  const columns = [
    {
      key: "title",
      title: "Nomi",
      render: (t: Test) => (
        <button type="button" onClick={() => setSelected(t)} className="text-left hover:underline">
          <span className="font-medium">{t.title}</span>
          {t.description && (
            <div className="text-xs text-muted-foreground line-clamp-1">{t.description}</div>
          )}
        </button>
      ),
    },
    { key: "category", title: "Kategoriya", render: (t: Test) => t.category || "—" },
    {
      key: "type",
      title: "Tur",
      render: (t: Test) => <span className="text-sm">{t.type || "—"}</span>,
    },
    {
      key: "questions",
      title: "Savollar",
      render: (t: Test) => t._count?.questions ?? 0,
    },
    {
      key: "results",
      title: "Natijalar",
      render: (t: Test) => t._count?.testResults ?? 0,
    },
    {
      key: "duration",
      title: "Vaqt",
      render: (t: Test) => (t.duration ? `${t.duration} daq.` : "—"),
    },
    {
      key: "isPublished",
      title: "Holat",
      render: (t: Test) => (
        <Badge variant={t.isPublished ? "default" : "secondary"}>
          {t.isPublished ? "Nashr etilgan" : "Qoralama"}
        </Badge>
      ),
    },
  ]

  if (!loading && permissionDenied) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Testlar"
          subtitle="Platforma testlar katalogi (global ro'yxat)"
          icon={ClipboardList}
        />
        <AccessDeniedPlaceholder
          title="Testlar katalogiga ruxsat yo'q"
          description="Testlar ro'yxati assessments moduli va platforma ruxsatlariga bog'liq."
          detail={error}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Testlar"
        subtitle="Platforma testlar katalogi (global ro'yxat)"
        icon={ClipboardList}
      />

      <p className="text-sm text-muted-foreground rounded-lg border bg-muted/30 px-4 py-3">
        Testlar bazada markazga biriktirilmagan — barcha markazlar uchun umumiy katalog.{" "}
        <span className="font-medium">GET /assessments/tests</span>
      </p>

      <StatsGrid>
        <StatsCard
          title="Jami testlar"
          value={raw.length}
          icon={ClipboardList}
          loading={loading}
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Nashr etilgan"
          value={publishedTests}
          icon={CheckCircle}
          loading={loading}
          iconColor="text-green-600"
        />
        <StatsCard
          title="Savollar soni"
          value={totalQuestions}
          icon={BarChart3}
          loading={loading}
          iconColor="text-purple-600"
        />
        <StatsCard
          title="Natijalar soni"
          value={totalResults}
          icon={Users}
          loading={loading}
          iconColor="text-orange-600"
        />
      </StatsGrid>

      <DataTable
        title="Testlar ro'yxati"
        description="Barcha psixologik testlar (qidiruv va kategoriya — mijozda filtrlangan)"
        columns={columns}
        data={pageData}
        total={total}
        page={page}
        limit={LIMIT}
        loading={loading}
        error={error}
        searchPlaceholder="Test qidirish..."
        onPageChange={setPage}
        onSearchChange={setSearch}
        activeFilters={activeFilters}
        onFilterChange={(f, v) => setActiveFilters((prev) => ({ ...prev, [f]: v }))}
        filterFields={
          categoryOptions.length
            ? [
                {
                  id: "category",
                  placeholder: "Kategoriya",
                  options: [{ label: "Hammasi", value: "all" }, ...categoryOptions],
                },
              ]
            : undefined
        }
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
                  <div>
                    <span className="text-sm font-medium">Tavsif</span>
                    <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>
                  </div>
                )}
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground">Kategoriya</span>
                    <p className="text-sm font-medium">{selected.category || "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Tur</span>
                    <p className="text-sm font-medium">{selected.type || "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Vaqt</span>
                    <p className="text-sm font-medium">
                      {selected.duration ? `${selected.duration} daqiqa` : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Holat</span>
                    <p className="text-sm font-medium">
                      {selected.isPublished ? "Nashr etilgan" : "Qoralama"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Savollar</span>
                    <p className="text-sm font-medium">{selected._count?.questions ?? 0}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Natijalar</span>
                    <p className="text-sm font-medium">{selected._count?.testResults ?? 0}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <span className="text-xs text-muted-foreground">Yaratilgan</span>
                  <p className="text-sm font-medium">
                    {new Date(selected.createdAt).toLocaleString("uz-UZ")}
                  </p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
