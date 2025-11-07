"use client"

import type { OfferToken } from "@/lib/bonds"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/bonds"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import Link from "next/link"

type TokenDrawerProps = {
  token: OfferToken | null
  isOpen: boolean
  onClose: () => void
}

export function TokenDrawer({ token, isOpen, onClose }: TokenDrawerProps) {
  if (!token) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Token Details</SheetTitle>
          <SheetDescription>{token.tokenId}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Token Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Token Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token ID</span>
                <span className="font-mono text-xs">{token.tokenId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-medium">{token.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unit Price</span>
                <span className="font-medium">{formatCurrency(token.unitPrice, token.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Value</span>
                <span className="font-semibold">
                  {formatCurrency(token.quantity * token.unitPrice, token.currency)}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Coupon Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Coupon Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coupons Collected</span>
                <span className="font-medium">
                  {formatCurrency(token.metadata.couponsCollectedValue, token.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coupons Remaining</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {formatCurrency(token.metadata.couponsRemainingValue, token.currency)}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total (All Paid)</span>
                <span className="font-semibold">
                  {formatCurrency(token.metadata.totalAssumingAllPaid, token.currency)}
                </span>
              </div>
            </div>
          </div>

          {token.metadata.lastCouponISO && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Payment Schedule</h3>
                <div className="space-y-2 text-sm">
                  {token.metadata.lastCouponISO && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Coupon</span>
                      <span>{format(new Date(token.metadata.lastCouponISO), "MMM d, yyyy")}</span>
                    </div>
                  )}
                  {token.metadata.nextCouponISO && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Next Coupon</span>
                      <Badge variant="outline">{format(new Date(token.metadata.nextCouponISO), "MMM d, yyyy")}</Badge>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          <Button variant="outline" className="w-full bg-transparent" asChild>
            <Link href={`/invest?bond=${token.bondId}`}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View Bond Details
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
