"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Leaderboard } from "@/components/leaderboard"
import { BondDetailModal } from "@/components/bonds"
import { useWallet } from "@/context/WalletContext"
import { MOCK_BONDS } from "@/lib/bonds"
import type { Bond } from "@/lib/bonds"

function InvestPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const bondId = searchParams.get("bond")
  const { isConnected } = useWallet()
  const [selectedBond, setSelectedBond] = useState<Bond | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (!isConnected) {
      router.push("/")
    }
  }, [isConnected, router])

  useEffect(() => {
    if (bondId && isConnected) {
      const bond = MOCK_BONDS.find((b) => b.id === bondId)
      if (bond) {
        setSelectedBond(bond)
        setIsModalOpen(true)
      }
    }
  }, [bondId, isConnected])

  const openBonds = MOCK_BONDS.filter((bond) => bond.status === "OPEN" && bond.raised < bond.principalTarget)

  const handleBondClick = (bond: Bond) => {
    setSelectedBond(bond)
    setIsModalOpen(true)
  }

  const handleOpenModal = (bond: Bond) => {
    setSelectedBond(bond)
    setIsModalOpen(true)
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center space-y-6">
            <h1 className="text-3xl font-bold">Connect Your Wallet</h1>
            <p className="text-muted-foreground">
              Please connect your wallet using the button in the header to access investment opportunities
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Investment Opportunities</h1>
          <p className="text-muted-foreground">Select a bond to review details and invest</p>
        </div>

        <Leaderboard bonds={openBonds} onBondClick={handleBondClick} showInvestButton={false} />
      </main>

      <BondDetailModal bond={selectedBond} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}

export default function InvestPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InvestPageContent />
    </Suspense>
  )
}
