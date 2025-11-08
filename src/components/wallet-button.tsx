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
import { ENV } from "@/config/env"
import { WalletConnectModal } from "./walletconnect-modal"
import { redirectToXamanOAuth2 } from "@/lib/xaman-oauth2"

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
    description: 'QR code (support XRPL limité)',
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
  const [showWalletConnectModal, setShowWalletConnectModal] = useState(false)
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
          console.log(`🔄 Connexion Crossmark...`);
          
          // Crossmark injecte window.crossmark dans la page
          if (typeof window === 'undefined') {
            throw new Error('Window non disponible');
          }

          console.log('🔍 Vérification de Crossmark...');
          console.log('window.crossmark:', typeof (window as any).crossmark);
          console.log('window.crossmarkSdk:', typeof (window as any).crossmarkSdk);
          
          // Vérifier si Crossmark est installé
          const crossmarkApi = (window as any).crossmark || (window as any).crossmarkSdk;
          
          if (!crossmarkApi) {
            throw new Error('Crossmark n\'est pas installé. Installez l\'extension depuis https://crossmark.io/');
          }

          console.log('✅ Crossmark détecté');
          console.log('📋 Méthodes disponibles:', Object.keys(crossmarkApi));

          // Connexion avec Crossmark - essayer différentes méthodes
          try {
            let result;
            
            // Crossmark utilise methods.signInAndWait() ou sync.signInAndWait()
            if (crossmarkApi.methods && typeof crossmarkApi.methods.signInAndWait === 'function') {
              console.log('🔄 Utilisation de methods.signInAndWait()');
              result = await crossmarkApi.methods.signInAndWait();
            }
            else if (crossmarkApi.sync && typeof crossmarkApi.sync.signInAndWait === 'function') {
              console.log('🔄 Utilisation de sync.signInAndWait()');
              result = await crossmarkApi.sync.signInAndWait();
            }
            else if (crossmarkApi.async && typeof crossmarkApi.async.signInAndWait === 'function') {
              console.log('🔄 Utilisation de async.signInAndWait()');
              result = await crossmarkApi.async.signInAndWait();
            }
            // Fallback
            else if (typeof crossmarkApi.signInAndWait === 'function') {
              console.log('🔄 Utilisation de signInAndWait()');
              result = await crossmarkApi.signInAndWait();
            }
            else {
              console.error('Structure Crossmark:', {
                methods: crossmarkApi.methods ? Object.keys(crossmarkApi.methods) : 'undefined',
                sync: crossmarkApi.sync ? Object.keys(crossmarkApi.sync) : 'undefined',
                async: crossmarkApi.async ? Object.keys(crossmarkApi.async) : 'undefined'
              });
              throw new Error('Aucune méthode de connexion trouvée dans l\'API Crossmark');
            }
            
            console.log('📦 Résultat Crossmark:', result);
            
            // Crossmark peut retourner différents formats
            const address = result?.address || result?.response?.data?.address || result?.data?.address;
            const publicKey = result?.publicKey || result?.response?.data?.publicKey || result?.data?.publicKey;
            
            if (address) {
              account = {
                address: address,
                publicKey: publicKey || '',
                network: 'testnet'
              };
            } else {
              throw new Error('Connexion Crossmark annulée ou aucune adresse reçue');
            }
          } catch (error) {
            console.error('❌ Erreur Crossmark:', error);
            throw new Error(error instanceof Error ? error.message : 'Erreur de connexion Crossmark');
          }
          break;
          
        case 'xaman':
          console.log(`🔄 Connexion Xaman via OAuth2...`);
          const xamanApiKey = ENV.XAMAN_API_KEY;
          if (!xamanApiKey) {
            throw new Error('Xaman API Key non configurée');
          }
          toast({
            title: "Connexion Xaman",
            description: "Redirection vers Xaman...",
          });
          redirectToXamanOAuth2(xamanApiKey, `${window.location.origin}/xaman-oauth2-callback`);
          return;
          
        case 'walletconnect':
          console.log(`🔄 Connexion WalletConnect...`);
          
          // Vérifier que le Project ID est configuré
          const wcProjectId = ENV.WALLETCONNECT_PROJECT_ID;
          if (!wcProjectId || wcProjectId === 'your-walletconnect-project-id-here') {
            throw new Error('WalletConnect Project ID non configuré. Obtenez-en un sur https://cloud.walletconnect.com');
          }
          
          console.log('🔑 WalletConnect Project ID trouvé:', wcProjectId.substring(0, 8) + '...');
          
          // Fermer la modal de sélection et ouvrir la modal WalletConnect
          setShowWalletModal(false);
          setShowWalletConnectModal(true);
          
          toast({
            title: "WalletConnect",
            description: "Ouvrez votre app Xaman et scannez le QR code qui va apparaître",
          });
          
          // Ne pas continuer - le modal gérera la connexion
          return;
          break;
          
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

        {/* Modal WalletConnect avec QR code */}
        <WalletConnectModal
          isOpen={showWalletConnectModal}
          onClose={() => setShowWalletConnectModal(false)}
          onConnect={(address, publicKey) => {
            setIsConnected(true);
            setAccountInfo({
              address,
              publicKey,
              network: { name: 'testnet' }
            });
            toast({
              title: "Wallet connecté",
              description: `Connecté avec WalletConnect`,
            });
          }}
          projectId={ENV.WALLETCONNECT_PROJECT_ID}
        />
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
