"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
type Currency = "XRP" | "RLUSD"

export default function CorpoPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Helper functions for date calculations
  const getDefaultStartDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date.toISOString().split('T')[0]
  }

  const getDefaultEndDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    date.setFullYear(date.getFullYear() + 1)
    return date.toISOString().split('T')[0]
  }

  const normalizeDateToValidDay = (dateStr: string): string => {
    const date = new Date(dateStr)
    let day = date.getDate()
    
    // Force day between 1 and 28
    if (day > 28) {
      day = 28
    } else if (day < 1) {
      day = 1
    }
    
    date.setDate(day)
    return date.toISOString().split('T')[0]
  }

  // Generate a unique bond code
  const generateBondCode = (): string => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `BOND-${timestamp}-${random}`
  }

  // Generate a unique token name (3 uppercase letters + 3 digits)
  const generateTokenName = (): string => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const randomLetters = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join('')
    const randomDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${randomLetters}${randomDigits}`
  }

  // Generate a unique token ID (hexadecimal format)
  const generateTokenId = (): string => {
    const timestamp = Date.now().toString(16).toUpperCase()
    const random = Math.floor(Math.random() * 0xFFFFFFFF).toString(16).toUpperCase().padStart(8, '0')
    return `${timestamp}${random}`
  }

  const addMonths = (dateStr: string, months: number): string => {
    const date = new Date(dateStr)
    const currentDay = date.getDate()
    const targetMonth = date.getMonth() + months
    const targetYear = date.getFullYear() + Math.floor(targetMonth / 12)
    const finalMonth = targetMonth % 12
    
    date.setFullYear(targetYear)
    date.setMonth(finalMonth)
    
    // Keep the same day of month, but ensure it's between 1-28
    const targetDay = Math.min(currentDay, 28)
    const lastDayOfMonth = new Date(targetYear, finalMonth + 1, 0).getDate()
    date.setDate(Math.min(targetDay, lastDayOfMonth))
    
    return date.toISOString().split('T')[0]
  }

  const getMonthsDifference = (startStr: string, endStr: string): number => {
    const start = new Date(startStr)
    const end = new Date(endStr)
    
    const yearsDiff = end.getFullYear() - start.getFullYear()
    const monthsDiff = end.getMonth() - start.getMonth()
    const daysDiff = end.getDate() - start.getDate()
    
    let totalMonths = yearsDiff * 12 + monthsDiff
    
    // If end day is before start day, we subtract a month (rounding down)
    if (daysDiff < 0) {
      totalMonths--
    }
    
    return Math.max(1, totalMonths) // Minimum 1 month
  }

  const getFundingPeriodDays = (): number => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const diffTime = start.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getFundingPeriodText = (): string => {
    const days = getFundingPeriodDays()
    if (days === 0) return "today"
    if (days === 1) return "1 day"
    if (days === 7) return "1 week"
    if (days === 14) return "2 weeks"
    if (days % 7 === 0) return `${days / 7} weeks`
    return `${days} days`
  }

  // Form state
  const [companyName, setCompanyName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [issuerAddress, setIssuerAddress] = useState("")
  const [walletType, setWalletType] = useState<"GemWallet" | "Crossmark" | "Xaman">("Xaman")
  const [principalTarget, setPrincipalTarget] = useState("")
  const [format, setFormat] = useState<BondFormat>("CLASSIC")
  const [currency] = useState<Currency>("RLUSD")
  const [startDate, setStartDate] = useState(getDefaultStartDate())
  const [endDate, setEndDate] = useState(getDefaultEndDate())
  const [durationYears, setDurationYears] = useState(1)
  const [lastModified, setLastModified] = useState<'start' | 'end' | 'duration'>('duration')
  const [totalRepayment, setTotalRepayment] = useState("")
  const [couponRate, setCouponRate] = useState("5.5")
  const [couponFrequencyMonths, setCouponFrequencyMonths] = useState(12)

  // Calculate total repayment for classic bonds
  const calculateTotalRepayment = (): number => {
    if (format !== "CLASSIC") return 0
    
    const principal = Number.parseFloat(principalTarget) || 0
    const rate = Number.parseFloat(couponRate) || 0
    
    if (principal === 0 || rate === 0) return principal
    
    // Calculate number of coupon payments (duration in years * 12 months / frequency)
    const durationMonths = durationYears * 12
    const numberOfPayments = Math.floor(durationMonths / couponFrequencyMonths)
    
    // Calculate total coupon payments
    const couponAmount = (principal * rate / 100) * (couponFrequencyMonths / 12)
    const totalCoupons = couponAmount * numberOfPayments
    
    // Total repayment = principal + all coupons
    return principal + totalCoupons
  }

  const getCalculatedTotalRepayment = (): string => {
    if (format === "CLASSIC") {
      return calculateTotalRepayment().toFixed(2)
    }
    return totalRepayment
  }
  const [bondSymbol] = useState(() => generateBondCode())
  const [tokenName] = useState(() => generateTokenName())
  const [tokenId] = useState(() => generateTokenId())
  const [minTicket, setMinTicket] = useState("")
  const [kycRequired, setKycRequired] = useState(false)
  const [disclosureAccepted, setDisclosureAccepted] = useState(false)

  // Update the third parameter when two are modified
  const handleStartDateChange = (newStart: string) => {
    // Check if date is not in the past (PST timezone)
    const todayPST = getTodayPST()
    const selectedDate = new Date(newStart)
    selectedDate.setHours(0, 0, 0, 0)
    
    if (selectedDate < todayPST) {
      // If date is in the past, show warning and use today
      toast({
        title: "Invalid date",
        description: "Start date cannot be in the past (PST timezone). Using today's date instead.",
        variant: "destructive",
      })
      newStart = todayPST.toISOString().split('T')[0]
    }
    
    // Normalize to ensure day is between 1-28
    const normalizedStart = normalizeDateToValidDay(newStart)
    const newStartDay = new Date(normalizedStart).getDate()
    setStartDate(normalizedStart)
    setLastModified('start')
    
    // Always align the end date's day with the start date's day
    const currentEnd = new Date(endDate)
    const lastDayOfEndMonth = new Date(currentEnd.getFullYear(), currentEnd.getMonth() + 1, 0).getDate()
    currentEnd.setDate(Math.min(newStartDay, lastDayOfEndMonth, 28))
    const alignedEnd = currentEnd.toISOString().split('T')[0]
    setEndDate(alignedEnd)
    
    // Recalculate duration in years with the new aligned dates
    const months = getMonthsDifference(normalizedStart, alignedEnd)
    const years = Math.round(months / 12)
    setDurationYears(Math.max(1, years))
  }

  const handleEndDateChange = (newEnd: string) => {
    // Check if date is not in the past (PST timezone)
    const todayInPST = getTodayPST()
    const selectedDate = new Date(newEnd)
    selectedDate.setHours(0, 0, 0, 0)
    
    if (selectedDate < todayInPST) {
      // If date is in the past, show warning and use today
      toast({
        title: "Invalid date",
        description: "End date cannot be in the past (PST timezone). Using today's date instead.",
        variant: "destructive",
      })
      newEnd = todayInPST.toISOString().split('T')[0]
    }
    
    // Normalize to ensure day is between 1-28
    const normalizedEnd = normalizeDateToValidDay(newEnd)
    const newEndDay = new Date(normalizedEnd).getDate()
    setEndDate(normalizedEnd)
    setLastModified('end')
    
    // Align the start date's day with the end date's day
    const currentStart = new Date(startDate)
    const lastDayOfStartMonth = new Date(currentStart.getFullYear(), currentStart.getMonth() + 1, 0).getDate()
    currentStart.setDate(Math.min(newEndDay, lastDayOfStartMonth, 28))
    let alignedStart = currentStart.toISOString().split('T')[0]
    
    // Ensure start date is not in the past (PST timezone)
    const todayForValidation = getTodayPST()
    const alignedStartDate = new Date(alignedStart)
    alignedStartDate.setHours(0, 0, 0, 0)
    if (alignedStartDate < todayForValidation) {
      // If aligned start is in the past, use today instead
      alignedStart = todayForValidation.toISOString().split('T')[0]
      toast({
        title: "Start date adjusted",
        description: "Start date cannot be in the past (PST timezone). It has been set to today.",
        variant: "default",
      })
    }
    
    setStartDate(alignedStart)
    
    // Recalculate duration in years with the new aligned dates
    const months = getMonthsDifference(alignedStart, normalizedEnd)
    const years = Math.round(months / 12)
    setDurationYears(Math.max(1, years))
  }

  const handleDurationChange = (newYears: number) => {
    // Allow 0 or empty temporarily for easier input
    setDurationYears(newYears)
    setLastModified('duration')
    
    // Only update end date if duration is valid
    if (newYears >= 1) {
      const monthsToAdd = newYears * 12
      const newEnd = addMonths(startDate, monthsToAdd)
      setEndDate(newEnd)
    }
  }

  // Get current date in PST timezone
  const getTodayPST = (): Date => {
    const now = new Date()
    // Convert to PST (UTC-8) - PST is always UTC-8 (not PDT which is UTC-7)
    const pstOffset = -8 * 60 // PST is UTC-8
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000)
    const pstTime = new Date(utcTime + (pstOffset * 60000))
    pstTime.setHours(0, 0, 0, 0)
    return pstTime
  }

  // Auto-correct start date if it's in the past (based on PST timezone)
  useEffect(() => {
    const todayPST = getTodayPST()
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    
    if (start < todayPST) {
      // Start date is in the past, correct it to today (PST)
      const correctedStart = todayPST.toISOString().split('T')[0]
      const startDay = todayPST.getDate()
      
      // Adjust end date to match the same day of month
      const currentEnd = new Date(endDate)
      const lastDayOfEndMonth = new Date(currentEnd.getFullYear(), currentEnd.getMonth() + 1, 0).getDate()
      currentEnd.setDate(Math.min(startDay, lastDayOfEndMonth, 28))
      const correctedEnd = currentEnd.toISOString().split('T')[0]
      
      setStartDate(correctedStart)
      setEndDate(correctedEnd)
      
      // Recalculate duration in years
      const months = getMonthsDifference(correctedStart, correctedEnd)
      const years = Math.round(months / 12)
      setDurationYears(Math.max(1, years))
    }
  }, [startDate, endDate, durationYears])

  // Set coupon frequency to 0 (None) when format is Zero-Coupon
  useEffect(() => {
    if (format === "ZERO_COUPON") {
      setCouponFrequencyMonths(0)
    } else if (format === "CLASSIC" && couponFrequencyMonths === 0) {
      // Reset to default annual if switching back to classic
      setCouponFrequencyMonths(12)
    }
  }, [format, couponFrequencyMonths])

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

    // Validate XRPL address format
    if (!issuerAddress || !issuerAddress.match(/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/)) {
      toast({
        title: "Invalid XRPL address",
        description: "Please enter a valid XRPL address (starts with 'r' and 25-35 characters)",
        variant: "destructive",
      })
      return
    }

    const principal = Number.parseFloat(principalTarget)
    const repayment = format === "CLASSIC" ? calculateTotalRepayment() : Number.parseFloat(totalRepayment)
    const endDateISO = `${endDate}T00:00:00.000Z`

    if (isNaN(principal) || principal <= 0) {
      toast({
        title: "Invalid principal target",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    if (format === "CLASSIC") {
      const rate = Number.parseFloat(couponRate)
      if (isNaN(rate) || rate <= 0) {
        toast({
          title: "Invalid coupon rate",
          description: "Please enter a valid coupon rate",
          variant: "destructive",
        })
        return
      }
    }

    const todayPST = getTodayPST()

    if (new Date(startDate) < todayPST) {
      toast({
        title: "Invalid start date",
        description: "Start date cannot be in the past (PST timezone)",
        variant: "destructive",
      })
      return
    }

    if (new Date(endDate) <= todayPST) {
      toast({
        title: "Invalid end date",
        description: "Bond end date must be in the future (PST timezone)",
        variant: "destructive",
      })
      return
    }

    if (new Date(startDate) >= new Date(endDate)) {
      toast({
        title: "Invalid dates",
        description: "Start date must be before end date",
        variant: "destructive",
      })
      return
    }

    if (!durationYears || durationYears < 1) {
      toast({
        title: "Invalid duration",
        description: "Bond duration must be at least 1 year. Please enter a valid duration.",
        variant: "destructive",
      })
      return
    }

    if (!validateTotalRepayment(principal, repayment, endDateISO)) {
      toast({
        title: "Invalid total repayment",
        description: "Total repayment must be at least the discounted principal target",
        variant: "destructive",
      })
      return
    }

    // Validate minimum ticket only if provided
    if (minTicket.trim() !== "") {
      const minTicketNum = Number.parseFloat(minTicket)
      if (isNaN(minTicketNum) || minTicketNum <= 0) {
        toast({
          title: "Invalid minimum ticket",
          description: "Please enter a valid minimum investment amount",
          variant: "destructive",
        })
        return
      }
    }

    setIsSubmitting(true)
    try {
      // Mock submission
      await new Promise((resolve) => setTimeout(resolve, 2000))
      
      // Send to backend API
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL
        const apiKey = process.env.NEXT_PUBLIC_API_KEY
        
        if (!apiUrl || !apiKey) {
          console.warn('⚠️ Backend API non configuré (variables d\'environnement manquantes)')
        } else {
          console.log('🔄 Envoi au backend:', `${apiUrl}/v1/bonds/submit`)
          
          const backendResponse = await fetch(`${apiUrl}/v1/bonds/submit`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            },
            body: JSON.stringify({
              issuerName: companyName,
              contactEmail: contactEmail,
              couponFrequency: couponFrequencyMonths,
              totalSupply: principalTarget,
              issuerAddress: issuerAddress,
              issueDate: startDate,
              maturityDate: endDate,
              durationYears: durationYears,
              couponRate: Number.parseFloat(couponRate) / 100, // Convert percentage to decimal (6.96% -> 0.0696)
              bondId: bondSymbol,
              tokenName: tokenName,
              tokenCurrency: tokenId,
              minimumTicket: minTicket || "0",
              walletType: walletType,
              bondFormat: format,
              currency: currency,
              totalRepayment: getCalculatedTotalRepayment(),
              kycRequired: kycRequired
            })
          })
          
          console.log('📡 Réponse backend status:', backendResponse.status)
          
          if (!backendResponse.ok) {
            const errorText = await backendResponse.text()
            console.error('❌ Erreur HTTP backend:', backendResponse.status, errorText)
          } else {
            const backendResult = await backendResponse.json()
            console.log('📦 Réponse backend:', backendResult)
            
            if (backendResult.ok) {
              console.log('✅ Bond créé dans MongoDB:', backendResult.bond)
            } else {
              console.error('❌ Backend a retourné ok:false:', backendResult)
            }
          }
        }
      } catch (backendError) {
        console.error('❌ Erreur appel backend:', backendError)
        console.error('Stack:', backendError instanceof Error ? backendError.stack : 'N/A')
        // Continue even if backend fails
      }
      
      // Send confirmation email
      try {
        console.log('📧 Envoi de l\'email de confirmation à:', contactEmail)
        
        const emailResponse = await fetch('/api/send-submission-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            companyName,
            contactEmail,
            issuerAddress,
            walletType,
            bondSymbol,
            tokenName,
            tokenId,
            principalTarget,
            currency,
            format,
            startDate,
            endDate,
            durationYears,
            couponRate,
            couponFrequencyMonths,
            totalRepayment: getCalculatedTotalRepayment(),
            minTicket,
            kycRequired,
          }),
        })
        
        console.log('📬 Réponse email status:', emailResponse.status)
        
        if (!emailResponse.ok) {
          const errorText = await emailResponse.text()
          console.error('❌ Erreur HTTP email:', emailResponse.status, errorText)
        } else {
          const emailResult = await emailResponse.json()
          console.log('✅ Email envoyé:', emailResult)
        }
      } catch (emailError) {
        console.error('❌ Erreur appel email:', emailError)
        console.error('Stack:', emailError instanceof Error ? emailError.stack : 'N/A')
        // Continue even if email fails
      }
      
      setShowSuccess(true)
      toast({
        title: "Submission received",
        description: "Your bond offering will be reviewed by our team. A confirmation email has been sent.",
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
    setIssuerAddress("")
    setWalletType("Xaman")
    setPrincipalTarget("")
    setFormat("CLASSIC")
    setStartDate(getDefaultStartDate())
    setEndDate(getDefaultEndDate())
    setDurationYears(1)
    setLastModified('duration')
    setTotalRepayment("")
    setCouponRate("5.5")
    setCouponFrequencyMonths(12)
    setMinTicket("")
    setKycRequired(false)
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

                      <div className="space-y-2">
                        <Label htmlFor="wallet-type">Wallet Type *</Label>
                        <Select value={walletType} onValueChange={(value) => setWalletType(value as "GemWallet" | "Crossmark" | "Xaman")}>
                          <SelectTrigger id="wallet-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GemWallet">GemWallet</SelectItem>
                            <SelectItem value="Crossmark">Crossmark</SelectItem>
                            <SelectItem value="Xaman">Xaman</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="issuer-address">Issuer XRPL Address *</Label>
                        <Input
                          id="issuer-address"
                          type="text"
                          placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                          value={issuerAddress}
                          onChange={(e) => setIssuerAddress(e.target.value)}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Your XRPL wallet address from {walletType}
                        </p>
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
                            <span className="font-medium">RLUSD</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            RLUSD is the native XRPL stablecoin
                          </p>
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

                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Label>Bond Timeline *</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs text-sm">
                                  Fill in any 2 of the 3 fields. The third will be calculated automatically.
                                  Duration must be in whole months. Days must be between 1 and 28 to ensure consistency across all months.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <span className="text-xs text-muted-foreground ml-auto">(PST timezone - midnight)</span>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="start-date">Start Date (earliest) *</Label>
                            <Input
                              id="start-date"
                              type="date"
                              value={startDate}
                              onChange={(e) => handleStartDateChange(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              required
                              className={lastModified === 'start' ? 'ring-2 ring-primary' : ''}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="end-date">End Date (latest) *</Label>
                            <Input
                              id="end-date"
                              type="date"
                              value={endDate}
                              onChange={(e) => handleEndDateChange(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              required
                              className={lastModified === 'end' ? 'ring-2 ring-primary' : ''}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="duration">Duration (years) *</Label>
                            <Input
                              id="duration"
                              type="number"
                              value={durationYears || ''}
                              onChange={(e) => handleDurationChange(Number.parseInt(e.target.value) || 0)}
                              min="0"
                              step="1"
                              className={lastModified === 'duration' ? 'ring-2 ring-primary' : ''}
                            />
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                          <p>
                            <strong>Funding Period:</strong> The bond must be fully funded within {getFundingPeriodText()} ({getFundingPeriodDays()} day{getFundingPeriodDays() !== 1 ? 's' : ''} from today)
                          </p>
                          <p className="mt-1">
                            <strong>Bond Period:</strong> {new Date(startDate).toLocaleDateString('fr-FR')} → {new Date(endDate).toLocaleDateString('fr-FR')}
                          </p>
                          <p className="mt-1">
                            <strong>Duration:</strong> {durationYears ? `${durationYears} year${durationYears !== 1 ? 's' : ''}` : 'Not set'}
                          </p>
                          <p className="mt-1 text-blue-600 dark:text-blue-400">
                            Payments on day {new Date(startDate).getDate()} of each period
                          </p>
                        </div>
                      </div>

                      {format === "ZERO_COUPON" && (
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
                      )}

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
                              <div className="flex items-center gap-2">
                                <Label htmlFor="coupon-frequency">Coupon Frequency *</Label>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-xs text-sm">
                                        Available frequencies adapt to the bond duration to ensure regular payments.
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <Select
                                value={couponFrequencyMonths.toString()}
                                onValueChange={(value) => setCouponFrequencyMonths(Number.parseInt(value))}
                              >
                                <SelectTrigger id="coupon-frequency">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">Monthly</SelectItem>
                                  <SelectItem value="3">Quarterly</SelectItem>
                                  <SelectItem value="6">Semi-Annual</SelectItem>
                                  <SelectItem value="12">Annual</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground bg-muted p-4 rounded-md space-y-2">
                            <p className="font-semibold text-sm text-foreground mb-3">Bond Payment Calculation</p>
                            <div className="grid gap-2">
                              <div className="flex justify-between">
                                <span>Principal (Initial Liquidity):</span>
                                <span className="font-medium">{Number.parseFloat(principalTarget || "0").toFixed(2)} RLUSD</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Coupon Rate:</span>
                                <span className="font-medium">{couponRate}% per year</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Number of Payments:</span>
                                <span className="font-medium">{Math.floor((durationYears * 12) / couponFrequencyMonths)} payments ({couponFrequencyMonths === 1 ? 'Monthly' : couponFrequencyMonths === 3 ? 'Quarterly' : couponFrequencyMonths === 6 ? 'Semi-Annual' : 'Annual'})</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Coupon per Payment:</span>
                                <span className="font-medium">
                                  {((Number.parseFloat(principalTarget || "0") * Number.parseFloat(couponRate || "0") / 100) * (couponFrequencyMonths / 12)).toFixed(2)} RLUSD
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Total Coupons:</span>
                                <span className="font-medium">
                                  {(((Number.parseFloat(principalTarget || "0") * Number.parseFloat(couponRate || "0") / 100) * (couponFrequencyMonths / 12)) * Math.floor((durationYears * 12) / couponFrequencyMonths)).toFixed(2)} RLUSD
                                </span>
                              </div>
                              <div className="h-px bg-border my-2"></div>
                              <div className="flex justify-between text-base">
                                <span className="font-semibold text-foreground">Total Repayment at Maturity:</span>
                                <span className="font-bold text-primary">{calculateTotalRepayment().toFixed(2)} RLUSD</span>
                              </div>
                              <p className="text-xs italic mt-2">
                                = Principal ({Number.parseFloat(principalTarget || "0").toFixed(2)}) + All Coupons ({(((Number.parseFloat(principalTarget || "0") * Number.parseFloat(couponRate || "0") / 100) * (couponFrequencyMonths / 12)) * Math.floor((durationYears * 12) / couponFrequencyMonths)).toFixed(2)})
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Bond Details */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Bond Details</h3>

                      <div className="space-y-2">
                        <Label htmlFor="bond-symbol">Bond Code</Label>
                        <Input
                          id="bond-symbol"
                          value={bondSymbol}
                          readOnly
                          className="bg-muted cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground">
                          Unique code automatically generated and verified by database
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="token-name">Token Name</Label>
                          <Input
                            id="token-name"
                            value={tokenName}
                            readOnly
                            className="bg-muted cursor-not-allowed"
                          />
                          <p className="text-xs text-muted-foreground">
                            Auto-generated, unique token name
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="token-id">Token ID</Label>
                          <Input
                            id="token-id"
                            value={tokenId}
                            readOnly
                            className="bg-muted cursor-not-allowed"
                          />
                          <p className="text-xs text-muted-foreground">
                            Unique identifier verified by database
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="min-ticket">Minimum Ticket (Optional)</Label>
                        <Input
                          id="min-ticket"
                          type="number"
                          placeholder="Leave empty for no minimum"
                          value={minTicket}
                          onChange={(e) => setMinTicket(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                        <p className="text-xs text-muted-foreground">
                          Once the pool reaches the principal target, it will automatically lock and funds will be sent to the issuer
                        </p>
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
