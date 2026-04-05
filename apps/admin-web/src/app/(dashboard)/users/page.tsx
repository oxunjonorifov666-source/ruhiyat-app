"use client"

import { useEffect, useState, useCallback } from "react"
import { Users, CalendarCheck } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/page-header"
import { StatsCard, StatsGrid } from "@/components/stats-card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

interface Student {
  id: number
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  isActive: boolean
  createdAt: string
  enrollments?: { id: number; course: { name: string } }[]
}

interface SessionRecord {
  id: number
  scheduledAt: string
  status: string
  duration: number
  psychologist: { firstName: string; lastName: string }
}

const statusLabels: Record<string, string> = {
  PENDING: "Kutilmoqda",
  ACCEPTED: "Qabul qilingan",
  COMPLETED: "Yakunlangan",
  CANCELLED: "Bekor qilingan",
  REJECTED: "Rad etilgan",
}

export default function UsersPage() {
  const { user } = useAuth()
  const centerId = user?.administrator?.centerId
  const [data, setData] = useState<Student[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Student | null>(null)
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)

  const fetchData = useCallback(async () => {
    if (!centerId) return
    setLoading(true); setError(null)
    try {
      const res = await apiClient<PaginatedResponse<Student>>(`/education-centers/${centerId}/students`, {
        params: { page, limit: 20, search },
      })
      setData(res.data); setTotal(res.total)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [centerId, page, search])

  useEffect(() => { fetchData() }, [fetchData])

  const openDetail = async (student: Student) => {
    setSelected(student)
    setSessions([])
    setSessionsLoading(true)
    try {
      const res = await apiClient<{ data: SessionRecord[] }>(`/users/${student.id}/sessions`, {
        params: { limit: 10 },
      })
      setSessions(res.data || [])
    } catch {}
    finally { setSessionsLoading(false) }
  }

  if (!centerId) return <div className="p-8 text-center text-muted-foreground">Markaz topilmadi</div>

  const columns = [
    {
      key: "name", title: "Ism",
      render: (s: Student) => (
        <button onClick={() => openDetail(s)} className="text-left hover:underline">
          <span className="font-medium">{s.firstName && s.lastName ? `${s.firstName} ${s.lastName}` : s.email || s.phone || `#${s.id}`}</span>
          <div className="text-xs text-muted-foreground">{s.email || s.phone || ""}</div>
        </button>
      ),
    },
    {
      key: "isActive", title: "Holat",
      render: (s: Student) => <Badge variant={s.isActive ? "default" : "secondary"}>{s.isActive ? "Faol" : "Nofaol"}</Badge>,
    },
    {
      key: "enrollments", title: "Kurslar",
      render: (s: Student) => {
        const courses = s.enrollments?.map((e) => e.course.name) || []
        return courses.length > 0 ? (
          <div className="flex gap-1 flex-wrap">
            {courses.slice(0, 2).map((c, i) => (
              <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
            ))}
            {courses.length > 2 && <Badge variant="outline" className="text-xs">+{courses.length - 2}</Badge>}
          </div>
        ) : "—"
      },
    },
    {
      key: "createdAt", title: "Qo'shilgan sana",
      render: (s: Student) => new Date(s.createdAt).toLocaleDateString("uz-UZ"),
    },
  ]

  return (
    <>
      <PageHeader
        title="Foydalanuvchilar"
        description="Markaz foydalanuvchilarini boshqarish"
        icon={Users}
        badge={`${total} ta`}
      />

      <DataTable
        columns={columns} data={data} total={total} page={page} limit={20}
        loading={loading} error={error} searchPlaceholder="Foydalanuvchi qidirish..."
        onPageChange={setPage} onSearch={setSearch}
      />

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {selected?.firstName && selected?.lastName
                ? `${selected.firstName} ${selected.lastName}`
                : selected?.email || `#${selected?.id}`}
            </SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selected.email || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Telefon</p>
                  <p className="font-medium">{selected.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Holat</p>
                  <Badge variant={selected.isActive ? "default" : "secondary"}>
                    {selected.isActive ? "Faol" : "Nofaol"}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Ro'yxatdan o'tgan</p>
                  <p className="font-medium">{new Date(selected.createdAt).toLocaleDateString("uz-UZ")}</p>
                </div>
              </div>

              {selected.enrollments && selected.enrollments.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Kurslar</p>
                    <div className="flex gap-1 flex-wrap">
                      {selected.enrollments.map((e) => (
                        <Badge key={e.id} variant="outline">{e.course.name}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Seanslar tarixi</p>
                {sessionsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Seanslar topilmadi</p>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((s) => (
                      <div key={s.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                        <div>
                          <p className="font-medium">{s.psychologist.firstName} {s.psychologist.lastName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(s.scheduledAt).toLocaleDateString("uz-UZ")} — {s.duration} daqiqa
                          </p>
                        </div>
                        <Badge variant={s.status === "COMPLETED" ? "default" : "secondary"}>
                          {statusLabels[s.status] || s.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
