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
  /** Hide search/filter toolbar (e.g. when API has no server-side search). */
  hideToolbar?: boolean
  /** Replaces default empty-state hint under "Ma'lumot topilmadi". */
  emptySubtext?: string
}

export function DataTable<T extends Record<string, any>>({
  title, description, columns, data, total, page, limit,
  loading, error, search: externalSearch, searchPlaceholder,
  onPageChange, onSearch, onSearchChange, headerAction, filterFields, activeFilters, onFilterChange, onResetFilters, filters,
  hideToolbar = false,
  emptySubtext,
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

      <Card className="overflow-hidden">
        {!hideToolbar && (
          <CardHeader className="mb-0 border-b border-border/70 bg-muted/25 pb-4 pt-5">
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
        )}
        <CardContent className={hideToolbar ? "pt-6" : "pt-5"}>
          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive dark:border-destructive/40 dark:bg-destructive/10">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span className="leading-relaxed">{error}</span>
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
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/15 px-6 py-16 text-muted-foreground">
              <Inbox className="mb-4 size-12 opacity-35" strokeWidth={1.25} />
              <p className="font-medium text-foreground/80">Ma'lumot topilmadi</p>
              <p className="mt-1 max-w-sm text-center text-xs leading-relaxed text-muted-foreground">
                {emptySubtext ?? "Qidiruv parametrlarini o'zgartiring"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border border-border/70 bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
                      {columns.map((col) => (
                        <TableHead
                          key={col.key}
                          className="h-11 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                          {col.header || col.title}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item, idx) => (
                      <TableRow
                        key={item.id || idx}
                        className="border-border/50 transition-colors hover:bg-primary/[0.035] dark:hover:bg-primary/[0.06]"
                      >
                        {columns.map((col) => (
                          <TableCell key={col.key} className="align-middle py-3 text-sm">
                            {col.render ? col.render(item) : item[col.key]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Jami: <span className="font-semibold tabular-nums text-foreground">{total}</span> ta
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 min-w-8 px-2 shadow-sm"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="min-w-[4.5rem] px-2 text-center text-sm font-medium tabular-nums text-foreground">
                    {page} / {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 min-w-8 px-2 shadow-sm"
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
