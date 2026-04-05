"use client"

import { useEffect, useState, useCallback } from "react"
import { Brain, Star, Clock, CheckCircle, XCircle } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/page-header"
import { StatsCard, StatsGrid } from "@/components/stats-card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

interface Psychologist {
  id: number
  firstName: string
  lastName: string
  specialization: string | null
  bio: string | null
  experienceYears: number | null
  isVerified: boolean
  isAvailable: boolean
  rating: number | null
  totalSessions: number
  hourlyRate: number | null
  user: { email: string | null; phone: string | null } | null
  createdAt: string
}

interface PsychologistStats {
  total: number
  verified: number
  available: number
  avgRating: number
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
  const [stats, setStats] = useState<PsychologistStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [selected, setSelected] = useState<Psychologist | null>(null)

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

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const params: Record<string, any> = {}
      if (centerId) params.centerId = centerId
      const res = await apiClient<any>("/psychologists/stats", { params })
      setStats({
        total: res.total || 0,
        verified: res.verified || 0,
        available: res.available || 0,
        avgRating: res.avgRating || 0,
      })
    } catch {
      setStats({ total: 0, verified: 0, available: 0, avgRating: 0 })
    } finally {
      setStatsLoading(false)
    }
  }, [centerId])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchStats() }, [fetchStats])

  const columns = [
    {
      key: "name", title: "Ism",
      render: (p: Psychologist) => (
        <button onClick={() => setSelected(p)} className="text-left hover:underline">
          <span className="font-medium">{p.firstName} {p.lastName}</span>
          <div className="text-xs text-muted-foreground">{p.user?.email || p.user?.phone || ""}</div>
        </button>
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
    { key: "sessions", title: "Seanslar", render: (p: Psychologist) => p.totalSessions },
    {
      key: "rate", title: "Narx",
      render: (p: Psychologist) => p.hourlyRate ? `${p.hourlyRate.toLocaleString()} UZS` : "—",
    },
  ]

  return (
    <>
      <PageHeader
        title="Psixologlar"
        description="Markaz psixologlarini boshqarish va ko'rish"
        icon={Brain}
      />

      {statsLoading ? (
        <StatsGrid columns={4}>
          {Array.from({ length: 4 }).map((_, i) => (
            <StatsCard key={i} title="" value="" icon={Brain} loading />
          ))}
        </StatsGrid>
      ) : stats ? (
        <StatsGrid columns={4}>
          <StatsCard title="Jami psixologlar" value={stats.total} icon={Brain} iconColor="bg-purple-500/10 text-purple-600" />
          <StatsCard title="Tasdiqlangan" value={stats.verified} icon={CheckCircle} iconColor="bg-green-500/10 text-green-600" />
          <StatsCard title="Mavjud" value={stats.available} icon={Clock} iconColor="bg-blue-500/10 text-blue-600" />
          <StatsCard title="O'rtacha reyting" value={stats.avgRating ? `${stats.avgRating.toFixed(1)} ★` : "—"} icon={Star} iconColor="bg-amber-500/10 text-amber-600" />
        </StatsGrid>
      ) : null}

      <div className="mt-6">
        <DataTable
          columns={columns} data={data} total={total} page={page} limit={20}
          loading={loading} error={error} searchPlaceholder="Psixolog qidirish..."
          onPageChange={setPage} onSearch={setSearch}
        />
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selected?.firstName} {selected?.lastName}</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selected.user?.email || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Telefon</p>
                  <p className="font-medium">{selected.user?.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Mutaxassislik</p>
                  <p className="font-medium">{selected.specialization || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tajriba</p>
                  <p className="font-medium">{selected.experienceYears ? `${selected.experienceYears} yil` : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Soatlik narx</p>
                  <p className="font-medium">{selected.hourlyRate ? `${selected.hourlyRate.toLocaleString()} UZS` : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Jami seanslar</p>
                  <p className="font-medium">{selected.totalSessions}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reyting</p>
                  <p className="font-medium">{selected.rating ? `${selected.rating.toFixed(1)} ★` : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ro'yxatdan o'tgan</p>
                  <p className="font-medium">{new Date(selected.createdAt).toLocaleDateString("uz-UZ")}</p>
                </div>
              </div>
              <Separator />
              <div className="flex gap-2 flex-wrap">
                <Badge variant={selected.isVerified ? "default" : "secondary"}>
                  {selected.isVerified ? "Tasdiqlangan" : "Tasdiqlanmagan"}
                </Badge>
                <Badge variant={selected.isAvailable ? "default" : "outline"}>
                  {selected.isAvailable ? "Mavjud" : "Band"}
                </Badge>
              </div>
              {selected.bio && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Bio</p>
                    <p className="text-sm">{selected.bio}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
