"use client"

import { useEffect, useState, useCallback } from "react"
import { apiClient, PaginatedResponse } from "@/lib/api-client"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { BarChart3, Search, RefreshCw, User, Calendar, ExternalLink } from "lucide-react"

interface TestResult {
  id: number
  testId: number
  userId: number
  score: number | null
  maxScore: number | null
  completedAt: string
  test: {
    title: string
    category: string | null
  }
}

export default function TestResultsPage() {
  const [data, setData] = useState<TestResult[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient<PaginatedResponse<TestResult>>("/assessments/test-results", { 
        params: { search: search || undefined } 
      })
      setData(res.data)
      setTotal(res.total)
    } catch {} finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Test Natijalari"
        description="Foydalanuvchilarning barcha test natijalari va statistikasi"
        icon={BarChart3}
        badge={total ? `${total} ta natija` : undefined}
        actions={[
          { label: "Yangilash", onClick: fetchData, icon: RefreshCw, variant: "outline" }
        ]}
      />

      <Card>
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
              placeholder="Foydalanuvchi yoki test bo'yicha qidirish..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-9 h-9" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10">
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead className="min-w-[200px]">Foydalanuvchi ID</TableHead>
                  <TableHead className="min-w-[250px]">Test</TableHead>
                  <TableHead className="text-center font-bold">Ball</TableHead>
                  <TableHead>Kategoriya</TableHead>
                  <TableHead>Sana</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20">Analitikalar yuklanmoqda...</TableCell></TableRow>
                ) : data.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">Hali natijalar mavjud emas</TableCell></TableRow>
                ) : data.map((res) => (
                  <TableRow key={res.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-xs text-muted-foreground font-mono">#{res.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                          <User className="size-3" />
                        </div>
                        <span className="font-medium text-sm">Foydalanuvchi #{res.userId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-primary">{res.test.title}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{res.score || 0}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">dan {res.maxScore || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{res.test.category || "General"}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="size-3" />
                        {new Date(res.completedAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
