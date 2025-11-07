// ============================================================================
// TYPES
// ============================================================================

export type Bond = {
  id: string
  issuerName: string
  symbol: string
  currency: "XRP" | "USD"
  format: "CLASSIC" | "ZERO_COUPON"
  principalTarget: number
  raised: number
  maturityISO: string
  totalRepayment: number
  couponRate?: number
  couponFrequency?: "ANNUAL" | "SEMIANNUAL" | "QUARTERLY"
  apyDisplay?: number
  roiDisplay?: number
  minTicket: number
  status: "OPEN" | "CLOSED" | "PENDING"
  kycRequired: boolean
}

export type OfferToken = {
  tokenId: string
  bondId: string
  quantity: number
  unitPrice: number
  currency: "XRP" | "USD"
  metadata: {
    couponsCollectedValue: number
    couponsRemainingValue: number
    totalAssumingAllPaid: number
    lastCouponISO?: string
    nextCouponISO?: string
  }
}

export type Offer = {
  id: string
  sellerDisplay: string
  createdISO: string
  expiryISO: string
  tokens: OfferToken[]
  status: "ACTIVE" | "FILLED" | "CANCELLED" | "EXPIRED"
  summaryValue: number
}

export type SortOption = "size-asc" | "size-desc" | "maturity-asc" | "maturity-desc" | "roi-asc" | "roi-desc"

export type FilterOptions = {
  format?: "CLASSIC" | "ZERO_COUPON"
  currency?: "XRP" | "USD"
  status?: "OPEN" | "CLOSED"
  kycRequired?: boolean
}

// ============================================================================
// CALCULATIONS
// ============================================================================

export function calculateAPY(fv: number, pv: number, years: number): number {
  return Math.pow(fv / pv, 1 / years) - 1
}

export function calculateROI(fv: number, pv: number): number {
  return (fv - pv) / pv
}

export function getYearsToMaturity(maturityISO: string): number {
  const maturityDate = new Date(maturityISO)
  const now = new Date()
  const diffTime = maturityDate.getTime() - now.getTime()
  return diffTime / (1000 * 60 * 60 * 24 * 365.25)
}

export function validateTotalRepayment(
  principalTarget: number,
  totalRepayment: number,
  maturityISO: string,
  discountRate = 0.05,
): boolean {
  const years = getYearsToMaturity(maturityISO)
  const discountedPrincipal = principalTarget / Math.pow(1 + discountRate, years)
  return totalRepayment >= discountedPrincipal
}

export function formatCurrency(amount: number, currency: "XRP" | "USD"): string {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }
  return `${amount.toLocaleString("en-US")} XRP`
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(2)}%`
}

export function getBondProgress(bond: Bond): number {
  return (bond.raised / bond.principalTarget) * 100
}

// ============================================================================
// MOCK DATA
// ============================================================================

export const MOCK_BONDS: Bond[] = [
  {
    id: "acme-27",
    issuerName: "ACME Corp",
    symbol: "BOND-ACME-2027",
    currency: "USD",
    format: "ZERO_COUPON",
    principalTarget: 1000000,
    raised: 420000,
    maturityISO: "2027-12-31",
    totalRepayment: 1180000,
    apyDisplay: 0.055,
    roiDisplay: 0.18,
    minTicket: 1000,
    status: "OPEN",
    kycRequired: true,
  },
  {
    id: "globex-30",
    issuerName: "Globex Industries",
    symbol: "BOND-GLOBEX-2030",
    currency: "XRP",
    format: "CLASSIC",
    principalTarget: 2500000,
    raised: 2100000,
    maturityISO: "2030-06-30",
    totalRepayment: 2500000,
    couponRate: 0.07,
    couponFrequency: "SEMIANNUAL",
    apyDisplay: 0.07,
    roiDisplay: 0.0,
    minTicket: 500,
    status: "OPEN",
    kycRequired: false,
  },
  {
    id: "initech-26",
    issuerName: "Initech",
    symbol: "BOND-INIT-2026",
    currency: "USD",
    format: "CLASSIC",
    principalTarget: 600000,
    raised: 600000,
    maturityISO: "2026-09-30",
    totalRepayment: 600000,
    couponRate: 0.05,
    couponFrequency: "ANNUAL",
    apyDisplay: 0.05,
    roiDisplay: 0.0,
    minTicket: 100,
    status: "CLOSED",
    kycRequired: false,
  },
  {
    id: "umbrella-29",
    issuerName: "Umbrella PLC",
    symbol: "BOND-UMBR-2029",
    currency: "XRP",
    format: "ZERO_COUPON",
    principalTarget: 1500000,
    raised: 980000,
    maturityISO: "2029-03-31",
    totalRepayment: 1900000,
    apyDisplay: 0.061,
    roiDisplay: 0.27,
    minTicket: 2500,
    status: "OPEN",
    kycRequired: true,
  },
  {
    id: "wayne-28",
    issuerName: "Wayne Enterprises",
    symbol: "BOND-WAYNE-2028",
    currency: "USD",
    format: "CLASSIC",
    principalTarget: 900000,
    raised: 350000,
    maturityISO: "2028-11-15",
    totalRepayment: 900000,
    couponRate: 0.0625,
    couponFrequency: "QUARTERLY",
    apyDisplay: 0.0625,
    roiDisplay: 0.0,
    minTicket: 1000,
    status: "OPEN",
    kycRequired: false,
  },
]

export const MOCK_OFFERS: Offer[] = [
  {
    id: "offer-101",
    sellerDisplay: "Desk Alpha",
    createdISO: "2025-11-07T10:00:00Z",
    expiryISO: "2025-12-15T17:00:00Z",
    status: "ACTIVE",
    tokens: [
      {
        tokenId: "BOND.ACME27:0001",
        bondId: "acme-27",
        quantity: 200,
        unitPrice: 920,
        currency: "USD",
        metadata: {
          couponsCollectedValue: 0,
          couponsRemainingValue: 16000,
          totalAssumingAllPaid: 184000,
        },
      },
      {
        tokenId: "BOND.UMBR29:0042",
        bondId: "umbrella-29",
        quantity: 100,
        unitPrice: 780,
        currency: "XRP",
        metadata: {
          couponsCollectedValue: 0,
          couponsRemainingValue: 11000,
          totalAssumingAllPaid: 188000,
        },
      },
    ],
    summaryValue: 200 * 920 + 100 * 780,
  },
  {
    id: "offer-202",
    sellerDisplay: "Liquidity Hub",
    createdISO: "2025-11-07T10:30:00Z",
    expiryISO: "2026-01-31T12:00:00Z",
    status: "ACTIVE",
    tokens: [
      {
        tokenId: "BOND.GLOBEX30:0199",
        bondId: "globex-30",
        quantity: 50,
        unitPrice: 1015,
        currency: "XRP",
        metadata: {
          couponsCollectedValue: 3500,
          couponsRemainingValue: 17000,
          totalAssumingAllPaid: 21500,
          lastCouponISO: "2025-06-30",
          nextCouponISO: "2025-12-31",
        },
      },
      {
        tokenId: "BOND.WAYNE28:0337",
        bondId: "wayne-28",
        quantity: 75,
        unitPrice: 990,
        currency: "USD",
        metadata: {
          couponsCollectedValue: 2812.5,
          couponsRemainingValue: 13125,
          totalAssumingAllPaid: 15937.5,
          lastCouponISO: "2025-10-15",
          nextCouponISO: "2026-01-15",
        },
      },
    ],
    summaryValue: 50 * 1015 + 75 * 990,
  },
]
