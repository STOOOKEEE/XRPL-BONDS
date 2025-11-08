"use client"

import { useState, useMemo, useEffect } from "react"
import type { Bond, SortOption, FilterOptions } from "@/lib/bonds"
import { BondCard } from "@/components/bonds"
import { LeaderboardControls } from "@/components/leaderboard"

type LeaderboardProps = {
  bonds: Bond[]
  viewOnly?: boolean
  onBondClick?: (bond: Bond) => void
  showInvestButton?: boolean
}

export function Leaderboard({ bonds, viewOnly = false, onBondClick, showInvestButton = true }: LeaderboardProps) {
  const [sortBy, setSortBy] = useState<SortOption>("size-desc")
  const [filters, setFilters] = useState<FilterOptions>({})
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const filteredAndSortedBonds = useMemo(() => {
    let result = [...bonds]

    // Apply filters
    if (filters.format) {
      result = result.filter((bond) => bond.format === filters.format)
    }
    if (filters.currency) {
      result = result.filter((bond) => bond.currency === filters.currency)
    }
    if (filters.status) {
      result = result.filter((bond) => bond.status === filters.status)
    }
    if (filters.kycRequired !== undefined) {
      result = result.filter((bond) => bond.kycRequired === filters.kycRequired)
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "size-asc":
          return a.principalTarget - b.principalTarget
        case "size-desc":
          return b.principalTarget - a.principalTarget
        case "maturity-asc":
          return new Date(a.maturityISO).getTime() - new Date(b.maturityISO).getTime()
        case "maturity-desc":
          return new Date(b.maturityISO).getTime() - new Date(a.maturityISO).getTime()
        case "roi-asc": {
          const aRoi = a.apyDisplay || a.roiDisplay || 0
          const bRoi = b.apyDisplay || b.roiDisplay || 0
          return aRoi - bRoi
        }
        case "roi-desc": {
          const aRoi = a.apyDisplay || a.roiDisplay || 0
          const bRoi = b.apyDisplay || b.roiDisplay || 0
          return bRoi - aRoi
        }
        default:
          return 0
      }
    })

    return result
  }, [bonds, filters, sortBy])

  // Éviter les problèmes d'hydratation avec les Select components
  if (!isMounted) {
    return (
      <div className="space-y-6">
        <div className="h-20 animate-pulse bg-muted rounded-lg" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bonds.slice(0, 6).map((bond) => (
            <div key={bond.id} className="h-64 animate-pulse bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <LeaderboardControls sortBy={sortBy} onSortChange={setSortBy} filters={filters} onFilterChange={setFilters} />

      {filteredAndSortedBonds.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No bonds match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedBonds.map((bond, index) => (
            <BondCard
              key={bond.id}
              bond={bond}
              index={index}
              viewOnly={viewOnly}
              onClick={onBondClick ? () => onBondClick(bond) : undefined}
              showInvestButton={showInvestButton}
            />
          ))}
        </div>
      )}
    </div>
  )
}
