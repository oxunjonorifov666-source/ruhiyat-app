"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, ChevronLeft, ChevronRight, AlertCircle, Inbox } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { FilterBar, FilterField } from "./filter-bar"

interface Column<T> {
  key: string
  title?: string
  header?: string
  render?: (item: T) => React.ReactNode
}

interface DataTableProps<T> {
  title?: string
  description?: string
  columns: Column<T>[]
  data: T[]
  total: number
  page: number
  limit: number
  loading: boolean
  error?: string | null
  search?: string
  searchPlaceholder?: string
  onPageChange: (page: number) => void
  onSearch?: (search: string) => void
  onSearchChange?: (search: string) => void
  headerAction?: React.ReactNode
  filterFields?: FilterField[]
  activeFilters?: Record<string, string>
  onFilterChange?: (filterId: string, value: string) => void
  onResetFilters?: () => void
  filters?: React.ReactNode
}

export function DataTable<T extends Record<string, any>>({
  title, description, columns, data, total, page, limit,
  loading, error, search: externalSearch, searchPlaceholder,
  onPageChange, onSearch, onSearchChange, headerAction, filterFields, activeFilters, onFilterChange, onResetFilters, filters
}: DataTableProps<T>) {
  const [searchValue, setSearchValue] = useState(externalSearch || "")
  const debouncedSearch = useDebounce(searchValue, 400)
  const totalPages = Math.ceil(total / (limit || 20))

  useEffect(() => {
    if (onSearchChange) {
      onSearchChange(debouncedSearch)
    }
  }, [debouncedSearch])

  const handleSearchChange = (val: string) => {
    setSearchValue(val)
  }

  return (
    <div className="space-y-4">
      {title && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description && <p className="text-muted-foreground mt-1">{description}</p>}
          </div>
          {headerAction}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3 border-b mb-4">
          <FilterBar
            searchQuery={searchValue}
            onSearchChange={handleSearchChange}
            searchPlaceholder={searchPlaceholder}
            filters={filterFields}
            activeFilters={activeFilters}
            onFilterChange={(f, v) => onFilterChange ? onFilterChange(f, v) : null}
            onResetFilters={() => {
              setSearchValue("")
              if (onResetFilters) onResetFilters()
            }}
          />
          {filters && <div className="mt-4">{filters}</div>}
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-1">
              <Skeleton className="h-10 w-full rounded-t-md" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !data || data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Inbox className="size-12 mb-3 opacity-40" />
              <p className="font-medium">Ma'lumot topilmadi</p>
              <p className="text-xs mt-1">Qidiruv parametrlarini o'zgartiring</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {columns.map((col) => (
                        <TableHead key={col.key} className="font-semibold">
                          {col.header || col.title}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item, idx) => (
                      <TableRow
                        key={item.id || idx}
                        className="transition-colors hover:bg-muted/40"
                      >
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
                  Jami: <span className="font-medium text-foreground">{total}</span> ta
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
                  <span className="text-sm tabular-nums">
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
