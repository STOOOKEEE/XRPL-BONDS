"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useWalletStore } from "@/lib/store"
import { connectGemWallet, formatAddress } from "@/lib/wallet"
import { useToast } from "@/hooks/use-toast"
import { Wallet, Copy, LogOut } from "lucide-react"

export function WalletButton() {
  const { address, isConnected, setWallet, disconnect } = useWalletStore()
  const { toast } = useToast()
  const [isConnecting, setIsConnecting] = useState(false)
  const [showUnsupportedDialog, setShowUnsupportedDialog] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      const walletAddress = await connectGemWallet()
      setWallet(walletAddress)
      toast({
        title: "Wallet connected",
        description: `Connected to ${formatAddress(walletAddress)}`,
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("not installed")) {
          setShowUnsupportedDialog(true)
        } else {
          toast({
            title: "Connection failed",
            description: error.message,
            variant: "destructive",
          })
        }
      }
    } finally {
      setIsConnecting(false)
    }
  }

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast({
        title: "Address copied",
        description: "Wallet address copied to clipboard",
      })
    }
  }

  const handleDisconnect = () => {
    disconnect()
    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected",
    })
  }

  if (!isConnected || !address) {
    return (
      <>
        <Button onClick={handleConnect} disabled={isConnecting}>
          <Wallet className="mr-2 h-4 w-4" />
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>

        <Dialog open={showUnsupportedDialog} onOpenChange={setShowUnsupportedDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>GemWallet Required</DialogTitle>
              <DialogDescription className="space-y-4">
                <p>This platform requires GemWallet to interact with XRPL testnet.</p>
                <p>Please install the GemWallet browser extension and ensure you're connected to the XRPL Testnet.</p>
              </DialogDescription>
            </DialogHeader>
            <Button asChild>
              <a href="https://gemwallet.app" target="_blank" rel="noopener noreferrer">
                Get GemWallet
              </a>
            </Button>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Wallet className="mr-2 h-4 w-4" />
          {formatAddress(address)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopyAddress}>
          <Copy className="mr-2 h-4 w-4" />
          Copy address
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDisconnect}>
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
