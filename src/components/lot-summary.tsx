"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Package, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type LotToken = {
  tokenId: string
  symbol: string
  quantity: number
  currency: "XRP" | "USD"
}

type LotSummaryProps = {
  tokens: LotToken[]
  onRemoveToken: (tokenId: string) => void
}

export function LotSummary({ tokens, onRemoveToken }: LotSummaryProps) {
  const totalTokens = tokens.reduce((sum, t) => sum + t.quantity, 0)
  const tokenTypes = tokens.length

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Lot Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Token types</span>
            <span className="font-medium">{tokenTypes}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total bonds</span>
            <span className="font-medium">{totalTokens}</span>
          </div>
        </div>

        {tokens.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-semibold">Tokens in lot</p>
              {tokens.map((token) => (
                <div key={token.tokenId} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{token.symbol}</p>
                    <p className="text-xs text-muted-foreground">Qty: {token.quantity}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {token.currency}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => onRemoveToken(token.tokenId)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}

        {tokens.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tokens added yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
