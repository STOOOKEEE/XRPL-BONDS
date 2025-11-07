# 📁 Structure du projet XRPL-BONDS (Consolidée)

## 🎯 Objectif
Architecture simplifiée et organisée par fonctionnalité, avec séparation claire des modules wallet.

## 📂 Structure des dossiers

### `/src/lib` - Utilitaires et logique métier (5 fichiers)

#### `bonds.ts` (CONSOLIDÉ ✨)
Regroupe :
- **Types** : Bond, Offer, OfferToken, SortOption, FilterOptions
- **Calculs** : APY, ROI, formatage devise/pourcentage
- **Données mock** : MOCK_BONDS, MOCK_OFFERS

#### `utils.ts` (CONSOLIDÉ ✨)
Regroupe :
- **Tailwind utils** : fonction `cn()` pour merge de classes
- **React Query** : configuration du queryClient

#### `wallet.ts` (SÉPARÉ 🔐)
- Connexion GemWallet
- Vérification réseau XRPL
- Formatage adresses

#### `store.ts` (SÉPARÉ 🔐)
- Store Zustand pour l'état wallet
- Gestion connexion/déconnexion

#### `vaultOps.ts` (SÉPARÉ 🔐)
- Opérations XRPL spécifiques
- Non modifié

---

### `/src/components` - Composants React (Organisation par fonctionnalité)

#### `/bonds/` (4 composants)
- `bond-card.tsx` - Carte bond pour listes
- `bond-detail-card.tsx` - Carte détaillée
- `bond-detail-modal.tsx` - Modal avec détails complets
- `invest-modal.tsx` - Modal d'investissement
- **index.ts** - Exports centralisés

#### `/marketplace/` (5 composants)
- `offer-card.tsx` - Carte offre marché secondaire
- `offer-detail.tsx` - Détails d'une offre
- `buy-offer-modal.tsx` - Modal d'achat
- `token-drawer.tsx` - Drawer info token
- `token-picker.tsx` - Sélecteur de tokens
- **index.ts** - Exports centralisés

#### `/leaderboard/` (2 composants)
- `leaderboard.tsx` - Tableau de classement bonds
- `leaderboard-controls.tsx` - Filtres et tri
- **index.ts** - Exports centralisés

#### Composants racine (6 fichiers)
- `header.tsx` - Header navigation
- `wallet-button.tsx` 🔐 - Bouton connexion wallet (NE PAS TOUCHER)
- `WalletConnect.tsx` 🔐 - Ancien composant (legacy, peut être supprimé)
- `WalletConnect.module.css` 🔐 - Styles legacy
- `lot-summary.tsx` - Résumé lot (standalone)
- `theme-provider.tsx` - Provider thème dark/light

#### `/ui/` (52 composants shadcn)
- Tous les composants shadcn/ui (Button, Card, Dialog, etc.)

---

## 🚀 Imports simplifiés

### Avant ❌
```typescript
import type { Bond } from "@/lib/types"
import { formatCurrency } from "@/lib/calculations"
import { MOCK_BONDS } from "@/lib/mock-data"
import { BondCard } from "@/components/bond-card"
import { Leaderboard } from "@/components/leaderboard"
```

### Après ✅
```typescript
import type { Bond } from "@/lib/bonds"
import { formatCurrency, MOCK_BONDS } from "@/lib/bonds"
import { BondCard } from "@/components/bonds"
import { Leaderboard } from "@/components/leaderboard"
```

---

## 📊 Statistiques

### Avant consolidation
- **src/lib/** : 8 fichiers
- **src/components/** : 17 fichiers (+ 52 UI)
- Imports éparpillés

### Après consolidation
- **src/lib/** : 5 fichiers (-37.5%)
- **src/components/** : Organisés en 3 dossiers + 6 racine
- Imports centralisés via index.ts

---

## 🔐 Modules Wallet (À NE PAS MODIFIER)

Ces fichiers gèrent la connexion wallet et doivent rester séparés :
- `src/lib/wallet.ts`
- `src/lib/store.ts`
- `src/components/wallet-button.tsx`
- `src/components/WalletConnect.tsx` (legacy)
- `src/components/WalletConnect.module.css` (legacy)

---

## 🎨 Avantages de cette structure

1. **Moins de fichiers** - Plus facile à naviguer
2. **Organisation logique** - Par fonctionnalité métier
3. **Imports propres** - Un seul import pour plusieurs éléments
4. **Wallet isolé** - Facile à maintenir/modifier séparément
5. **Scalable** - Facile d'ajouter de nouveaux composants dans les bons dossiers
