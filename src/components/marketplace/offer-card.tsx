"use client"

import type { Offer } from "@/lib/bonds"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/bonds"
import { format, formatDistanceToNow } from "date-fns"
import { motion } from "framer-motion"
import { Clock, Package, TrendingUp } from "lucide-react"

type OfferCardProps = {
  offer: Offer
  index: number
  onClick: () => void
}

export function OfferCard({ offer, index, onClick }: OfferCardProps) {
  const isExpired = new Date(offer.expiryISO) < new Date()
  const status = isExpired ? "EXPIRED" : offer.status

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

  // Get primary currency from first token
  const primaryCurrency = offer.tokens[0]?.currency || "XRP"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card className="overflow-hidden transition-all hover:shadow-lg cursor-pointer" onClick={onClick}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">{offer.sellerDisplay}</h3>
              <p className="text-sm text-muted-foreground">
                Created {formatDistanceToNow(new Date(offer.createdISO), { addSuffix: true })}
              </p>
            </div>
            <Badge className={getStatusColor()}>{status}</Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {offer.tokens.length} token type{offer.tokens.length > 1 ? "s" : ""}
              </span>
              <span className="font-medium">{offer.tokens.reduce((sum, t) => sum + t.quantity, 0)} total bonds</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Total value</span>
              <span className="font-semibold text-lg">{formatCurrency(offer.summaryValue, primaryCurrency)}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Expires</span>
              <span className={isExpired ? "text-destructive" : ""}>
                {format(new Date(offer.expiryISO), "MMM d, yyyy HH:mm")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
