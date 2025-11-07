"use client"

import type React from "react"

import { useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { validateTotalRepayment, formatCurrency } from "@/lib/bonds"
import { AlertCircle, CheckCircle2, HelpCircle, Building2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"

type BondFormat = "CLASSIC" | "ZERO_COUPON"
type Currency = "XRP" | "USDC"
type CouponFrequency = "ANNUAL" | "SEMIANNUAL" | "QUARTERLY"

export default function CorpoPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Form state
  const [companyName, setCompanyName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [principalTarget, setPrincipalTarget] = useState("")
  const [format, setFormat] = useState<BondFormat>("CLASSIC")
  const [currency] = useState<Currency>("USDC")
  const [maturityDate, setMaturityDate] = useState("")
  const [totalRepayment, setTotalRepayment] = useState("")
  const [couponRate, setCouponRate] = useState("")
  const [couponFrequency, setCouponFrequency] = useState<CouponFrequency>("ANNUAL")
  const [bondSymbol, setBondSymbol] = useState("")
  const [minTicket, setMinTicket] = useState("")
  const [hardCap, setHardCap] = useState("")
  const [kycRequired, setKycRequired] = useState(false)
  const [termsUrl, setTermsUrl] = useState("")
  const [disclosureAccepted, setDisclosureAccepted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!disclosureAccepted) {
      toast({
        title: "Disclosure required",
        description: "Please accept the disclosure to continue",
        variant: "destructive",
      })
      return
    }

    const principal = Number.parseFloat(principalTarget)
    const repayment = Number.parseFloat(totalRepayment)
    const maturityISO = `${maturityDate}T00:00:00.000Z`

    if (isNaN(principal) || principal <= 0) {
      toast({
        title: "Invalid principal target",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    if (new Date(maturityISO) <= new Date()) {
      toast({
        title: "Invalid maturity date",
        description: "Maturity date must be in the future",
        variant: "destructive",
      })
      return
    }

    if (!validateTotalRepayment(principal, repayment, maturityISO)) {
      toast({
        title: "Invalid total repayment",
        description: "Total repayment must be at least the discounted principal target",
        variant: "destructive",
      })
      return
    }

    const minTicketNum = Number.parseFloat(minTicket)
    if (isNaN(minTicketNum) || minTicketNum <= 0) {
      toast({
        title: "Invalid minimum ticket",
        description: "Please enter a valid minimum investment amount",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Mock submission
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setShowSuccess(true)
      toast({
        title: "Submission received",
        description: "Your bond offering will be reviewed by our team",
      })
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setCompanyName("")
    setContactEmail("")
    setPrincipalTarget("")
    setFormat("CLASSIC")
    setMaturityDate("")
    setTotalRepayment("")
    setCouponRate("")
    setCouponFrequency("ANNUAL")
    setBondSymbol("")
    setMinTicket("")
    setHardCap("")
    setKycRequired(false)
    setTermsUrl("")
    setDisclosureAccepted(false)
    setShowSuccess(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!showSuccess ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-3xl mx-auto"
            >
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Corporate Bond Issuance</h1>
                <p className="text-muted-foreground">Submit your bond offering for review and tokenization on XRPL</p>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Issuer Information</CardTitle>
                      <CardDescription>Provide details about your company and bond offering</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Company Details */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Company Details</h3>

                      <div className="space-y-2">
                        <Label htmlFor="company-name">Company Name *</Label>
                        <Input
                          id="company-name"
                          placeholder="Enter your company name"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contact-email">Contact Email *</Label>
                        <Input
                          id="contact-email"
                          type="email"
                          placeholder="email@company.com"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Bond Structure */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Bond Structure</h3>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="format">Bond Format *</Label>
                          <Select value={format} onValueChange={(value) => setFormat(value as BondFormat)}>
                            <SelectTrigger id="format">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CLASSIC">Classic (with coupons)</SelectItem>
                              <SelectItem value="ZERO_COUPON">Zero-coupon</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="currency">Currency to Raise *</Label>
                          <div className="flex items-center h-10 px-3 py-2 rounded-md border border-input bg-muted text-sm">
                            <span className="font-medium">USDC (stablecoin)</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="principal-target">Liquidity Needed (Principal Target) *</Label>
                        <Input
                          id="principal-target"
                          type="number"
                          placeholder="1000000"
                          value={principalTarget}
                          onChange={(e) => setPrincipalTarget(e.target.value)}
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maturity-date">Maturity Date *</Label>
                        <Input
                          id="maturity-date"
                          type="date"
                          value={maturityDate}
                          onChange={(e) => setMaturityDate(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="total-repayment">Total Repayment at Maturity *</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs text-sm">
                                  Must be at least the discounted principal target using a 5% annual discount rate. This
                                  ensures the bond offers a reasonable return.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Input
                          id="total-repayment"
                          type="number"
                          placeholder="1180000"
                          value={totalRepayment}
                          onChange={(e) => setTotalRepayment(e.target.value)}
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>

                      {format === "CLASSIC" && (
                        <>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="coupon-rate">Coupon Rate (%) *</Label>
                              <Input
                                id="coupon-rate"
                                type="number"
                                placeholder="5.5"
                                value={couponRate}
                                onChange={(e) => setCouponRate(e.target.value)}
                                min="0"
                                max="100"
                                step="0.01"
                                required={format === "CLASSIC"}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="coupon-frequency">Coupon Frequency *</Label>
                              <Select
                                value={couponFrequency}
                                onValueChange={(value) => setCouponFrequency(value as CouponFrequency)}
                              >
                                <SelectTrigger id="coupon-frequency">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ANNUAL">Annual</SelectItem>
                                  <SelectItem value="SEMIANNUAL">Semiannual</SelectItem>
                                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Bond Details */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Bond Details</h3>

                      <div className="space-y-2">
                        <Label htmlFor="bond-symbol">Bond Symbol/Code *</Label>
                        <Input
                          id="bond-symbol"
                          placeholder="BOND-COMPANY-2027"
                          value={bondSymbol}
                          onChange={(e) => setBondSymbol(e.target.value)}
                          required
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="min-ticket">Minimum Ticket *</Label>
                          <Input
                            id="min-ticket"
                            type="number"
                            placeholder="1000"
                            value={minTicket}
                            onChange={(e) => setMinTicket(e.target.value)}
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="hard-cap">Hard Cap (Optional)</Label>
                          <Input
                            id="hard-cap"
                            type="number"
                            placeholder="Leave empty for no cap"
                            value={hardCap}
                            onChange={(e) => setHardCap(e.target.value)}
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="kyc-required"
                          checked={kycRequired}
                          onCheckedChange={(checked) => setKycRequired(checked as boolean)}
                        />
                        <Label htmlFor="kyc-required" className="cursor-pointer">
                          KYC Required for Investors
                        </Label>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="terms-url">Terms & Conditions URL (Optional)</Label>
                        <Input
                          id="terms-url"
                          type="url"
                          placeholder="https://company.com/bond-terms"
                          value={termsUrl}
                          onChange={(e) => setTermsUrl(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Disclosure */}
                    <div className="space-y-4">
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:bg-amber-950/20 dark:border-amber-800">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                          <div className="space-y-2">
                            <p className="font-medium text-sm text-amber-900 dark:text-amber-200">
                              Important Disclosure
                            </p>
                            <p className="text-xs text-amber-800 dark:text-amber-300">
                              By submitting this form, you acknowledge that:
                            </p>
                            <ul className="text-xs text-amber-800 dark:text-amber-300 list-disc list-inside space-y-1 ml-2">
                              <li>All information provided is accurate and complete</li>
                              <li>Your company has legal authority to issue bonds</li>
                              <li>You understand this is a testnet application</li>
                              <li>Manual review is required before listing</li>
                              <li>The platform owners may reject submissions at their discretion</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="disclosure"
                          checked={disclosureAccepted}
                          onCheckedChange={(checked) => setDisclosureAccepted(checked as boolean)}
                        />
                        <Label htmlFor="disclosure" className="cursor-pointer">
                          I accept the disclosure and confirm all information is accurate *
                        </Label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Reset Form
                      </Button>
                      <Button type="submit" disabled={isSubmitting || !disclosureAccepted}>
                        {isSubmitting ? "Submitting..." : "Submit for Review"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto"
            >
              <Card>
                <CardContent className="p-8">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                      <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold">Submission Received!</h2>
                      <p className="text-muted-foreground">Thank you for your bond offering submission</p>
                    </div>

                    <div className="w-full rounded-lg bg-muted p-4 space-y-3 text-left">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">Status: Pending Review</p>
                        <p className="text-xs text-muted-foreground">
                          Your bond offering is now under review by our team.
                        </p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Company</span>
                          <span className="font-medium">{companyName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bond Symbol</span>
                          <span className="font-medium">{bondSymbol}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Target</span>
                          <span className="font-medium">
                            {formatCurrency(Number.parseFloat(principalTarget), currency)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Format</span>
                          <span className="font-medium">{format === "CLASSIC" ? "Classic" : "Zero-coupon"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full rounded-lg border border-border bg-card p-4 text-left">
                      <p className="text-sm font-medium mb-2">What happens next?</p>
                      <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>Our team will review your submission</li>
                        <li>We'll contact you at {contactEmail}</li>
                        <li>Once approved, your bond will be listed</li>
                        <li>You'll receive instructions for token issuance</li>
                      </ol>
                    </div>

                    <Button onClick={resetForm} className="w-full">
                      Submit Another Bond
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
