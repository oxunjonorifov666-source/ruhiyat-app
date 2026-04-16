"use client"

import { useEffect, useState, useCallback } from "react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  ClipboardList, Plus, Search, RefreshCw, MoreHorizontal, Eye, Trash2, Download, CheckCircle2
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TestBuilder } from "@/components/tests/test-builder"
import { TEST_TEMPLATES } from "@/lib/test-data"
import { CreateTestDto } from "@/lib/test-types"

interface Test {
  id: number
  title: string
  category: string | null
  isPublished: boolean
  _count?: { questions: number; testResults: number }
  createdAt: string
}

export default function TestsPage() {
  const [data, setData] = useState<Test[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  
  const [isAdding, setIsAdding] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient<PaginatedResponse<Test>>("/assessments/tests", { 
        params: { search: search || undefined } 
      })
      setData(res.data)
      setTotal(res.total)
    } catch {} finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async (testData: CreateTestDto) => {
    setActionLoading(true)
    try {
      await apiClient("/assessments/tests", { method: "POST", body: testData })
      setIsAdding(false)
      fetchData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleImport = async (template: CreateTestDto) => {
    setActionLoading(true)
    try {
      await apiClient("/assessments/tests/import", { method: "POST", body: template })
      setIsImporting(false)
      fetchData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Haqiqatan ham ushbu testni o'chirmoqchimisiz?")) return
    try {
      await apiClient(`/assessments/tests/${id}`, { method: "DELETE" })
      fetchData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const setPublished = async (id: number, isPublished: boolean) => {
    setActionLoading(true)
    try {
      await apiClient(`/assessments/tests/${id}`, { method: "PATCH", body: { isPublished } })
      fetchData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (isAdding) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Yangi test yaratish" 
          description="Savollar va javoblarni kiriting" 
          icon={Plus} 
          actions={[{ label: "Orqaga", onClick: () => setIsAdding(false), variant: "outline" }]}
        />
        <TestBuilder onSave={handleSave} onCancel={() => setIsAdding(false)} loading={actionLoading} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Psixologik testlar"
        description="Boshqaruv, tahlil va import tizimi"
        icon={ClipboardList}
        badge={total ? `${total} ta` : undefined}
        actions={[
          { label: "Yangilash", onClick: fetchData, icon: RefreshCw, variant: "outline" },
          { label: "Import", onClick: () => setIsImporting(true), icon: Download, variant: "secondary" },
          { label: "Yangi test", onClick: () => setIsAdding(true), icon: Plus },
        ]}
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test nomi</TableHead>
                  <TableHead>Kategoriya</TableHead>
                  <TableHead>Savollar</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10">Yuklanmoqda...</TableCell></TableRow>
                ) : data.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Testlar mavjud emas</TableCell></TableRow>
                ) : data.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">{test.title}</TableCell>
                    <TableCell><Badge variant="secondary">{test.category || "General"}</Badge></TableCell>
                    <TableCell>{test._count?.questions || 0} ta</TableCell>
                    <TableCell>
                      <Badge variant={test.isPublished ? "default" : "outline"}>
                        {test.isPublished ? "Chop etilgan" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {test.isPublished ? (
                            <DropdownMenuItem onClick={() => setPublished(test.id, false)}>
                              Draftga qaytarish
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => setPublished(test.id, true)}>
                              <CheckCircle2 className="size-4 mr-2" /> Mobilda chop etish
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(test.id)}>
                            <Trash2 className="size-4 mr-2" /> O'chirish
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isImporting} onOpenChange={setIsImporting}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>Tayyor shablondan import qilish</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            {TEST_TEMPLATES.map((tmpl, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors">
                <div>
                  <h4 className="font-bold">{tmpl.title}</h4>
                  <p className="text-xs text-muted-foreground">{tmpl.questions.length} ta savol</p>
                </div>
                <Button size="sm" className="gap-1" onClick={() => handleImport(tmpl)} disabled={actionLoading}>
                   Import kiritish
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}