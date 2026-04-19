"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { BarChart3, Users, Award, TrendingUp, Info } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/page-header"
import { StatsCard, StatsGrid } from "@/components/stats-card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/auth-provider"
import { classifyApiError, formatEmbeddedApiError } from "@/lib/api-error"
import { AccessDeniedPlaceholder } from "@/components/access-denied-placeholder"

/** GET /assessments/test-results — Prisma TestResult + test; user optional unless backend extends include */
interface TestResultApi {
  id: number
  userId: number
  testId: number
  score: number | null
  maxScore: number | null
  completedAt: string | null
  createdAt: string
  test: { id: number; title: string; category: string | null; description?: string | null } | null
  user?: { id: number; email: string | null; firstName: string | null; lastName: string | null } | null
}

type Row = TestResultApi & {
  percentage: number | null
  status: string
}

const LIMIT = 20

function normalizeRow(r: TestResultApi): Row {
  const pct =
    r.maxScore != null && r.maxScore > 0 && r.score != null
      ? Math.round((r.score / r.maxScore) * 100)
      : null
  return {
    ...r,
    percentage: pct,
    status: r.completedAt ? "COMPLETED" : "IN_PROGRESS",
  }
}

function displayUserName(r: Row): string {
  const u = r.user
  if (u && (u.firstName || u.lastName)) {
    return `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || `Foydalanuvchi #${r.userId}`
  }
  if (u?.email) return u.email
  return `Foydalanuvchi #${r.userId}`
}

export default function ResultsAnalyticsPage() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === "SUPERADMIN"

  const [raw, setRaw] = useState<Row[]>([])
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [selected, setSelected] = useState<Row | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    setPermissionDenied(false)
    try {
      const res = await apiClient<{ data: TestResultApi[]; total: number }>("/assessments/test-results")
      const list = res.data ?? []
      setRaw((Array.isArray(list) ? list : []).map(normalizeRow))
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
    const q = search.trim().toLowerCase()
    if (!q) return raw
    return raw.filter((r) => {
      const testTitle = r.test?.title?.toLowerCase() ?? ""
      const uname = displayUserName(r).toLowerCase()
      const uid = String(r.userId)
      return testTitle.includes(q) || uname.includes(q) || uid.includes(q)
    })
  }, [raw, search])

  const total = filtered.length
  const pageData = useMemo(
    () => filtered.slice((page - 1) * LIMIT, page * LIMIT),
    [filtered, page],
  )

  useEffect(() => {
    setPage(1)
  }, [search])

  const completed = raw.filter((r) => r.status === "COMPLETED").length
  const avgSafe =
    raw.filter((r) => r.percentage != null).length === 0
      ? 0
      : Math.round(
          raw.filter((r) => r.percentage != null).reduce((s, r) => s + (r.percentage as number), 0) /
            raw.filter((r) => r.percentage != null).length,
        )

  const uniqueUsers = new Set(raw.map((r) => r.userId)).size

  const columns = [
    {
      key: "user",
      title: "Foydalanuvchi",
      render: (r: Row) => (
        <button type="button" onClick={() => setSelected(r)} className="text-left hover:underline">
          <span className="font-medium">{displayUserName(r)}</span>
        </button>
      ),
    },
    {
      key: "test",
      title: "Test",
      render: (r: Row) => r.test?.title || "—",
    },
    {
      key: "score",
      title: "Ball",
      render: (r: Row) =>
        r.score !== null && r.score !== undefined
          ? `${r.score}/${r.maxScore ?? "—"}`
          : "—",
    },
    {
      key: "percentage",
      title: "Foiz",
      render: (r: Row) =>
        r.percentage !== null ? (
          <Badge
            variant={r.percentage >= 70 ? "default" : r.percentage >= 40 ? "secondary" : "destructive"}
          >
            {r.percentage}%
          </Badge>
        ) : (
          "—"
        ),
    },
    {
      key: "status",
      title: "Holat",
      render: (r: Row) => (
        <Badge variant={r.status === "COMPLETED" ? "default" : "secondary"}>
          {r.status === "COMPLETED" ? "Tugatilgan" : "Jarayonda"}
        </Badge>
      ),
    },
    {
      key: "completedAt",
      title: "Sana",
      render: (r: Row) =>
        r.completedAt ? new Date(r.completedAt).toLocaleDateString("uz-UZ") : "—",
    },
  ]

  if (!loading && permissionDenied) {
    return (
      <div className="space-y-6">
        <PageHeader title="Natijalar analitikasi" subtitle="Test natijalari" icon={BarChart3} />
        <AccessDeniedPlaceholder
          title="Test natijalariga ruxsat yo'q"
          description="Natijalar ro'yxati assessments yoki maxfiylik siyosati bo'yicha cheklangan bo'lishi mumkin."
          detail={error}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Natijalar analitikasi" subtitle="Test natijalari" icon={BarChart3} />

      <div className="flex gap-3 rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm text-muted-foreground">
        <Info className="size-5 shrink-0 text-amber-600 mt-0.5" />
        <div className="space-y-2">
          <p className="font-medium text-foreground">API cheklovlari</p>
          {!isSuperAdmin && (
            <p>
              Backend hozir <span className="font-mono text-xs">GET /assessments/test-results</span> uchun
              superadmin bo&apos;lmagan foydalanuvchilarga faqat <strong>o&apos;zining</strong> test natijalarini
              qaytaradi. Markaz administratori sifatida ko&apos;rinadigan ro&apos;yxat shu admin akkauntiga
              tegishli topshirilgan testlar bilan cheklanadi — markaz bo&apos;yiicha barcha o&apos;quvchilar
              natijalari uchun alohida API yo&apos;q.
            </p>
          )}
          {isSuperAdmin && (
            <p>
              Superadmin uchun backend barcha natijalarni qaytaradi. Profil ismi ba&apos;zi yozuvlarda
              ko&apos;rinmasligi mumkin (API <span className="font-mono text-xs">user</span> relatsiyasini har
              doim qo&apos;shmaydi) — identifikator sifatida foydalanuvchi ID ko&apos;rsatiladi.
            </p>
          )}
        </div>
      </div>

      <StatsGrid>
        <StatsCard
          title="Jami yozuvlar"
          value={raw.length}
          icon={BarChart3}
          loading={loading}
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Tugatilgan"
          value={completed}
          icon={Award}
          loading={loading}
          iconColor="text-green-600"
        />
        <StatsCard
          title="O'rtacha foiz"
          value={avgSafe ? `${avgSafe}%` : "—"}
          icon={TrendingUp}
          loading={loading}
          iconColor="text-purple-600"
        />
        <StatsCard
          title="Turli foydalanuvchilar"
          value={uniqueUsers}
          icon={Users}
          loading={loading}
          iconColor="text-orange-600"
        />
      </StatsGrid>

      <DataTable
        title="Test natijalari"
        description={
          isSuperAdmin
            ? "Barcha foydalanuvchilar (global)"
            : "Joriy akkauntga tegishli natijalar"
        }
        columns={columns}
        data={pageData}
        total={total}
        page={page}
        limit={LIMIT}
        loading={loading}
        error={error}
        searchPlaceholder="Test, ism yoki user ID bo'yicha qidirish..."
        onPageChange={setPage}
        onSearchChange={setSearch}
      />

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{displayUserName(selected)}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div>
                  <span className="text-sm font-medium">Foydalanuvchi ID</span>
                  <p className="text-sm text-muted-foreground mt-1">{selected.userId}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Test</span>
                  <p className="text-sm text-muted-foreground mt-1">{selected.test?.title || "—"}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground">Ball</span>
                    <p className="text-sm font-medium">
                      {selected.score ?? "—"} / {selected.maxScore ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Foiz</span>
                    <p className="text-sm font-medium">
                      {selected.percentage !== null ? `${selected.percentage}%` : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Holat</span>
                    <p className="text-sm font-medium">
                      {selected.status === "COMPLETED" ? "Tugatilgan" : "Jarayonda"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Sana</span>
                    <p className="text-sm font-medium">
                      {selected.completedAt
                        ? new Date(selected.completedAt).toLocaleString("uz-UZ")
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
