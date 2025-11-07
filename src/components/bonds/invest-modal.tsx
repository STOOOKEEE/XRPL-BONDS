"use client"

import { useState } from "react"
import type { Bond } from "@/lib/bonds"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/bonds"
import { CheckCircle2, Loader2 } from "lucide-react"

type InvestModalProps = {
  bond: Bond | null
  isOpen: boolean
  onClose: () => void
}

type Step = "amount" | "trustline" | "confirm" | "success"

export function InvestModal({ bond, isOpen, onClose }: InvestModalProps) {
  const { toast } = useToast()
  const [amount, setAmount] = useState("")
  const [step, setStep] = useState<Step>("amount")
  const [isProcessing, setIsProcessing] = useState(false)
  const [txHash, setTxHash] = useState("")

  const handleClose = () => {
    setAmount("")
    setStep("amount")
    setTxHash("")
    onClose()
  }

  const handleAmountSubmit = () => {
    const investAmount = Number.parseFloat(amount)
    if (!bond) return

    if (isNaN(investAmount) || investAmount < bond.minTicket) {
      toast({
        title: "Invalid amount",
        description: `Minimum investment is ${formatCurrency(bond.minTicket, bond.currency)}`,
        variant: "destructive",
      })
      return
    }

    if (investAmount > bond.principalTarget - bond.raised) {
      toast({
        title: "Amount exceeds availability",
        description: "Please enter a smaller amount",
        variant: "destructive",
      })
      return
    }

    // For USD IOUs, we need to check/create trustline
    if (bond.currency === "USD") {
      setStep("trustline")
    } else {
      setStep("confirm")
    }
  }

  const handleTrustlineSetup = async () => {
    setIsProcessing(true)
    try {
      // Mock trustline setup - in real implementation, this would call GemWallet
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast({
        title: "Trustline established",
        description: "You can now proceed with the investment",
      })
      setStep("confirm")
    } catch (error) {
      toast({
        title: "Trustline setup failed",
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
      // Mock transaction - in real implementation, this would call GemWallet
      await new Promise((resolve) => setTimeout(resolve, 2500))
      const mockTxHash = `0x${Math.random().toString(16).slice(2, 66)}`
      setTxHash(mockTxHash)
      setStep("success")
      toast({
        title: "Investment successful!",
        description: "Your bond tokens will be issued shortly",
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

  if (!bond) return null

  const investAmount = Number.parseFloat(amount) || 0
  const estimatedBonds = investAmount > 0 ? Math.floor(investAmount / 1000) : 0

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invest in {bond.symbol}</DialogTitle>
          <DialogDescription>{bond.issuerName}</DialogDescription>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="flex items-center justify-between py-4">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                step === "amount" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {step !== "amount" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <span className="text-sm font-medium">1</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">Amount</span>
          </div>

          {bond.currency === "USD" && (
            <>
              <Separator className="flex-1 mx-2" />
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    step === "trustline"
                      ? "bg-primary text-primary-foreground"
                      : step === "confirm" || step === "success"
                        ? "bg-muted text-muted-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step === "confirm" || step === "success" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">2</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">Trustline</span>
              </div>
            </>
          )}

          <Separator className="flex-1 mx-2" />
          <div className="flex flex-col items-center gap-1">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                step === "confirm"
                  ? "bg-primary text-primary-foreground"
                  : step === "success"
                    ? "bg-muted text-muted-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {step === "success" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <span className="text-sm font-medium">{bond.currency === "USD" ? "3" : "2"}</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">Confirm</span>
          </div>
        </div>

        <div className="space-y-4">
          {step === "amount" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="amount">Investment Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder={`Min: ${formatCurrency(bond.minTicket, bond.currency)}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={bond.minTicket}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum ticket: {formatCurrency(bond.minTicket, bond.currency)}
                </p>
              </div>

              <div className="rounded-lg bg-muted p-4 space-y-2">
                <h4 className="font-medium text-sm">Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">{formatCurrency(investAmount, bond.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. fees</span>
                    <span className="font-medium">0 {bond.currency}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. bonds received</span>
                    <span className="font-medium">{estimatedBonds}</span>
                  </div>
                </div>
              </div>

              <Button onClick={handleAmountSubmit} className="w-full" disabled={!amount}>
                Continue
              </Button>
            </>
          )}

          {step === "trustline" && (
            <>
              <div className="rounded-lg border border-border bg-card p-4 space-y-2">
                <h4 className="font-medium">Trustline Required</h4>
                <p className="text-sm text-muted-foreground">
                  To receive USD-denominated bonds, you need to establish a trustline for the {bond.symbol} token.
                </p>
                <p className="text-sm text-muted-foreground">
                  This is a one-time setup that allows your wallet to hold this token.
                </p>
              </div>

              <Button onClick={handleTrustlineSetup} className="w-full" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up trustline...
                  </>
                ) : (
                  "Establish Trustline"
                )}
              </Button>
            </>
          )}

          {step === "confirm" && (
            <>
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <h4 className="font-medium text-sm">Confirm Investment</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bond</span>
                    <span className="font-medium">{bond.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">{formatCurrency(investAmount, bond.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network fees</span>
                    <span className="font-medium">~0.00001 XRP</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">Please confirm the transaction in your GemWallet.</p>

              <Button onClick={handleConfirm} className="w-full" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm on Wallet"
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
                  <h3 className="font-semibold text-lg">Investment Successful!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your investment has been processed. Bond tokens will be issued to your wallet.
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
                    <span className="text-muted-foreground">Amount invested</span>
                    <span className="font-medium">{formatCurrency(investAmount, bond.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bonds received</span>
                    <span className="font-medium">{estimatedBonds}</span>
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
