"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { 
  FileText, Calendar, Download, Users, DollarSign, 
  Search, Filter, RefreshCw, Loader2, CheckCircle, Clock, XCircle,
  FileJson, FileSpreadsheet, File as FileIcon
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api-client"
import { safeDevError } from "@/lib/safe-log"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { exportToExcel, exportToPDF } from "@/lib/export-utils"

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("financial")
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [status, setStatus] = useState("")

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      // Prevent stale summary shape across tab switches (e.g. object -> array)
      setSummary(null)
      const params: any = {
        from: dateFrom || undefined,
        to: dateTo || undefined,
        status: status || undefined,
      }
      
      const res = await apiClient<any>(`/reports/${activeTab}`, { params })
      if (activeTab === "financial" || activeTab === "users") {
        setData(res.data)
        setSummary(res.summary)
      } else {
        setData(res)
        setSummary(null)
      }
    } catch (error) {
      safeDevError("reports/fetch", error)
    } finally {
      setLoading(false)
    }
  }, [activeTab, dateFrom, dateTo, status])

  const userSummary = useMemo(() => (Array.isArray(summary) ? summary : []), [summary])
  const financialSummary = useMemo(
    () => (!Array.isArray(summary) && summary ? summary : null),
    [summary],
  )

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handleExport = (type: 'excel' | 'pdf') => {
    if (!data.length) return

    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `Ruhiyat_${activeTab}_report_${timestamp}`
    
    if (activeTab === 'financial') {
      const headers = ['Sana', 'Foydalanuvchi', 'Summa', 'Status', 'Turi', 'Provayder']
      const body = data.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.userName,
        t.amount.toLocaleString() + ' UZS',
        t.status,
        t.type,
        t.provider
      ])
      type === 'excel' ? exportToExcel(data, filename, 'Moliyaviy') : exportToPDF(headers, body, filename, 'Moliyaviy Hisobot')
    } else if (activeTab === 'sessions') {
      const headers = ['Sana', 'Mijoz', 'Psixolog', 'Davomiyligi', 'Narxi', 'Status']
      const body = data.map(s => [
        new Date(s.scheduledAt).toLocaleDateString(),
        s.userName,
        s.psychologistName,
        s.duration + ' min',
        s.price.toLocaleString() + ' UZS',
        s.status
      ])
      type === 'excel' ? exportToExcel(data, filename, 'Seanslar') : exportToPDF(headers, body, filename, 'Seanslar Hisoboti')
    } else {
      const headers = ['Sana', 'Ism', 'Email', 'Telefon', 'Rol', 'Holat']
      const body = data.map(u => [
        new Date(u.createdAt).toLocaleDateString(),
        `${u.firstName || ''} ${u.lastName || ''}`,
        u.email,
        u.phone || '-',
        u.role,
        u.isActive ? 'Faol' : 'Nofaol'
      ])
      type === 'excel' ? exportToExcel(data, filename, 'Foydalanuvchilar') : exportToPDF(headers, body, filename, 'Foydalanuvchilar Hisoboti')
    }
  }

  const financialColumns = [
    { key: "date", title: "Sana", render: (t: any) => new Date(t.date).toLocaleDateString() },
    { key: "userName", title: "Foydalanuvchi" },
    { key: "amount", title: "Summa", render: (t: any) => <span className="font-bold">{t.amount.toLocaleString()} UZS</span> },
    { 
      key: "status", 
      title: "Status", 
      render: (t: any) => (
        <Badge variant={t.status === 'COMPLETED' ? 'default' : t.status === 'PENDING' ? 'secondary' : 'destructive'} className="rounded-full">
          {t.status === 'COMPLETED' ? 'Muvaffaqiyatli' : t.status === 'PENDING' ? 'Kutilmoqda' : 'Xato'}
        </Badge>
      )
    },
    { key: "type", title: "Turi", render: (t: any) => <Badge variant="outline">{t.type}</Badge> },
    { key: "provider", title: "Provayder" },
  ]

  const sessionColumns = [
    { key: "scheduledAt", title: "Sana", render: (s: any) => new Date(s.scheduledAt).toLocaleDateString() },
    { key: "userName", title: "Mijoz" },
    { key: "psychologistName", title: "Psixolog" },
    { key: "duration", title: "Vaqt", render: (s: any) => `${s.duration} min` },
    { key: "price", title: "Narxi", render: (s: any) => <span className="font-semibold">{s.price.toLocaleString()} UZS</span> },
    { 
      key: "status", 
      title: "Status", 
      render: (s: any) => (
        <Badge variant={s.status === 'COMPLETED' ? 'default' : s.status === 'CANCELLED' ? 'destructive' : 'secondary'} className="rounded-full">
          {s.status === 'COMPLETED' ? 'Yakunlandi' : s.status === 'CANCELLED' ? 'Bekor qilindi' : 'Rejalashtirilgan'}
        </Badge>
      )
    },
  ]

  const userColumns = [
    { key: "createdAt", title: "Sana", render: (u: any) => new Date(u.createdAt).toLocaleDateString() },
    { key: "name", title: "Foydalanuvchi", render: (u: any) => `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email },
    { key: "email", title: "Email" },
    { key: "role", title: "Rol", render: (u: any) => <Badge variant="outline">{u.role}</Badge> },
    { 
      key: "isActive", 
      title: "Holat", 
      render: (u: any) => (
        <div className="flex items-center gap-1.5">
          <div className={`size-2 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          <span className="text-xs">{u.isActive ? 'Faol' : 'Nofaol'}</span>
        </div>
      )
    },
  ]

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Hisobotlar va Ma'lumotlar"
        description="Platforma faoliyati bo'yicha batafsil hisobotlarni ko'rish va eksport qilish"
        icon={FileText}
        actions={[
          { 
            label: "Yangilash", 
            icon: loading ? Loader2 : RefreshCw, 
            variant: "outline", 
            onClick: fetchReport,
            disabled: loading
          },
          {
            element: (
              <div key="exports" className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExport('excel')} disabled={!data.length || loading}>
                  <FileSpreadsheet className="size-4 mr-2 text-emerald-600" /> Excel
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} disabled={!data.length || loading}>
                  <FileIcon className="size-4 mr-2 text-rose-600" /> PDF
                </Button>
              </div>
            )
          }
        ]}
      />

      <Card className="border-none shadow-sm bg-muted/30 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Dan</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 w-[160px] bg-background" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Gacha</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 w-[160px] bg-background" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Status</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)} 
                className="h-9 w-[160px] px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Barchasi</option>
                {activeTab === 'financial' && (
                  <>
                    <option value="COMPLETED">Muvaffaqiyatli</option>
                    <option value="PENDING">Kutilmoqda</option>
                    <option value="FAILED">Xato</option>
                  </>
                )}
                {activeTab === 'sessions' && (
                  <>
                    <option value="COMPLETED">Yakunlangan</option>
                    <option value="PENDING">Kutilmoqda</option>
                    <option value="CANCELLED">Bekor qilingan</option>
                  </>
                )}
              </select>
            </div>
            <div className="flex items-end h-full pt-6">
               <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); setStatus(""); }} className="h-9 text-xs text-muted-foreground">
                Filtrni tozalash
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="financial" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="financial" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <DollarSign className="size-4 mr-2" /> Moliyaviy
          </TabsTrigger>
          <TabsTrigger value="sessions" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Calendar className="size-4 mr-2" /> Seanslar
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Users className="size-4 mr-2" /> Foydalanuvchilar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="mt-0">
          <div className="grid gap-6">
            {financialSummary && (
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-emerald-50/50 border-emerald-100/50">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="size-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <DollarSign className="size-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Jami Summa</p>
                      <p className="text-xl font-black text-emerald-700">{financialSummary.totalAmount.toLocaleString()} UZS</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50/50 border-blue-100/50">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <RefreshCw className="size-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Tranzaksiyalar soni</p>
                      <p className="text-xl font-black text-blue-700">{financialSummary.totalCount} ta</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            <DataTable 
              columns={financialColumns} 
              data={data} 
              total={data.length} 
              page={1} 
              limit={50} 
              loading={loading}
              onPageChange={() => {}}
              searchPlaceholder="Foydalanuvchi bo'yicha qidirish..."
            />
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="mt-0">
          <DataTable 
            columns={sessionColumns} 
            data={data} 
            total={data.length} 
            page={1} 
            limit={50} 
            loading={loading}
            onPageChange={() => {}}
            searchPlaceholder="Mijoz yoki psixolog bo'yicha..."
          />
        </TabsContent>

        <TabsContent value="users" className="mt-0">
          <div className="grid gap-6">
            {userSummary.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {userSummary.map((s: any) => (
                  <Badge key={s.role} variant="secondary" className="px-3 py-1.5 rounded-lg text-xs font-bold bg-muted/50 border-none">
                    {s.role}: <span className="text-primary ml-1">{s.count}</span>
                  </Badge>
                ))}
              </div>
            )}
            <DataTable 
              columns={userColumns} 
              data={data} 
              total={data.length} 
              page={1} 
              limit={50} 
              loading={loading}
              onPageChange={() => {}}
              searchPlaceholder="Ism yoki email bo'yicha..."
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
