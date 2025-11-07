"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus } from "lucide-react"

type UserToken = {
  tokenId: string
  bondId: string
  symbol: string
  issuer: string
  available: number
  currency: "XRP" | "USD"
}

type TokenPickerProps = {
  tokens: UserToken[]
  selectedTokens: Map<string, number>
  onSelectionChange: (tokenId: string, quantity: number) => void
}

export function TokenPicker({ tokens, selectedTokens, onSelectionChange }: TokenPickerProps) {
  const [quantities, setQuantities] = useState<Map<string, string>>(new Map())

  const handleQuantityChange = (tokenId: string, value: string) => {
    const newQuantities = new Map(quantities)
    newQuantities.set(tokenId, value)
    setQuantities(newQuantities)
  }

  const handleAddToken = (token: UserToken) => {
    const quantityStr = quantities.get(token.tokenId) || "0"
    const quantity = Number.parseInt(quantityStr)

    if (quantity > 0 && quantity <= token.available) {
      onSelectionChange(token.tokenId, quantity)
      // Clear the input
      const newQuantities = new Map(quantities)
      newQuantities.delete(token.tokenId)
      setQuantities(newQuantities)
    }
  }

  const handleRemoveToken = (tokenId: string) => {
    onSelectionChange(tokenId, 0)
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Available Tokens</h3>

      {tokens.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No tokens available to sell</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tokens.map((token) => {
            const selectedQty = selectedTokens.get(token.tokenId) || 0
            const inputQty = quantities.get(token.tokenId) || ""
            const isSelected = selectedQty > 0

            return (
              <Card key={token.tokenId} className={isSelected ? "border-primary" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{token.symbol}</p>
                        <Badge variant="outline">{token.currency}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{token.issuer}</p>
                      <p className="text-xs text-muted-foreground">Token ID: {token.tokenId}</p>
                      <p className="text-sm font-medium mt-2">Available: {token.available}</p>
                    </div>

                    {isSelected ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="px-3 py-1">
                          {selectedQty} selected
                        </Badge>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveToken(token.tokenId)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          className="w-20"
                          min="1"
                          max={token.available}
                          value={inputQty}
                          onChange={(e) => handleQuantityChange(token.tokenId, e.target.value)}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleAddToken(token)}
                          disabled={
                            !inputQty || Number.parseInt(inputQty) <= 0 || Number.parseInt(inputQty) > token.available
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
