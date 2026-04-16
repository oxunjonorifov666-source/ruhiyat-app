"use client"

import { useCallback, useEffect, useState } from "react"
import {
  CalendarCheck, Users, Clock, RefreshCw, Loader2, Video, Link as LinkIcon,
} from "lucide-react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import type { FilterField } from "@/components/filter-bar"
import { toast } from "sonner"

interface MeetingRow {
  id: number
  title: string
  description: string | null
  type: string
  status: string
  scheduledAt: string
  duration: number
  meetingUrl?: string | null
  host: { id: number; email: string | null; firstName: string | null; lastName: string | null } | null
  _count: { participants: number }
}

interface MeetingDetail extends MeetingRow {
  notes: string | null
  participants?: Array<{
    id: number
    status: string
    user: { id: number; email: string | null; firstName: string | null; lastName: string | null }
  }>
}

const statusLabels: Record<string, string> = {
  SCHEDULED: "Rejalashtirilgan",
  IN_PROGRESS: "Jarayonda",
  COMPLETED: "Yakunlangan",
  CANCELLED: "Bekor qilingan",
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  SCHEDULED: "secondary",
  IN_PROGRESS: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
}

const typeLabels: Record<string, string> = {
  CONSULTATION: "Konsultatsiya",
  THERAPY: "Terapiya",
  GROUP_SESSION: "Guruh",
  TRAINING: "Trening",
  OTHER: "Boshqa",
}

export default function MeetingsPage() {
  const [data, setData] = useState<MeetingRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selected, setSelected] = useState<MeetingDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string | number | undefined> = { page, limit: 20 }
      if (search) params.search = search
      if (statusFilter !== "all") params.status = statusFilter
      const res = await apiClient<PaginatedResponse<MeetingRow>>("/meetings", { params })
      setData(res.data)
      setTotal(res.total)
    } catch (e: any) {
      setError(e.message)
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openDetail = async (m: MeetingRow) => {
    setSheetOpen(true)
    setDetailLoading(true)
    setSelected(m as MeetingDetail)
    try {
      const full = await apiClient<MeetingDetail>(`/meetings/${m.id}`)
      setSelected(full)
    } catch (e: any) {
      toast.error(e.message || "Ma'lumot yuklanmadi")
    } finally {
      setDetailLoading(false)
    }
  }

  const filterFields: FilterField[] = [
    {
      id: "status",
      placeholder: "Holat",
      options: [
        { value: "SCHEDULED", label: "Rejalashtirilgan" },
        { value: "IN_PROGRESS", label: "Jarayonda" },
        { value: "COMPLETED", label: "Yakunlangan" },
        { value: "CANCELLED", label: "Bekor" },
      ],
    },
  ]

  const columns = [
    {
      key: "title",
      title: "Uchrashuv",
      render: (m: MeetingRow) => (
        <button type="button" className="text-left hover:underline" onClick={() => openDetail(m)}>
          <span className="font-medium line-clamp-2">{m.title}</span>
          <div className="text-xs text-muted-foreground">{typeLabels[m.type] || m.type}</div>
        </button>
      ),
    },
    {
      key: "host",
      title: "Tashkilotchi",
      render: (m: MeetingRow) => (
        <span className="text-sm">
          {m.host?.firstName
            ? `${m.host.firstName} ${m.host.lastName || ""}`.trim()
            : m.host?.email || "—"}
        </span>
      ),
    },
    {
      key: "scheduledAt",
      title: "Vaqt",
      render: (m: MeetingRow) => (
        <span className="text-sm tabular-nums">{new Date(m.scheduledAt).toLocaleString("uz-UZ")}</span>
      ),
    },
    {
      key: "duration",
      title: "Daq",
      render: (m: MeetingRow) => `${m.duration} daq`,
    },
    {
      key: "participants",
      title: "Ishtirokchilar",
      render: (m: MeetingRow) => (
        <span className="inline-flex items-center gap-1 text-sm">
          <Users className="size-3.5 text-muted-foreground" />
          {m._count?.participants ?? 0}
        </span>
      ),
    },
    {
      key: "status",
      title: "Holat",
      render: (m: MeetingRow) => (
        <Badge variant={statusVariant[m.status] || "outline"}>{statusLabels[m.status] || m.status}</Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Uchrashuvlar"
        description="Rejalashtirilgan uchrashuvlar va video ulanishlar (meetings jadvali)"
        icon={CalendarCheck}
        actions={[{ label: "Yangilash", icon: RefreshCw, variant: "outline", onClick: fetchData }]}
      />

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={20}
        loading={loading}
        error={error}
        searchPlaceholder="Sarlavha bo'yicha qidirish..."
        onPageChange={setPage}
        onSearchChange={(q) => {
          setSearch(q)
          setPage(1)
        }}
        filterFields={filterFields}
        activeFilters={{ status: statusFilter }}
        onFilterChange={(id, value) => {
          if (id === "status") setStatusFilter(value)
          setPage(1)
        }}
        onResetFilters={() => {
          setStatusFilter("all")
          setPage(1)
        }}
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="pr-8">{selected?.title}</SheetTitle>
            <SheetDescription>Uchrashuv #{selected?.id}</SheetDescription>
          </SheetHeader>
          {detailLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : selected ? (
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant={statusVariant[selected.status] || "outline"}>{statusLabels[selected.status]}</Badge>
                <Badge variant="outline">{typeLabels[selected.type] || selected.type}</Badge>
              </div>
              {selected.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Boshlanish</p>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {new Date(selected.scheduledAt).toLocaleString("uz-UZ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Davomiyligi</p>
                  <p className="font-medium">{selected.duration} daqiqa</p>
                </div>
              </div>
              {selected.meetingUrl && (
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <a href={selected.meetingUrl} target="_blank" rel="noopener noreferrer">
                    <Video className="size-4 mr-2" />
                    Ulanish
                    <LinkIcon className="size-3 ml-auto opacity-50" />
                  </a>
                </Button>
              )}
              {selected.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Izohlar</p>
                    <p className="text-sm">{selected.notes}</p>
                  </div>
                </>
              )}
              {selected.participants && selected.participants.length > 0 && (
                <>
                  <Separator />
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Ishtirokchilar</p>
                  <ul className="space-y-2">
                    {selected.participants.map((p) => (
                      <li key={p.id} className="text-sm rounded-lg border bg-muted/30 px-3 py-2">
                        {p.user.firstName
                          ? `${p.user.firstName} ${p.user.lastName || ""}`.trim()
                          : p.user.email || `#${p.user.id}`}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
