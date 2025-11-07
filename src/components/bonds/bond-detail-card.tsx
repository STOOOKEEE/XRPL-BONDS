"use client"

import type { Bond } from "@/lib/bonds"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, formatPercentage, getBondProgress, getYearsToMaturity } from "@/lib/bonds"
import { format } from "date-fns"
import { Calendar, TrendingUp, Shield, DollarSign, Target, AlertCircle } from "lucide-react"

type BondDetailCardProps = {
  bond: Bond
  onInvest: () => void
}

export function BondDetailCard({ bond, onInvest }: BondDetailCardProps) {
  const progress = getBondProgress(bond)
  const yearsToMaturity = getYearsToMaturity(bond.maturityISO)
  const isFullyFunded = progress >= 100
  const isClosed = bond.status === "CLOSED" || isFullyFunded

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl mb-2">{bond.issuerName}</CardTitle>
            <p className="text-muted-foreground">{bond.symbol}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={bond.format === "CLASSIC" ? "default" : "secondary"} className="text-sm">
              {bond.format === "CLASSIC" ? "Classic Bond" : "Zero-coupon Bond"}
            </Badge>
            {bond.kycRequired && (
              <Badge variant="outline" className="gap-1">
                <Shield className="h-3 w-3" />
                KYC Required
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <h3 className="font-semibold text-sm">Fundraising Progress</h3>
            <span className="text-2xl font-bold">{progress.toFixed(1)}%</span>
          </div>
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Raised: {formatCurrency(bond.raised, bond.currency)}</span>
            <span>Target: {formatCurrency(bond.principalTarget, bond.currency)}</span>
          </div>
        </div>

        <Separator />

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">{bond.format === "CLASSIC" ? "APY" : "Total ROI"}</span>
            </div>
            <p className="text-2xl font-bold">
              {bond.format === "CLASSIC"
                ? formatPercentage(bond.apyDisplay || 0)
                : formatPercentage(bond.roiDisplay || 0)}
            </p>
            {bond.format === "CLASSIC" && (
              <p className="text-xs text-muted-foreground">
                {formatPercentage(bond.couponRate || 0)} {bond.couponFrequency?.toLowerCase()} coupons
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Maturity</span>
            </div>
            <p className="text-2xl font-bold">{format(new Date(bond.maturityISO), "MMM d, yyyy")}</p>
            <p className="text-xs text-muted-foreground">{yearsToMaturity.toFixed(1)} years remaining</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Currency</span>
            </div>
            <p className="text-2xl font-bold">{bond.currency}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="h-4 w-4" />
              <span className="text-sm">Min. Ticket</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(bond.minTicket, bond.currency)}</p>
          </div>
        </div>

        <Separator />

        {/* Bond Details */}
        <div className="space-y-3">
          <h3 className="font-semibold">Bond Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Principal Target</span>
              <span className="font-medium">{formatCurrency(bond.principalTarget, bond.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Repayment at Maturity</span>
              <span className="font-medium">{formatCurrency(bond.totalRepayment, bond.currency)}</span>
            </div>
            {bond.format === "CLASSIC" && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coupon Rate</span>
                  <span className="font-medium">{formatPercentage(bond.couponRate || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coupon Frequency</span>
                  <span className="font-medium capitalize">{bond.couponFrequency?.toLowerCase()}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {isClosed && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-sm">This bond is closed</p>
              <p className="text-xs text-muted-foreground">
                {isFullyFunded
                  ? "This bond has reached its funding target."
                  : "This bond is no longer accepting investments."}
              </p>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button onClick={onInvest} disabled={isClosed} className="w-full" size="lg">
          {isClosed ? "Closed" : "Invest Now"}
        </Button>
      </CardFooter>
    </Card>
  )
}
