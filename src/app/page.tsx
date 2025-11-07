"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Leaderboard } from "@/components/leaderboard"
import { BondDetailModal } from "@/components/bonds"
import { useWalletStore } from "@/lib/store"
import { connectGemWallet } from "@/lib/wallet"
import { MOCK_BONDS } from "@/lib/bonds"
import { useToast } from "@/hooks/use-toast"
import type { Bond } from "@/lib/bonds"
import Link from "next/link"
import { TrendingUp, Shield, Globe } from "lucide-react"

export default function HomePage() {
  const { isConnected, setWallet } = useWalletStore()
  const { toast } = useToast()
  const [isConnecting, setIsConnecting] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [selectedBond, setSelectedBond] = useState<Bond | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const closedBonds = MOCK_BONDS.filter((bond) => bond.status === "CLOSED" || bond.raised >= bond.principalTarget)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowLeaderboard(true)
        }
      },
      { threshold: 0.1 },
    )

    const leaderboardSection = document.getElementById("leaderboard-section")
    if (leaderboardSection) {
      observer.observe(leaderboardSection)
    }

    return () => observer.disconnect()
  }, [])

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      const address = await connectGemWallet()
      setWallet(address)
      toast({
        title: "Wallet connected",
        description: "Ready to invest in tokenized bonds",
      })
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Connection failed",
          description: error.message,
          variant: "destructive",
        })
      }
    } finally {
      setIsConnecting(false)
    }
  }

  const handleBondClick = (bond: Bond) => {
    setSelectedBond(bond)
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center space-y-6"
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
              Tokenized Corporate Bonds on <span className="text-primary">XRPL</span>
            </h1>
            <p className="text-xl text-muted-foreground text-pretty">
              Invest in high-quality corporate bonds tokenized on the XRP Ledger. Transparent, accessible, and secure.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              {!isConnected ? (
                <Button size="lg" onClick={handleConnect} disabled={isConnecting}>
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild>
                    <Link href="/invest">Invest</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/marketplace">Go to Marketplace</Link>
                  </Button>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex flex-col items-center gap-3 p-6 rounded-lg bg-card border"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">XRPL Powered</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Built on the XRP Ledger for fast, secure transactions
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex flex-col items-center gap-3 p-6 rounded-lg bg-card border"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Fixed Returns</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Predictable yields with classic and zero-coupon bonds
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex flex-col items-center gap-3 p-6 rounded-lg bg-card border"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Transparent</h3>
                <p className="text-sm text-muted-foreground text-center">
                  All transactions on-chain with full visibility
                </p>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Leaderboard Section */}
        <section id="leaderboard-section" className="container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0 }}
            animate={showLeaderboard ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Available Bonds</h2>
              <p className="text-muted-foreground">Browse fully funded corporate bonds from verified issuers</p>
            </div>

            <Leaderboard bonds={closedBonds} viewOnly showInvestButton={false} onBondClick={handleBondClick} />
          </motion.div>
        </section>
      </main>

      <BondDetailModal bond={selectedBond} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
