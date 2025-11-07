"use client"

import type { Offer, OfferToken } from "@/lib/bonds"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/bonds"
import { format } from "date-fns"
import { AlertCircle, Clock, Package, User } from "lucide-react"

type OfferDetailProps = {
  offer: Offer
  onTokenClick: (token: OfferToken) => void
  onBuy: () => void
}

export function OfferDetail({ offer, onTokenClick, onBuy }: OfferDetailProps) {
  const isExpired = new Date(offer.expiryISO) < new Date()
  const status = isExpired ? "EXPIRED" : offer.status
  const canBuy = status === "ACTIVE"

  const getStatusColor = () => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500/10 text-green-600 dark:text-green-400"
      case "FILLED":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400"
      case "EXPIRED":
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400"
      case "CANCELLED":
        return "bg-red-500/10 text-red-600 dark:text-red-400"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const primaryCurrency = offer.tokens[0]?.currency || "XRP"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl mb-2">Offer Details</CardTitle>
            <p className="text-muted-foreground">ID: {offer.id}</p>
          </div>
          <Badge className={getStatusColor()}>{status}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Offer Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="text-sm">Seller</span>
            </div>
            <p className="font-semibold">{offer.sellerDisplay}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Created</span>
            </div>
            <p className="font-semibold">{format(new Date(offer.createdISO), "MMM d, yyyy HH:mm")}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4" />
              <span className="text-sm">Total Bonds</span>
            </div>
            <p className="font-semibold">{offer.tokens.reduce((sum, t) => sum + t.quantity, 0)}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Expires</span>
            </div>
            <p className={`font-semibold ${isExpired ? "text-destructive" : ""}`}>
              {format(new Date(offer.expiryISO), "MMM d, yyyy HH:mm")}
            </p>
          </div>
        </div>

        <Separator />

        {/* Tokens Table */}
        <div className="space-y-3">
          <h3 className="font-semibold">Tokens in this offer</h3>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token ID</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offer.tokens.map((token) => (
                  <TableRow
                    key={token.tokenId}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onTokenClick(token)}
                  >
                    <TableCell className="font-mono text-sm">{token.tokenId}</TableCell>
                    <TableCell className="text-right">{token.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(token.unitPrice, token.currency)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(token.quantity * token.unitPrice, token.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">Click on a token row to view details</p>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center p-4 rounded-lg bg-muted">
          <span className="font-semibold">Total Offer Value</span>
          <span className="text-2xl font-bold">{formatCurrency(offer.summaryValue, primaryCurrency)}</span>
        </div>

        {/* Warnings */}
        {!canBuy && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-sm">
                {status === "EXPIRED" && "This offer has expired"}
                {status === "FILLED" && "This offer has been filled"}
                {status === "CANCELLED" && "This offer has been cancelled"}
              </p>
              <p className="text-xs text-muted-foreground">This offer is no longer available for purchase.</p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-sm text-amber-900 dark:text-amber-200">Not splittable</p>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              This offer must be purchased in full. Partial purchases are not allowed.
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button onClick={onBuy} disabled={!canBuy} size="lg" className="w-full">
          {canBuy ? "Buy Entire Lot" : "Unavailable"}
        </Button>
      </CardFooter>
    </Card>
  )
}
