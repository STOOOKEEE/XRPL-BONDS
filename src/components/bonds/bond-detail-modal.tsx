"use client"

import type { Bond } from "@/lib/bonds"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { formatCurrency, formatPercentage, getBondProgress } from "@/lib/bonds"
import { format } from "date-fns"
import { Calendar, TrendingUp, Shield, Building2, CreditCard } from "lucide-react"
import { useWallet } from "@/context/WalletContext"
import { InvestModal } from "./invest-modal"
import { useState } from "react"

type BondDetailModalProps = {
  bond: Bond | null
  isOpen: boolean
  onClose: () => void
}

export function BondDetailModal({ bond, isOpen, onClose }: BondDetailModalProps) {
  const { isConnected } = useWallet()
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false)

  if (!bond) return null

  const progress = getBondProgress(bond)
  const isFullyFunded = progress >= 100
  const isClosed = bond.status === "CLOSED" || isFullyFunded

  const handleInvest = () => {
    setIsInvestModalOpen(true)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{bond.issuerName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant={bond.format === "CLASSIC" ? "default" : "secondary"}>
                {bond.format === "CLASSIC" ? "Classic" : "Zero-coupon"}
              </Badge>
              <Badge variant="outline">{bond.currency}</Badge>
              <Badge variant="outline" className="gap-1">
                <Calendar className="h-3 w-3" />
                Matures {format(new Date(bond.maturityISO), "MMM d, yyyy")}
              </Badge>
              {bond.kycRequired && (
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" />
                  KYC Required
                </Badge>
              )}
              {isClosed && <Badge variant="secondary">Fully Funded</Badge>}
            </div>

            {/* Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Funding Progress</span>
                <span className="font-medium">{progress.toFixed(1)}%</span>
              </div>
              <Progress value={progress} className="h-3 mb-2" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{formatCurrency(bond.raised, bond.currency)} raised</span>
                <span className="text-muted-foreground">
                  {formatCurrency(bond.principalTarget, bond.currency)} target
                </span>
              </div>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    {bond.format === "CLASSIC" ? "Annual Yield" : "Total Return"}
                  </p>
                </div>
                <p className="text-2xl font-bold">
                  {bond.format === "CLASSIC"
                    ? formatPercentage(bond.apyDisplay || 0)
                    : formatPercentage(bond.roiDisplay || 0)}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <p className="text-sm text-muted-foreground">Minimum Investment</p>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(bond.minTicket, bond.currency)}</p>
              </div>
            </div>

            {/* Bond details */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Bond Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Symbol</span>
                  <span className="font-medium">{bond.symbol}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Currency</span>
                  <span className="font-medium">{bond.currency}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Format</span>
                  <span className="font-medium">{bond.format === "CLASSIC" ? "Classic" : "Zero-coupon"}</span>
                </div>
                {bond.format === "CLASSIC" && (
                  <>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Coupon Rate</span>
                      <span className="font-medium">{formatPercentage(bond.couponRate || 0)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Coupon Frequency</span>
                      <span className="font-medium capitalize">{bond.couponFrequency?.toLowerCase()}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Total Repayment</span>
                  <span className="font-medium">{formatCurrency(bond.totalRepayment, bond.currency)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Maturity Date</span>
                  <span className="font-medium">{format(new Date(bond.maturityISO), "MMMM d, yyyy")}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-4">
              {!isClosed && isConnected && bond.status === "OPEN" ? (
                <Button onClick={handleInvest} className="flex-1" size="lg">
                  Invest Now
                </Button>
              ) : !isConnected ? (
                <Button disabled className="flex-1" size="lg">
                  Connect Wallet to Invest
                </Button>
              ) : (
                <Button variant="outline" className="flex-1 bg-transparent" size="lg" disabled>
                  Fully Funded
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <InvestModal bond={bond} isOpen={isInvestModalOpen} onClose={() => setIsInvestModalOpen(false)} />
    </>
  )
}
