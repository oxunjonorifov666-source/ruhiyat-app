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
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full mb-4">
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={searchPlaceholder}
          className="w-full pl-8"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {filters.length > 0 && onFilterChange && (
        <div className="flex flex-1 items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-2 shrink-0 border-l pl-3 ml-1 text-muted-foreground sm:border-l-0 sm:pl-0 sm:ml-0">
            <Filter className="h-4 w-4" />
          </div>
          {filters.map((filter) => (
            <Select
              key={filter.id}
              value={activeFilters[filter.id] || "all"}
              onValueChange={(val) => onFilterChange(filter.id, val)}
            >
              <SelectTrigger className="w-[140px] h-9">
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
          className="shrink-0 h-9 px-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Tozalash
        </Button>
      )}
    </div>
  )
}
