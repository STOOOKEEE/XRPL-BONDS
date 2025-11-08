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
        // Récupérer le hash fragment (après #) qui contient le token
        const hash = window.location.hash
        
        if (!hash) {
          throw new Error('Aucun token OAuth2 reçu')
        }

        const { access_token } = parseOAuth2Hash(hash)
        
        if (!access_token) {
          throw new Error('Token d\'accès manquant')
        }

        setStatus("Récupération des informations du compte...")

        // Utiliser le JWT pour récupérer les infos utilisateur
        const response = await fetch('https://xumm.app/api/v1/platform/me', {
          headers: {
            'Authorization': `Bearer ${access_token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Impossible de récupérer les informations du compte')
        }

        const userData = await response.json()
        console.log('📦 User data:', userData)

        if (!userData.account) {
          throw new Error('Aucune adresse de compte trouvée')
        }

        setStatus("Connexion réussie ! Redirection...")

        // Mettre à jour le contexte wallet
        setIsConnected(true)
        setAccountInfo({
          address: userData.account,
          publicKey: '',
          network: { name: userData.networkType === 'MAINNET' ? 'mainnet' : 'testnet' }
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
