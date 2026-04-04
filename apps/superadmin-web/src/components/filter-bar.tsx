"use client"

import { useState } from "react"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FilterOption {
  key: string
  label: string
  options: { value: string; label: string }[]
}

interface FilterBarProps {
  searchPlaceholder?: string
  onSearch: (value: string) => void
  filters?: FilterOption[]
  onFilterChange?: (key: string, value: string) => void
  activeFilters?: Record<string, string>
}

export function FilterBar({
  searchPlaceholder = "Qidirish...",
  onSearch,
  filters,
  onFilterChange,
  activeFilters = {},
}: FilterBarProps) {
  const [searchValue, setSearchValue] = useState("")

  const handleSearch = () => {
    onSearch(searchValue)
  }

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length

  return (
    <div className="flex flex-col gap-3 mb-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9 h-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleSearch} className="h-9">
          Qidirish
        </Button>
        {filters && filters.length > 0 && (
          <>
            {filters.map((filter) => (
              <Select
                key={filter.key}
                value={activeFilters[filter.key] || ""}
                onValueChange={(v) => onFilterChange?.(filter.key, v)}
              >
                <SelectTrigger className="w-40 h-9">
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </>
        )}
      </div>
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtrlar:</span>
          {Object.entries(activeFilters).map(([key, value]) =>
            value ? (
              <Badge key={key} variant="secondary" className="gap-1 text-xs">
                {value}
                <X
                  className="size-3 cursor-pointer"
                  onClick={() => onFilterChange?.(key, "")}
                />
              </Badge>
            ) : null
          )}
        </div>
      )}
    </div>
  )
}
