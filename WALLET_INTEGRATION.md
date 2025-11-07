# Guide d'intégration XRPL Connect

## ✅ Implémentation terminée

L'intégration multi-wallet XRPL Connect est maintenant opérationnelle dans votre projet Next.js.

## 📦 Ce qui a été créé

### 1. **Types** (`src/types.ts`)
- Interfaces pour Event, AccountInfo, StatusMessage
- Réexportation du type WalletManager

### 2. **Configuration** (`.env.local`)
- Variables d'environnement pour les API keys
- `NEXT_PUBLIC_XAMAN_API_KEY`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

### 3. **WalletManager** (`src/lib/wallet-manager.ts`)
- Initialisation des 4 adapters :
  - **Xaman** - OAuth wallet mobile (nécessite API key)
  - **WalletConnect** - QR code universel (nécessite Project ID)
  - **Crossmark** - Extension navigateur
  - **GemWallet** - Extension navigateur
- Configuration réseau : `testnet` (changez en `mainnet` pour production)
- Auto-reconnexion activée

### 4. **Context** (`src/context/WalletContext.tsx`)
- Provider React pour gérer l'état global du wallet
- Événements : connect, disconnect, accountChanged, error
- Messages de statut avec timeout automatique
- Hook `useWallet()` pour accéder au context

### 5. **Composants**
- **WalletConnector** (`src/components/wallet-connector.tsx`)
  - Initialise le WalletManager
  - Écoute les événements et met à jour le context
  
- **WalletButton** (`src/components/wallet-button.tsx`)
  - Modal de sélection des wallets
  - Affichage de l'adresse connectée
  - Actions : copier adresse, déconnecter

### 6. **Layout** (`src/app/layout.tsx`)
- WalletProvider wrappé au niveau root
- WalletConnector initialisé au démarrage

## 🚀 Comment utiliser

### Obtenir les API keys (optionnel mais recommandé)

#### Xaman API Key
1. Allez sur [https://apps.xumm.dev/](https://apps.xumm.dev/)
2. Créez une nouvelle application
3. Copiez votre API key
4. Ajoutez-la dans `.env.local` :
   ```bash
   NEXT_PUBLIC_XAMAN_API_KEY=votre-cle-xaman
   ```

#### WalletConnect Project ID
1. Allez sur [https://cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Créez un nouveau projet
3. Copiez votre Project ID
4. Ajoutez-le dans `.env.local` :
   ```bash
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=votre-project-id
   ```

### Sans API keys
- ✅ **Crossmark** et **GemWallet** fonctionnent directement (extensions navigateur)
- ❌ **Xaman** et **WalletConnect** seront désactivés

### Redémarrer le serveur
Après avoir ajouté les API keys :
```bash
npm run dev
```

## 🎯 Utilisation dans vos composants

```tsx
'use client';

import { useWallet } from '@/context/WalletContext';

export function MonComposant() {
  const { 
    walletManager,
    isConnected, 
    accountInfo,
    addEvent,
    showStatus 
  } = useWallet();

  if (isConnected && accountInfo) {
    return (
      <div>
        Connecté : {accountInfo.address}
        Réseau : {accountInfo.network.name}
      </div>
    );
  }

  return <p>Non connecté</p>;
}
```

## 🔧 Configuration réseau

Dans `src/lib/wallet-manager.ts`, modifiez le réseau :

```typescript
const walletManager = new WalletManager({
  adapters,
  network: 'mainnet', // 'testnet', 'mainnet', 'devnet'
  autoConnect: true,
});
```

## 🐛 Troubleshooting

### "WalletManager non initialisé"
- Le WalletConnector s'initialise au chargement de l'app
- Vérifiez que `<WalletProvider>` est bien dans le layout

### "API key requise"
- Xaman et WalletConnect nécessitent des clés
- Sans clé, seuls Crossmark et GemWallet sont disponibles

### Extensions non détectées
- Installez [Crossmark](https://crossmark.io/)
- Installez [GemWallet](https://gemwallet.app/)
- Rechargez la page après installation

### Popup bloqué (Xaman)
- Autorisez les popups pour votre site
- Le popup OAuth de Xaman doit s'ouvrir

### QR code ne s'affiche pas (WalletConnect)
- Vérifiez que le Project ID est valide
- Vérifiez votre connexion internet

## 📝 Notes sur xrpl-connect 0.3.0

La version actuelle (0.3.0) est une version ancienne du package. L'implémentation :
- ✅ Supporte les 4 wallets via les adapters
- ⚠️ Le web component `<xrpl-wallet-connector>` n'est pas encore disponible
- ✅ L'intégration manuelle via le WalletManager fonctionne
- 🔄 Lors d'une mise à jour vers une version plus récente, le web component sera disponible

## 🎨 Personnalisation

Le modal de sélection des wallets peut être stylisé en modifiant `src/components/wallet-button.tsx`.

Les icônes actuelles sont des emojis, vous pouvez les remplacer par des images :
```typescript
const WALLET_OPTIONS: WalletOption[] = [
  {
    id: 'xaman',
    name: 'Xaman',
    icon: '/images/xaman-icon.png', // Remplacez par une vraie image
    description: 'Mobile wallet with OAuth',
  },
  // ...
];
```

## 🚢 Déploiement

Avant de déployer en production :

1. ✅ Changez le réseau en `mainnet` dans `wallet-manager.ts`
2. ✅ Ajoutez les vraies API keys dans les variables d'environnement de production
3. ✅ Testez toutes les connexions wallet
4. ✅ Vérifiez les logs dans la console navigateur

## 🎉 C'est terminé !

Votre application supporte maintenant 4 wallets XRPL :
- 🔷 **Xaman** (mobile)
- 🔗 **WalletConnect** (universel)
- ✖️ **Crossmark** (extension)
- 💎 **GemWallet** (extension)

Le bouton "Connect Wallet" dans le header affiche un modal avec les options disponibles.
