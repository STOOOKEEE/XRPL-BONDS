"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useEffect, useState, useRef } from "react"
import { Loader2 } from "lucide-react"

interface WalletConnectModalProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (address: string, publicKey: string) => void
  projectId: string
}

export function WalletConnectModal({ isOpen, onClose, onConnect, projectId }: WalletConnectModalProps) {
  const [uri, setUri] = useState<string>('')
  const [status, setStatus] = useState<string>('Initialisation...')
  const [error, setError] = useState<string>('')
  const qrContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    let signClient: any = null
    let currentSession: any = null
    let cancelled = false

    const initWalletConnect = async () => {
      try {
        setStatus('Initialisation de WalletConnect...')
        setError('')
        
        // Importer SignClient
        const { SignClient } = await import('@walletconnect/sign-client')
        
        console.log('🔧 Création du SignClient...')
        console.log('📋 Project ID:', projectId)
        
        // Créer le client avec relayUrl explicite
        signClient = await SignClient.init({
          projectId,
          relayUrl: 'wss://relay.walletconnect.com',
          metadata: {
            name: 'XRPL Corporate Bonds',
            description: 'Invest in tokenized corporate bonds on XRPL',
            url: window.location.origin,
            icons: [`${window.location.origin}/icon.svg`],
          },
        })

        console.log('✅ SignClient initialisé:', signClient)
        
        if (cancelled) return
        
        setStatus('Génération du QR code...')

        console.log('🔗 Création de la session...')

        // Créer une session avec optionalNamespaces (requiredNamespaces est déprécié)
        const { uri: connectionUri, approval } = await signClient.connect({
          optionalNamespaces: {
            xrpl: {
              methods: ['xrpl_signTransaction', 'xrpl_signMessage'],
              chains: ['xrpl:0', 'xrpl:1'], // 0 = mainnet, 1 = testnet
              events: ['accountsChanged', 'chainChanged'],
            },
          },
        })

        console.log('✅ Session créée, URI générée')

        if (cancelled) return

        console.log('📱 URI de connexion:', connectionUri)

        if (connectionUri) {
          setUri(connectionUri)
          setStatus('Scannez le QR code avec un wallet compatible')
          
          console.log('🎨 Génération du QR code...')
          
          // Attendre que le DOM soit prêt
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // Générer le QR code
          if (qrContainerRef.current) {
            console.log('📦 Container trouvé, création du QR...')
            const QRCode = (await import('qrcode')).default
            const canvas = document.createElement('canvas')
            
            try {
              await QRCode.toCanvas(canvas, connectionUri, {
                width: 300,
                margin: 2,
                color: {
                  dark: '#000000',
                  light: '#ffffff',
                },
              })
              
              console.log('✅ QR code généré avec succès')
              qrContainerRef.current.innerHTML = ''
              qrContainerRef.current.appendChild(canvas)
            } catch (qrError) {
              console.error('❌ Erreur génération QR:', qrError)
            }
          } else {
            console.warn('⚠️ Container non trouvé pour le QR code')
          }
        }

        console.log('⏳ Attente de l\'approbation...')
        
        // Attendre l'approbation avec timeout
        const approvalPromise = approval()
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout: connexion non approuvée après 5 minutes')), 300000)
        })

        currentSession = await Promise.race([approvalPromise, timeoutPromise])
        
        if (cancelled) return
        
        console.log('✅ Session approuvée:', currentSession)
        
        // Extraire l'adresse
        const namespaces = currentSession.namespaces
        console.log('📦 Namespaces:', namespaces)
        
        const xrplNamespace = namespaces.xrpl
        if (!xrplNamespace) {
          const availableNamespaces = Object.keys(namespaces).join(', ')
          throw new Error(
            `Ce wallet ne supporte pas XRPL. Il supporte: ${availableNamespaces || 'aucun namespace compatible'}. ` +
            `Pour vous connecter, utilisez les boutons Xaman, GemWallet ou Crossmark.`
          )
        }

        const accounts = xrplNamespace.accounts || []
        console.log('👛 Comptes:', accounts)
        
        if (accounts.length > 0) {
          // Format CAIP-10: "xrpl:0:rAddress..." ou "xrpl:1:rAddress..."
          const addressParts = accounts[0].split(':')
          const address = addressParts[addressParts.length - 1]
          
          console.log('✅ Adresse extraite:', address)
          
          setStatus('Connexion réussie !')
          onConnect(address, '')
          setTimeout(onClose, 1500)
        } else {
          throw new Error('Aucune adresse reçue')
        }

      } catch (err) {
        if (cancelled) return
        
        console.error('❌ Erreur WalletConnect:', err)
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
        setError(errorMessage)
        setStatus('Erreur de connexion')
      }
    }

    initWalletConnect()

    // Cleanup
    return () => {
      cancelled = true
      if (signClient && currentSession) {
        try {
          signClient.disconnect({
            topic: currentSession.topic,
            reason: {
              code: 6000,
              message: 'User disconnected',
            },
          }).catch((e: any) => console.warn('Disconnect warning:', e))
        } catch (e) {
          console.warn('Cleanup error:', e)
        }
      }
    }
  }, [isOpen, projectId, onConnect, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connexion WalletConnect</DialogTitle>
          <DialogDescription>
            Scannez ce QR code avec votre wallet Xaman
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center gap-4 py-4">
          {error ? (
            <div className="text-center max-w-md">
              <p className="text-sm text-destructive mb-3">❌ {error}</p>
              <div className="text-xs text-muted-foreground space-y-2">
                <p className="font-semibold">Wallets XRPL recommandés :</p>
                <ul className="list-disc list-inside text-left">
                  <li>Xaman (mobile/desktop)</li>
                  <li>GemWallet (extension Chrome)</li>
                  <li>Crossmark (extension Chrome)</li>
                </ul>
                <p className="mt-3 text-yellow-600">
                  ⚠️ La plupart des wallets WalletConnect (MetaMask, Rainbow, etc.) ne supportent que Ethereum, pas XRPL.
                </p>
              </div>
            </div>
          ) : (
            <>
              {uri ? (
                <>
                  <div 
                    ref={qrContainerRef}
                    className="border-4 border-primary rounded-lg p-2"
                  />
                  <p className="text-sm text-center text-muted-foreground">
                    {status}
                  </p>
                  <p className="text-xs text-center text-muted-foreground">
                    Utilisez un wallet compatible WalletConnect :<br/>
                    • MetaMask, Rainbow, Trust Wallet, etc.<br/>
                    • Pour Xaman, utilisez le bouton "Xaman" directement
                  </p>
                </>
              ) : (
                <>
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">{status}</p>
                </>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
