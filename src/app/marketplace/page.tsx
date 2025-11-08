"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { OfferCard } from "@/components/marketplace"
import { OfferDetail } from "@/components/marketplace"
import { TokenDrawer } from "@/components/marketplace"
import { BuyOfferModal } from "@/components/marketplace"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWallet } from "@/context/WalletContext"
import { MOCK_OFFERS } from "@/lib/bonds"
import type { Offer, OfferToken } from "@/lib/bonds"
import { Plus } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

type MarketplaceSortOption = "newest" | "highest-value" | "soonest-expiry"

export default function MarketplacePage() {
  const { isConnected } = useWallet()
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
  const [selectedToken, setSelectedToken] = useState<OfferToken | null>(null)
  const [isTokenDrawerOpen, setIsTokenDrawerOpen] = useState(false)
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false)
  const [sortBy, setSortBy] = useState<MarketplaceSortOption>("newest")

  const handleTokenClick = (token: OfferToken) => {
    setSelectedToken(token)
    setIsTokenDrawerOpen(true)
  }

  const handleBuyOffer = () => {
    setIsBuyModalOpen(true)
  }

  const sortedOffers = [...MOCK_OFFERS].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdISO).getTime() - new Date(a.createdISO).getTime()
      case "highest-value":
        return b.summaryValue - a.summaryValue
      case "soonest-expiry":
        return new Date(a.expiryISO).getTime() - new Date(b.expiryISO).getTime()
      default:
        return 0
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Secondary Marketplace</h1>
          <p className="text-muted-foreground">
            {!isConnected
              ? "Connect your wallet to buy and sell bond tokens"
              : "Buy and sell tokenized bonds from other investors"}
          </p>
        </div>

        {!isConnected && (
          <div className="mb-8 p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
            <p className="text-sm text-amber-900 dark:text-amber-200">
              Please connect your GemWallet to access marketplace features
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as MarketplaceSortOption)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="highest-value">Highest Value</SelectItem>
              <SelectItem value="soonest-expiry">Soonest Expiry</SelectItem>
            </SelectContent>
          </Select>

          {isConnected && (
            <Button asChild>
              <Link href="/marketplace/create">
                <Plus className="mr-2 h-4 w-4" />
                Create an Offer
              </Link>
            </Button>
          )}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {sortedOffers.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg">
                <p className="text-muted-foreground">No offers available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedOffers.map((offer, index) => (
                  <OfferCard key={offer.id} offer={offer} index={index} onClick={() => setSelectedOffer(offer)} />
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              {selectedOffer ? (
                <motion.div
                  key={selectedOffer.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="sticky top-24"
                >
                  <OfferDetail offer={selectedOffer} onTokenClick={handleTokenClick} onBuy={handleBuyOffer} />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="sticky top-24"
                >
                  <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
                    <p className="text-sm">Click on an offer to view details</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <TokenDrawer token={selectedToken} isOpen={isTokenDrawerOpen} onClose={() => setIsTokenDrawerOpen(false)} />

      <BuyOfferModal offer={selectedOffer} isOpen={isBuyModalOpen} onClose={() => setIsBuyModalOpen(false)} />
    </div>
  )
}
