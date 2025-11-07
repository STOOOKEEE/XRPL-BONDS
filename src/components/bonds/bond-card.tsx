"use client"

import type { Bond } from "@/lib/bonds"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { formatCurrency, formatPercentage, getBondProgress } from "@/lib/bonds"
import { format } from "date-fns"
import { motion } from "framer-motion"
import { Calendar, TrendingUp, Shield } from "lucide-react"

type BondCardProps = {
  bond: Bond
  index: number
  viewOnly?: boolean
  onClick?: () => void
  showInvestButton?: boolean
}

export function BondCard({ bond, index, viewOnly = false, onClick, showInvestButton = true }: BondCardProps) {
  const progress = getBondProgress(bond)
  const isFullyFunded = progress >= 100
  const isClosed = bond.status === "CLOSED" || isFullyFunded

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={onClick}
      className={onClick ? "cursor-pointer" : ""}
    >
      <Card className="overflow-hidden transition-all hover:shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">{bond.issuerName}</h3>
              <p className="text-sm text-muted-foreground">{bond.symbol}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={bond.format === "CLASSIC" ? "default" : "secondary"}>
                {bond.format === "CLASSIC" ? "Classic" : "Zero-coupon"}
              </Badge>
              {bond.kycRequired && (
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" />
                  KYC
                </Badge>
              )}
              {isClosed && <Badge variant="secondary">Fully Funded</Badge>}
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <Badge variant="outline">{bond.currency}</Badge>
            <Badge variant="outline" className="gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(bond.maturityISO), "MMM yyyy")}
            </Badge>
          </div>

          <div className="space-y-3 mb-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Target</span>
                <span className="font-medium">{formatCurrency(bond.principalTarget, bond.currency)}</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Raised: {formatCurrency(bond.raised, bond.currency)}</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{bond.format === "CLASSIC" ? "APY" : "ROI"}</p>
                <p className="font-semibold">
                  {bond.format === "CLASSIC"
                    ? formatPercentage(bond.apyDisplay || 0)
                    : formatPercentage(bond.roiDisplay || 0)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        {showInvestButton && (
          <CardFooter className="p-6 pt-0">
            <Button className="w-full" onClick={onClick}>
              {viewOnly || isClosed ? "View Details" : "Invest"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  )
}
