"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useWallet } from "@/context/WalletContext"
import { ENV } from "@/config/env"
import { Loader2 } from "lucide-react"

export default function XamanCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setIsConnected, setAccountInfo, showStatus } = useWallet()
  const [status, setStatus] = useState<string>("Vérification de la connexion Xaman...")

  useEffect(() => {
    const handleXamanCallback = async () => {
      try {
        // Récupérer le payload ID depuis l'URL ou le localStorage
        let payloadId = searchParams.get('payloadId') || localStorage.getItem('xaman_payload_id')
        
        // Si l'URL contient {id}, cela signifie que Xaman n'a pas remplacé le placeholder
        // Dans ce cas, on utilise le localStorage
        if (!payloadId || payloadId.includes('{id}')) {
          payloadId = localStorage.getItem('xaman_payload_id')
        }
        
        if (!payloadId) {
          throw new Error('Aucun payload ID trouvé. Veuillez réessayer la connexion.')
        }

        setStatus("Récupération des informations du compte...")

        // Vérifier le statut du payload via l'API Xaman
        const xamanApiKey = ENV.XAMAN_API_KEY
        if (!xamanApiKey) {
          throw new Error('Xaman API Key non configurée')
        }

        console.log('🔑 Xaman API Key trouvée dans callback:', xamanApiKey.substring(0, 8) + '...')

        // Polling pour attendre la signature
        let payloadData: any = null
        const maxAttempts = 30
        const intervalMs = 2000

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          setStatus(`En attente de votre approbation dans Xaman... (${attempt + 1}/${maxAttempts})`)
          
          const response = await fetch(`/api/xaman/payload/${payloadId}`)

          if (!response.ok) {
            throw new Error('Impossible de récupérer le statut du payload')
          }

          const status = await response.json()
          
          // Signature confirmée
          if (status.meta.signed === true) {
            payloadData = status
            break
          }

          // Signature refusée
          if (status.meta.signed === false) {
            throw new Error('Connexion refusée par l\'utilisateur')
          }

          // Payload expiré
          if (status.meta.expired) {
            throw new Error('Le délai de connexion a expiré')
          }

          // Payload annulé
          if (status.meta.cancelled) {
            throw new Error('Connexion annulée')
          }

          // Attendre avant le prochain essai
          if (attempt < maxAttempts - 1) {
            await new Promise(resolve => setTimeout(resolve, intervalMs))
          }
        }

        if (!payloadData) {
          throw new Error('Délai d\'attente dépassé. Veuillez réessayer.')
        }

        // Récupérer l'adresse du compte
        const account = payloadData.response?.account
        if (!account) {
          throw new Error('Aucune adresse de compte trouvée')
        }

        setStatus("Connexion réussie ! Redirection...")

        // Déterminer le réseau
        const networkType = payloadData.response?.environment_nodetype?.toLowerCase() || 'testnet'
        const networkName = networkType.includes('main') ? 'mainnet' : 'testnet'

        // Mettre à jour le contexte wallet
        setIsConnected(true)
        setAccountInfo({
          address: account,
          publicKey: payloadData.response?.signer || '',
          network: { name: networkName }
        })

        // Nettoyer le localStorage
        localStorage.removeItem('xaman_payload_id')

        // Afficher un message de succès
        showStatus('Connexion Xaman réussie !', 'success')

        // Rediriger vers la page d'accueil
        setTimeout(() => {
          router.push('/')
        }, 1500)

      } catch (error) {
        console.error('Erreur callback Xaman:', error)
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

    handleXamanCallback()
  }, [searchParams, router, setIsConnected, setAccountInfo, showStatus])

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
