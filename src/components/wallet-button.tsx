"use client"

import { useState, useEffect } from "react"
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
import { useWallet } from "@/context/WalletContext"
import { useToast } from "@/hooks/use-toast"
import { Wallet, Copy, LogOut } from "lucide-react"
import { formatAddress } from "@/lib/wallet"
import { createWalletManager } from "@/lib/wallet-manager"

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  requiresApiKey?: boolean;
}

const WALLET_OPTIONS: WalletOption[] = [
  {
    id: 'xaman',
    name: 'Xaman',
    icon: '🔷',
    description: 'Mobile wallet with OAuth',
    requiresApiKey: true,
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: '🔗',
    description: 'Scan QR with any wallet',
    requiresApiKey: true,
  },
  {
    id: 'crossmark',
    name: 'Crossmark',
    icon: '✖️',
    description: 'Browser extension',
  },
  {
    id: 'gemwallet',
    name: 'GemWallet',
    icon: '💎',
    description: 'Browser extension',
  },
];

export function WalletButton() {
  const { walletManager, isConnected, accountInfo, setWalletManager, setIsConnected, setAccountInfo } = useWallet()
  const { toast } = useToast()
  const [isConnecting, setIsConnecting] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [availableWallets, setAvailableWallets] = useState<WalletOption[]>([])

  // Initialiser le WalletManager si non présent
  useEffect(() => {
    if (!walletManager) {
      const manager = createWalletManager();
      setWalletManager(manager);
      console.log('✅ WalletManager initialisé');
    }
  }, [walletManager, setWalletManager]);

  // Charger les wallets disponibles
  useEffect(() => {
    const loadAvailableWallets = async () => {
      if (!walletManager) return;

      // Pour xrpl-connect 0.3.0, on affiche tous les wallets configurés
      // Les adapters vérifient la disponibilité au moment de la connexion
      setAvailableWallets(WALLET_OPTIONS);
    };

    loadAvailableWallets();
  }, [walletManager]);

  const handleConnectWallet = async (walletId: string) => {
    if (!walletManager) {
      toast({
        title: "Erreur",
        description: "WalletManager non initialisé",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      console.log(`🔌 Tentative de connexion avec ${walletId}...`);
      
      let account: any = null;
      
      // Connexion directe selon le wallet choisi
      switch(walletId) {
        case 'gemwallet':
          console.log(`� Connexion GemWallet via @gemwallet/api...`);
          const { isInstalled, getAddress } = await import('@gemwallet/api');
          const installed = await isInstalled();
          if (!installed) {
            throw new Error('GemWallet n\'est pas installé. Installez l\'extension depuis https://gemwallet.app/');
          }
          const response = await getAddress();
          if (response.type === 'response' && response.result?.address) {
            account = {
              address: response.result.address,
              publicKey: (response.result as any).publicKey || '',
              network: 'testnet'
            };
          } else {
            throw new Error('Connexion GemWallet annulée ou échouée');
          }
          break;
          
        case 'crossmark':
          console.log(`� Connexion Crossmark...`);
          if (typeof window !== 'undefined' && (window as any).xrpl) {
            const crossmark = (window as any).xrpl;
            const result = await crossmark.signInAndWait();
            if (result?.response?.data?.address) {
              account = {
                address: result.response.data.address,
                publicKey: result.response.data.publicKey,
                network: 'testnet'
              };
            } else {
              throw new Error('Connexion Crossmark annulée');
            }
          } else {
            throw new Error('Crossmark n\'est pas installé. Installez l\'extension depuis https://crossmark.io/');
          }
          break;
          
        case 'xaman':
        case 'walletconnect':
          throw new Error(`${walletId} nécessite une configuration API. Vérifiez votre .env.local`);
          
        default:
          throw new Error(`Wallet ${walletId} non supporté`);
      }

      console.log(`🎉 Compte reçu:`, account);

      // Mettre à jour le state directement
      if (account && account.address) {
        console.log(`✅ Connexion réussie à ${account.address}`);
        setIsConnected(true);
        setAccountInfo({
          address: account.address,
          publicKey: account.publicKey,
          network: account.network || { name: 'testnet' }
        });
      }
      
      setShowWalletModal(false);
      toast({
        title: "Wallet connecté",
        description: `Connecté avec ${walletId}`,
      });
    } catch (error) {
      console.error('❌ Erreur de connexion:', error);
      toast({
        title: "Connexion échouée",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCopyAddress = () => {
    if (accountInfo?.address) {
      navigator.clipboard.writeText(accountInfo.address)
      toast({
        title: "Adresse copiée",
        description: "Adresse du wallet copiée",
      })
    }
  }

  const handleDisconnect = async () => {
    try {
      // Réinitialiser le state
      setIsConnected(false);
      setAccountInfo(null);
      
      toast({
        title: "Wallet déconnecté",
        description: "Votre wallet a été déconnecté",
      });
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  }

  if (!isConnected || !accountInfo) {
    return (
      <>
        <Button onClick={() => setShowWalletModal(true)} disabled={isConnecting}>
          <Wallet className="mr-2 h-4 w-4" />
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>

        <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect Wallet</DialogTitle>
              <DialogDescription>
                Choisissez votre wallet XRPL pour vous connecter
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {availableWallets.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Chargement des wallets disponibles...
                </p>
              )}
              {availableWallets.map((wallet) => (
                <Button
                  key={wallet.id}
                  variant="outline"
                  className="w-full justify-start h-auto py-4"
                  onClick={() => handleConnectWallet(wallet.id)}
                  disabled={isConnecting}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{wallet.icon}</span>
                    <div className="text-left">
                      <div className="font-semibold">{wallet.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {wallet.description}
                        {wallet.requiresApiKey && !process.env[`NEXT_PUBLIC_${wallet.id.toUpperCase()}_API_KEY`] && (
                          <span className="text-orange-500"> (API key requise)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              <p>💡 Crossmark et GemWallet sont des extensions navigateur</p>
              <p>🔑 Xaman et WalletConnect nécessitent des API keys</p>
            </div>
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
          {formatAddress(accountInfo.address)}
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
