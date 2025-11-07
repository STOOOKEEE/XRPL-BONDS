"use client"

import { useState } from "react"
import type { Offer } from "@/lib/bonds"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/bonds"
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react"

type BuyOfferModalProps = {
  offer: Offer | null
  isOpen: boolean
  onClose: () => void
}

type Step = "trustline-check" | "confirm" | "success"

export function BuyOfferModal({ offer, isOpen, onClose }: BuyOfferModalProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<Step>("trustline-check")
  const [isProcessing, setIsProcessing] = useState(false)
  const [txHash, setTxHash] = useState("")
  const [needsTrustline, setNeedsTrustline] = useState(false)

  const handleClose = () => {
    setStep("trustline-check")
    setNeedsTrustline(false)
    setTxHash("")
    onClose()
  }

  const handleTrustlineCheck = async () => {
    setIsProcessing(true)
    try {
      // Mock trustline check
      await new Promise((resolve) => setTimeout(resolve, 1000))
      // For demo, randomly decide if trustline is needed
      const needsSetup = offer?.tokens[0]?.currency === "USD" && Math.random() > 0.5
      setNeedsTrustline(needsSetup)

      if (needsSetup) {
        toast({
          title: "Trustline required",
          description: "Setting up trustline for token series",
        })
        await new Promise((resolve) => setTimeout(resolve, 2000))
        toast({
          title: "Trustline established",
          description: "You can now proceed with the purchase",
        })
      }

      setStep("confirm")
    } catch (error) {
      toast({
        title: "Check failed",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirm = async () => {
    setIsProcessing(true)
    try {
      // Mock transaction with tfFillOrKill
      await new Promise((resolve) => setTimeout(resolve, 2500))
      const mockTxHash = `0x${Math.random().toString(16).slice(2, 66)}`
      setTxHash(mockTxHash)
      setStep("success")
      toast({
        title: "Purchase successful!",
        description: "Bond tokens have been transferred to your wallet",
      })
    } catch (error) {
      toast({
        title: "Transaction failed",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!offer) return null

  const primaryCurrency = offer.tokens[0]?.currency || "XRP"

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Purchase Offer</DialogTitle>
          <DialogDescription>Offer ID: {offer.id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === "trustline-check" && (
            <>
              <div className="rounded-lg bg-muted p-4 space-y-3">
                <h4 className="font-medium text-sm">Offer Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Seller</span>
                    <span className="font-medium">{offer.sellerDisplay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total bonds</span>
                    <span className="font-medium">{offer.tokens.reduce((sum, t) => sum + t.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Token types</span>
                    <span className="font-medium">{offer.tokens.length}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between">
                    <span className="font-semibold">Total Price</span>
                    <span className="text-lg font-bold">{formatCurrency(offer.summaryValue, primaryCurrency)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <p className="text-xs text-amber-900 dark:text-amber-200">
                  This is a non-splittable lot. You must purchase all tokens together.
                </p>
              </div>

              <Button onClick={handleTrustlineCheck} className="w-full" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking requirements...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </>
          )}

          {step === "confirm" && (
            <>
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <h4 className="font-medium text-sm">Confirm Purchase</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total price</span>
                    <span className="font-medium">{formatCurrency(offer.summaryValue, primaryCurrency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network fees</span>
                    <span className="font-medium">~0.00001 XRP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform fees</span>
                    <span className="font-medium">0 {primaryCurrency}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Transaction will use tfFillOrKill flag to prevent partial fills. The entire offer will be purchased or
                the transaction will fail.
              </p>

              <p className="text-xs text-muted-foreground">Please confirm the transaction in your GemWallet.</p>

              <Button onClick={handleConfirm} className="w-full" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Purchase"
                )}
              </Button>
            </>
          )}

          {step === "success" && (
            <>
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg">Purchase Complete!</h3>
                  <p className="text-sm text-muted-foreground">
                    All bond tokens have been transferred to your wallet successfully.
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction</span>
                    <span className="font-mono text-xs">{txHash.slice(0, 16)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bonds received</span>
                    <span className="font-medium">{offer.tokens.reduce((sum, t) => sum + t.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total paid</span>
                    <span className="font-medium">{formatCurrency(offer.summaryValue, primaryCurrency)}</span>
                  </div>
                </div>
              </div>

              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
