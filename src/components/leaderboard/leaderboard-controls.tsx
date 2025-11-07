"use client"

import type { SortOption, FilterOptions } from "@/lib/bonds"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

type LeaderboardControlsProps = {
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
  filters: FilterOptions
  onFilterChange: (filters: FilterOptions) => void
}

export function LeaderboardControls({ sortBy, onSortChange, filters, onFilterChange }: LeaderboardControlsProps) {
  const activeFilterCount = Object.values(filters).filter(Boolean).length

  const clearFilters = () => {
    onFilterChange({})
  }

  const removeFilter = (key: keyof FilterOptions) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    onFilterChange(newFilters)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortOption)}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="size-asc">Size: Smallest first</SelectItem>
              <SelectItem value="size-desc">Size: Largest first</SelectItem>
              <SelectItem value="maturity-asc">Maturity: Nearest first</SelectItem>
              <SelectItem value="maturity-desc">Maturity: Farthest first</SelectItem>
              <SelectItem value="roi-desc">ROI: Highest first</SelectItem>
              <SelectItem value="roi-asc">ROI: Lowest first</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select
            value={filters.format || "all"}
            onValueChange={(value) =>
              onFilterChange({
                ...filters,
                format: value === "all" ? undefined : (value as "CLASSIC" | "ZERO_COUPON"),
              })
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Formats</SelectItem>
              <SelectItem value="CLASSIC">Classic</SelectItem>
              <SelectItem value="ZERO_COUPON">Zero-coupon</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.currency || "all"}
            onValueChange={(value) =>
              onFilterChange({
                ...filters,
                currency: value === "all" ? undefined : (value as "XRP" | "USD"),
              })
            }
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Currencies</SelectItem>
              <SelectItem value="XRP">XRP</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.status || "all"}
            onValueChange={(value) =>
              onFilterChange({
                ...filters,
                status: value === "all" ? undefined : (value as "OPEN" | "CLOSED"),
              })
            }
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.kycRequired === undefined ? "all" : filters.kycRequired ? "required" : "not-required"}
            onValueChange={(value) =>
              onFilterChange({
                ...filters,
                kycRequired: value === "all" ? undefined : value === "required" ? true : false,
              })
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="KYC" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All KYC</SelectItem>
              <SelectItem value="required">KYC Required</SelectItem>
              <SelectItem value="not-required">No KYC</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters ({activeFilterCount})
          </Button>
        )}
      </div>

      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.format && (
            <Badge variant="secondary" className="gap-1">
              Format: {filters.format === "CLASSIC" ? "Classic" : "Zero-coupon"}
              <button onClick={() => removeFilter("format")} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.currency && (
            <Badge variant="secondary" className="gap-1">
              Currency: {filters.currency}
              <button onClick={() => removeFilter("currency")} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.status}
              <button onClick={() => removeFilter("status")} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.kycRequired !== undefined && (
            <Badge variant="secondary" className="gap-1">
              KYC: {filters.kycRequired ? "Required" : "Not required"}
              <button onClick={() => removeFilter("kycRequired")} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
