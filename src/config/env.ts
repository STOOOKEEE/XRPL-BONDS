/**
 * Configuration des variables d'environnement côté client
 * Toutes les variables utilisées ici doivent être préfixées avec NEXT_PUBLIC_
 */

export const ENV = {
  XAMAN_API_KEY: process.env.NEXT_PUBLIC_XAMAN_API_KEY || '',
  WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
} as const;

// Vérifications au chargement (seulement en dev)
if (process.env.NODE_ENV === 'development') {
  if (!ENV.XAMAN_API_KEY) {
    console.warn('⚠️ NEXT_PUBLIC_XAMAN_API_KEY non configurée');
  }
  if (!ENV.WALLETCONNECT_PROJECT_ID) {
    console.warn('⚠️ NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID non configurée');
  }
}
