"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

interface Column<T> {
  key: string
  title: string
  render?: (item: T) => React.ReactNode
}

interface DataTableProps<T> {
  title: string
  description?: string
  columns: Column<T>[]
  data: T[]
  total: number
  page: number
  limit: number
  loading: boolean
  error?: string | null
  searchPlaceholder?: string
  onPageChange: (page: number) => void
  onSearch: (search: string) => void
  headerAction?: React.ReactNode
}

export function DataTable<T extends Record<string, any>>({
  title, description, columns, data, total, page, limit,
  loading, error, searchPlaceholder, onPageChange, onSearch, headerAction,
}: DataTableProps<T>) {
  const [searchValue, setSearchValue] = useState("")
  const totalPages = Math.ceil(total / limit)

  const handleSearch = () => {
    onSearch(searchValue)
    onPageChange(1)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground mt-1">{description}</p>}
        </div>
        {headerAction}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder || "Qidirish..."}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleSearch}>
              Qidirish
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Ma'lumot topilmadi
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((col) => (
                        <TableHead key={col.key}>{col.title}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item, idx) => (
                      <TableRow key={item.id || idx}>
                        {columns.map((col) => (
                          <TableCell key={col.key}>
                            {col.render ? col.render(item) : item[col.key]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Jami: {total} ta
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="text-sm">
                    {page} / {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
