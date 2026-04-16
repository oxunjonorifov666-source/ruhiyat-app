"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { AlertCircle, CheckCircle2, XCircle, UserPlus, FileText, Activity, Loader2, MoreVertical, ExternalLink } from "lucide-react"
import { StatsGrid, StatsCard } from "@/components/stats-card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

interface Complaint {
  id: number
  reporterId: number
  targetType: string
  targetId: number
  subject: string
  description: string | null
  status: "NEW" | "IN_REVIEW" | "RESOLVED" | "REJECTED"
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  assignedToUserId: number | null
  resolutionNote: string | null
  createdAt: string
  reporter: { firstName: string | null; lastName: string | null; email: string | null }
  assignedTo: { firstName: string | null; lastName: string | null } | null
  resolver: { firstName: string | null; lastName: string | null } | null
}

interface ComplaintStats {
  total: number
  new: number
  inReview: number
  resolved: number
  rejected: number
}

interface Admin {
  id: number
  userId: number
  firstName: string
  lastName: string
}

const statusLabels: Record<string, string> = {
  NEW: "Yangi",
  IN_REVIEW: "Ko'rib chiqilmoqda",
  RESOLVED: "Hal qilingan",
  REJECTED: "Rad etilgan",
}

const statusColors: Record<string, string> = {
  NEW: "bg-blue-500/10 text-blue-600 border-blue-200",
  IN_REVIEW: "bg-amber-500/10 text-amber-600 border-amber-200",
  RESOLVED: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  REJECTED: "bg-red-500/10 text-red-600 border-red-200",
}

const priorityLabels: Record<string, string> = {
  LOW: "Past",
  MEDIUM: "O'rta",
  HIGH: "Yuqori",
  URGENT: "Shoshilinch",
}

export default function ModerationPage() {
  const [data, setData] = useState<Complaint[]>([])
  const [stats, setStats] = useState<ComplaintStats | null>(null)
  const [admins, setAdmins] = useState<Admin[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialog states
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [actionType, setActionType] = useState<"ASSIGN" | "RESOLVE" | "REJECT" | null>(null)
  const [note, setNote] = useState("")
  const [targetAdminId, setTargetAdminId] = useState<string>("")
  const [processing, setProcessing] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [res, s, a] = await Promise.all([
        apiClient<PaginatedResponse<Complaint>>("/complaints", { params: { page, limit: 15 } }),
        apiClient<ComplaintStats>("/complaints/stats"),
        apiClient<PaginatedResponse<Admin>>("/administrators", { params: { limit: 100 } })
      ])
      setData(res.data)
      setTotal(res.total)
      setStats(s)
      setAdmins(a.data)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [page])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAction = async () => {
    if (!selectedComplaint || !actionType) return
    setProcessing(true)
    try {
      let endpoint = `/complaints/${selectedComplaint.id}`
      let body: any = {}

      if (actionType === "ASSIGN") {
        endpoint += "/assign"
        body.assignedToUserId = parseInt(targetAdminId)
      } else if (actionType === "RESOLVE") {
        endpoint += "/resolve"
        body.resolutionNote = note
      } else if (actionType === "REJECT") {
        endpoint += "/reject"
        body.resolutionNote = note
      }

      await apiClient(endpoint, { method: "PATCH", body })
      
      // Reset state and refresh
      setActionType(null)
      setSelectedComplaint(null)
      setNote("")
      setTargetAdminId("")
      fetchData()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setProcessing(false)
    }
  }

  const openAction = (complaint: Complaint, type: "ASSIGN" | "RESOLVE" | "REJECT") => {
    setSelectedComplaint(complaint)
    setActionType(type)
    setNote("")
    setTargetAdminId(complaint.assignedToUserId?.toString() || "")
  }

  const columns = [
    { 
      key: "subject", 
      title: "Mavzu", 
      render: (c: Complaint) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{c.subject}</span>
          <span className="text-[11px] text-muted-foreground line-clamp-1">{c.description || "Tavsif yo'q"}</span>
        </div>
      )
    },
    { 
      key: "target", 
      title: "Ob'ekt", 
      render: (c: Complaint) => (
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] capitalize">{c.targetType}</Badge>
          <span className="text-[10px] text-muted-foreground">#{c.targetId}</span>
        </div>
      )
    },
    { 
      key: "reporter", 
      title: "Shikoyatchi", 
      render: (c: Complaint) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium">{c.reporter.firstName} {c.reporter.lastName}</span>
          <span className="text-[10px] text-muted-foreground">{c.reporter.email}</span>
        </div>
      )
    },
    { 
      key: "status", 
      title: "Holat", 
      render: (c: Complaint) => (
        <Badge variant="outline" className={statusColors[c.status]}>
          {statusLabels[c.status]}
        </Badge>
      )
    },
    { 
      key: "assignedTo", 
      title: "Mas'ul", 
      render: (c: Complaint) => (
        <span className="text-xs">
          {c.assignedTo ? `${c.assignedTo.firstName} ${c.assignedTo.lastName}` : "Tayinlanmagan"}
        </span>
      )
    },
    { 
      key: "actions", 
      title: "", 
      render: (c: Complaint) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="size-8 p-0">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Boshqarish</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => openAction(c, "ASSIGN")} className="gap-2">
              <UserPlus className="size-4" /> Tayinlash
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => openAction(c, "RESOLVE")} 
              className="text-emerald-600 gap-2"
              disabled={c.status === "RESOLVED" || c.status === "REJECTED"}
            >
              <CheckCircle2 className="size-4" /> Hal qilish
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => openAction(c, "REJECT")} 
              className="text-red-600 gap-2"
              disabled={c.status === "RESOLVED" || c.status === "REJECTED"}
            >
              <XCircle className="size-4" /> Rad etish
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Moderatsiya markazi"
        description="Foydalanuvchi shikoyatlari va kontent nazorati"
        icon={AlertCircle}
        actions={[
          { label: "Yangilash", icon: Activity, variant: "outline", onClick: fetchData },
        ]}
      />

      {stats && (
        <StatsGrid columns={4}>
          <StatsCard
            title="Yangi shikoyatlar"
            value={stats.new}
            icon={AlertCircle}
            iconColor="bg-blue-500/10 text-blue-600"
          />
          <StatsCard
            title="Jarayonda"
            value={stats.inReview}
            icon={Activity}
            iconColor="bg-amber-500/10 text-amber-600"
          />
          <StatsCard
            title="Hal qilingan"
            value={stats.resolved}
            icon={CheckCircle2}
            iconColor="bg-emerald-500/10 text-emerald-600"
          />
          <StatsCard
            title="Rad etilgan"
            value={stats.rejected}
            icon={XCircle}
            iconColor="bg-red-500/10 text-red-600"
          />
        </StatsGrid>
      )}

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={15}
        loading={loading}
        error={error}
        onPageChange={setPage}
        searchPlaceholder="Shikoyatlardan qidirish..."
      />

      <Dialog open={!!actionType} onOpenChange={(open) => !open && setActionType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "ASSIGN" ? "Mas'ulni tayinlash" : 
               actionType === "RESOLVE" ? "Shikoyatni hal qilish" : "Shikoyatni rad etish"}
            </DialogTitle>
            <DialogDescription>
              ID: #{selectedComplaint?.id} | {selectedComplaint?.subject}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {actionType === "ASSIGN" ? (
              <div className="space-y-2">
                <Label>Administratorni tanlang</Label>
                <Select value={targetAdminId} onValueChange={setTargetAdminId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mas'ul shaxs..." />
                  </SelectTrigger>
                  <SelectContent>
                    {admins.map(admin => (
                      <SelectItem key={admin.userId} value={admin.userId.toString()}>
                        {admin.firstName} {admin.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Izoh (Foydalanuvchiga yuboriladi)</Label>
                <Textarea 
                  placeholder="Xulosa yoki rad etish sababini yozing..." 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)} disabled={processing}>Bekor qilish</Button>
            <Button 
              onClick={handleAction} 
              disabled={processing || (actionType === "ASSIGN" ? !targetAdminId : !note)}
              variant={actionType === "REJECT" ? "destructive" : "default"}
            >
              {processing && <Loader2 className="size-4 animate-spin mr-2" />}
              Tasdiqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
