"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/context/WalletContext"
import { Loader2 } from "lucide-react"
import { parseOAuth2Hash } from "@/lib/xaman-oauth2"

export default function XamanOAuth2CallbackPage() {
  const router = useRouter()
  const { setIsConnected, setAccountInfo, showStatus } = useWallet()
  const [status, setStatus] = useState<string>("Traitement de la connexion Xaman...")

  useEffect(() => {
    const handleOAuth2Callback = async () => {
      try {
        // Récupérer le token depuis le hash fragment (#) ou les query params (?)
        let access_token: string | null = null
        
        // Essayer d'abord le hash fragment (standard OAuth2 implicit flow)
        const hash = window.location.hash
        if (hash) {
          const parsed = parseOAuth2Hash(hash)
          access_token = parsed.access_token
        }
        
        // Si pas dans le hash, essayer les query params (Xaman semble utiliser ça)
        if (!access_token) {
          const params = new URLSearchParams(window.location.search)
          access_token = params.get('access_token')
        }
        
        if (!access_token) {
          throw new Error('Token d\'accès manquant')
        }
        
        console.log('✅ Token OAuth2 reçu:', access_token.substring(0, 20) + '...')

        setStatus("Récupération des informations du compte...")

        // Décoder le JWT pour obtenir les infos (le token contient déjà les infos)
        // Format JWT: header.payload.signature
        const parts = access_token.split('.')
        if (parts.length !== 3) {
          throw new Error('Token JWT invalide')
        }

        // Décoder la partie payload (base64url)
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
        console.log('📦 JWT payload:', payload)

        // Le payload contient: sub (account address), aud, iss, etc.
        const account = payload.sub
        const networkType = payload.nettype || payload.network || 'TESTNET'

        if (!account) {
          throw new Error('Aucune adresse de compte trouvée dans le token')
        }

        setStatus("Connexion réussie ! Redirection...")

        // Mettre à jour le contexte wallet
        setIsConnected(true)
        setAccountInfo({
          address: account,
          publicKey: '',
          network: { name: networkType.toUpperCase() === 'MAINNET' ? 'mainnet' : 'testnet' }
        })

        // Afficher un message de succès
        showStatus('Connexion Xaman réussie !', 'success')

        // Rediriger vers la page d'accueil
        setTimeout(() => {
          router.push('/')
        }, 1500)

      } catch (error) {
        console.error('Erreur callback Xaman OAuth2:', error)
        setStatus(error instanceof Error ? error.message : 'Erreur inconnue')
        
        showStatus(
          error instanceof Error ? error.message : 'Erreur de connexion Xaman',
          'error'
        )

        // Rediriger vers la page d'accueil après 3 secondes
        setTimeout(() => {
          router.push('/')
        }, 3000)
      }
    }

    handleOAuth2Callback()
  }, [router, setIsConnected, setAccountInfo, showStatus])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
        <h1 className="text-2xl font-bold">Connexion Xaman</h1>
        <p className="text-muted-foreground max-w-md">{status}</p>
      </div>
    </div>
  )
}
