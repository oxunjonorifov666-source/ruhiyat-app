"use client"

import { useEffect, useState, useCallback, use } from "react"
import { useAuth } from "@/components/auth-provider"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/page-header"
import { StatsCard, StatsGrid } from "@/components/stats-card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UsersRound, Plus, MoreHorizontal, UserMinus, Edit, Loader2, TrendingUp, AlertCircle } from "lucide-react"
import { ChartLine } from "lucide-react"
import { toast } from "sonner"
import {
  classifyApiError,
  describeEmbeddedApiError,
  formatEmbeddedApiError,
  type EmbeddedApiErrorDescription,
} from "@/lib/api-error"
import { EmbeddedApiErrorBanner } from "@/components/embedded-api-error-banner"
import { AccessDeniedPlaceholder } from "@/components/access-denied-placeholder"
import { useRouter } from "next/navigation"
import { useSuperadminCenter } from "@/hooks/use-superadmin-center"
import { SuperadminCenterRequiredScreen, SuperadminCenterSelect } from "@/components/superadmin-center-select"
import { withCenterQuery } from "@/lib/endpoints"

interface Enrollment {
  id: number
  studentId: number
  status: string
  enrolledAt: string
  completedAt: string | null
  student: { id: number; firstName: string; lastName: string; phone: string | null }
  payments: { id: number; status: string; amount: number }[]
}

interface GroupAnalytics {
  totalStudents: number
  active: number
  completed: number
  dropped: number
  capacityUsage: number
  maxStudents: number | null
  statusDistribution: { name: string; value: number; fill: string }[]
}

export default function GroupEnrollmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const groupId = resolvedParams.id

  const { user } = useAuth()
  const centerCtx = useSuperadminCenter(user)
  const centerId = centerCtx.effectiveCenterId
  const router = useRouter()

  const [data, setData] = useState<Enrollment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [studentId, setStudentId] = useState("")
  const [status, setStatus] = useState("active")
  const [requirePayment, setRequirePayment] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [saving, setSaving] = useState(false)
  const [sheetApiError, setSheetApiError] = useState<EmbeddedApiErrorDescription | null>(null)

  const [analytics, setAnalytics] = useState<GroupAnalytics | null>(null)

  const fetchData = useCallback(async () => {
    if (!centerId) return
    setLoading(true)
    setPermissionDenied(false)
    setLoadError(null)
    try {
      const [res, statsRes] = await Promise.all([
        apiClient<PaginatedResponse<Enrollment>>("/enrollments", {
          params: { centerId, groupId, page, limit: 20 },
        }),
        apiClient<GroupAnalytics>(`/groups/${groupId}/analytics?centerId=${centerId}`)
      ])
      setData(res.data)
      setTotal(res.total)
      setAnalytics(statsRes)
    } catch (e: unknown) {
      const { permissionDenied: denied } = classifyApiError(e)
      if (denied) {
        setPermissionDenied(true)
      } else {
        setLoadError(formatEmbeddedApiError(e))
        const d = describeEmbeddedApiError(e)
        toast.error(d.title, { description: d.description })
      }
    } finally {
      setLoading(false)
    }
  }, [centerId, page, groupId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openCreate = () => {
    setSheetApiError(null)
    setStudentId("")
    setStatus("active")
    setRequirePayment(false)
    setPaymentAmount("")
    setSheetOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!centerId) return
    setSaving(true)
    setSheetApiError(null)
    try {
      await apiClient("/enrollments", {
        method: "POST",
        body: {
          centerId,
          groupId: parseInt(groupId),
          studentId: parseInt(studentId),
          status,
          requirePayment,
          paymentAmount: requirePayment && paymentAmount ? parseInt(paymentAmount) : undefined
        },
      })
      toast.success("O'quvchi guruhga biriktirildi")
      setSheetOpen(false)
      fetchData()
    } catch (e: unknown) {
      const d = describeEmbeddedApiError(e)
      setSheetApiError(d)
      toast.error(d.title, { description: d.description })
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (enrollmentId: number) => {
    if (!confirm("O'quvchini guruhdan xorij qilmoqchimisiz?")) return
    try {
      await apiClient(`/enrollments/${enrollmentId}?centerId=${centerId}`, { method: "DELETE" })
      toast.success("O'quvchi xorij qilindi")
      fetchData()
    } catch (e: unknown) {
      const d = describeEmbeddedApiError(e)
      toast.error(d.title, { description: d.description })
    }
  }

  const columns = [
    {
      key: "student",
      title: "O'quvchi",
      render: (e: Enrollment) => (
        <div className="flex flex-col">
          <span className="font-medium">{e.student.firstName} {e.student.lastName}</span>
          {e.student.phone && <span className="text-xs text-muted-foreground">{e.student.phone}</span>}
        </div>
      ),
    },
    {
      key: "status",
      title: "Holat",
      render: (e: Enrollment) => (
        <Badge variant={e.status === "active" ? "default" : e.status === "completed" ? "secondary" : "destructive"}>
          {e.status === "active" ? "Faol" : e.status === "completed" ? "Tugatgan" : e.status}
        </Badge>
      ),
    },
    {
      key: "payment",
      title: "To'lov",
      render: (e: Enrollment) => {
        if (!e.payments || e.payments.length === 0) return <span className="text-muted-foreground text-xs">—</span>;
        const mainPayment = e.payments[0];
        return (
          <Badge variant={mainPayment.status === "PAID" ? "default" : "outline"} className={mainPayment.status === "PAID" ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
            {mainPayment.status} {new Intl.NumberFormat("uz-UZ").format(mainPayment.amount)} UZS
          </Badge>
        )
      }
    },
    {
      key: "enrolledAt",
      title: "Yozilgan sana",
      render: (e: Enrollment) => new Date(e.enrolledAt).toLocaleDateString("uz-UZ"),
    },
    {
      key: "actions",
      title: "",
      render: (e: Enrollment) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleRemove(e.id)}>
                <UserMinus className="mr-2 size-4" /> Bekor qilish
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  if (centerCtx.needsCenterSelection) {
    return (
      <SuperadminCenterRequiredScreen
        title="Guruh"
        description="Guruh va yozilishlar uchun markazni tanlang"
        icon={UsersRound}
        centers={centerCtx.centers}
        centersLoading={centerCtx.centersLoading}
        setCenterId={centerCtx.setCenterId}
      />
    )
  }

  if (!centerId) {
    return <div className="p-8 text-center text-muted-foreground">Markaz topilmadi</div>
  }

  if (permissionDenied) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push(withCenterQuery("/groups", centerId))}>Orqaga</Button>
        </div>
        <PageHeader title="Guruh" description="Guruh va yozilishlar" icon={UsersRound} />
        <AccessDeniedPlaceholder
          title="Guruh ma'lumotlariga ruxsat yo'q"
          description="Guruh tahlili va yozilishlar ro'yxati groups.read / enrollments ruxsatlarini talab qilishi mumkin."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => router.push(withCenterQuery("/groups", centerId))}>Orqaga</Button>
        {centerCtx.isSuperadmin && (
          <SuperadminCenterSelect
            centers={centerCtx.centers}
            centersLoading={centerCtx.centersLoading}
            value={centerCtx.effectiveCenterId}
            onChange={centerCtx.setCenterId}
          />
        )}
      </div>

      <PageHeader
        title={`Guruh boshqaruvi va tahlili`}
        description={`${centerCtx.centerDisplayName} — guruhdagi o'quvchilar va faollik`}
        icon={UsersRound}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            O&apos;quvchi qo&apos;shish
          </Button>
        }
      />

      {loadError && !loading ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : null}

      {analytics && (
        <>
          <StatsGrid columns={4}>
            <StatsCard
              title="Jami O'quvchilar"
              value={analytics.totalStudents}
              icon={UsersRound}
              iconColor="bg-blue-500/10 text-blue-600"
              description={analytics.maxStudents ? `Sig'im: ${analytics.maxStudents} ta` : ""}
            />
            <StatsCard
              title="Faol O'quvchilar"
              value={analytics.active}
              icon={TrendingUp}
              iconColor="bg-indigo-500/10 text-indigo-600"
            />
            <StatsCard
              title="Tugatganlar"
              value={analytics.completed}
              icon={ChartLine}
              iconColor="bg-emerald-500/10 text-emerald-600"
            />
            <StatsCard
              title="Tashlab ketganlar"
              value={analytics.dropped}
              icon={AlertCircle}
              iconColor="bg-red-500/10 text-red-600"
            />
          </StatsGrid>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Holat taqsimoti</CardTitle>
              <CardDescription>Guruhdagi o'quvchilarining holati bo'yicha vizual ko'rsatkich</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.statusDistribution} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} className="text-sm font-medium" />
                    <Tooltip contentStyle={{ borderRadius: "8px" }} cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {analytics.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={20}
        loading={loading}
        onPageChange={setPage}
      />

      <Sheet
        open={sheetOpen}
        onOpenChange={(o) => {
          setSheetOpen(o)
          if (!o) setSheetApiError(null)
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Yangi yozilish</SheetTitle>
            <SheetDescription>O'quvchini guruhga yo'naltirish</SheetDescription>
          </SheetHeader>

          <EmbeddedApiErrorBanner error={sheetApiError} className="mt-4" />

          <form onSubmit={handleSave} className="space-y-5 mt-6">
            <div className="space-y-2">
              <Label>O'quvchi ID raqami <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Masalan: 124"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Holat</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Faol (Active)</SelectItem>
                  <SelectItem value="completed">Tugatgan (Completed)</SelectItem>
                  <SelectItem value="dropped">Tashlab ketgan (Dropped)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2 pt-2 border-t mt-4">
              <input
                type="checkbox"
                id="requirePayment"
                checked={requirePayment}
                onChange={(e) => setRequirePayment(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="requirePayment" className="font-medium cursor-pointer">Boshlang'ich to'lov so'rash</Label>
            </div>

            {requirePayment && (
              <div className="space-y-2 pb-2">
                <Label>To'lov summasi (UZS) <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Masalan: 350000"
                />
                <p className="text-xs text-muted-foreground">Kutilayotgan to'lov "To'lovlar" bo'limida ko'rinadi.</p>
              </div>
            )}

            <SheetFooter className="mt-8">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} className="flex-1">
                Bekor qilish
              </Button>
              <Button type="submit" disabled={saving} className="flex-1">
                {saving && <Loader2 className="size-4 animate-spin mr-2" />} Qo'shish
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
