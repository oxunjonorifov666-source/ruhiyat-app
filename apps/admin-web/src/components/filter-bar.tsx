"use client"

import * as React from "react"
import { Search, X, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface FilterOption {
  label: string
  value: string
}

export interface FilterField {
  id: string
  placeholder: string
  options: FilterOption[]
}

interface FilterBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters?: FilterField[]
  activeFilters?: Record<string, string>
  onFilterChange?: (filterId: string, value: string) => void
  onResetFilters?: () => void
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Qidirish...",
  filters = [],
  activeFilters = {},
  onFilterChange,
  onResetFilters
}: FilterBarProps) {
  const hasActiveFilters = Object.values(activeFilters).some(v => v !== "" && v !== "all") || searchQuery !== ""

  return (
    <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center">
      <div className="relative w-full sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={searchPlaceholder}
          className="h-10 w-full rounded-lg border-border/60 bg-background/90 pl-9 shadow-sm transition-[box-shadow,border-color] placeholder:text-muted-foreground/80 focus-visible:border-primary/35 focus-visible:ring-2 focus-visible:ring-primary/15"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {filters.length > 0 && onFilterChange && (
        <div className="flex flex-1 items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div
            className="ml-0 flex shrink-0 items-center gap-2 border-border/50 pl-0 text-muted-foreground sm:ml-1 sm:border-l sm:pl-3"
            aria-hidden
          >
            <Filter className="h-4 w-4 opacity-80" />
          </div>
          {filters.map((filter) => (
            <Select
              key={filter.id}
              value={activeFilters[filter.id] || "all"}
              onValueChange={(val) => onFilterChange(filter.id, val)}
            >
              <SelectTrigger className="h-10 min-w-[140px] rounded-lg border-border/60 bg-background/90 text-sm shadow-sm focus:ring-2 focus:ring-primary/15">
                <SelectValue placeholder={filter.placeholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                {filter.options.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
      )}

      {hasActiveFilters && onResetFilters && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onResetFilters}
          className="h-10 shrink-0 px-3 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Tozalash
        </Button>
      )}
    </div>
  )
}
