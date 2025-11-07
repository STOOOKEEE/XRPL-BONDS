# 🏦 XRPL Bonds Marketplace

Marketplace d'obligations décentralisée sur la blockchain XRPL avec système de vault multi-sig.

## 📋 Architecture

### Backend (Librairie)

Le backend est une **librairie réutilisable** (pas de serveur) avec :

- `src/config/xrpl.js` - Configuration et client XRPL
- `src/models/Vault.js` - Modèle de données des vaults
- `src/lib/vaultOps.js` - Opérations vault (créer, contribuer, finaliser)
- `src/utils/conversions.js` - Utilitaires de conversion (XRPL, dates, montants)

### Frontend (React/Next.js)

- `src/hooks/useXRPLWallet.js` - Hook connexion wallet avec Crossmark
- `src/hooks/useVault.js` - Hook gestion des vaults
- `src/contexts/WalletContext.tsx` - Context global du wallet
- `src/components/WalletConnect.jsx` - Composant bouton connexion
- `src/components/WalletConnect.module.css` - Styles

## 🚀 Démarrage rapide

### 1. Installation des dépendances

```bash
# Racine du projet
npm install

# Backend (librairie)
cd backend
npm install
cd ..
```

### 2. Configuration .env

Créer `.env` à la racine (ou utiliser celui du backend) :

```env
REACT_APP_XRPL_NETWORK=testnet
REACT_APP_ISSUER_ADDRESS=rXXXXXX...
REACT_APP_ISSUER_SEED=sEd...
# ... voir backend/.env pour tous les paramètres
```

### 3. Générer des comptes testnet

Aller sur : https://xrpl.org/xrp-testnet-faucet.html

Créer 3+ comptes pour :

- 1 Issuer (émet les obligations)
- 2+ Signataires (multi-sig)

Copier leurs addresses et seeds dans `.env`.

### 4. Lancer l'app

```bash
npm run dev
```

## 💡 Utilisation

### Connexion Wallet

```jsx
import { useWallet } from "@/contexts/WalletContext";
import { WalletConnect } from "@/components/WalletConnect";

export default function App() {
  return (
    <WalletProvider>
      <WalletConnect />
    </WalletProvider>
  );
}
```

### Créer un Vault

```jsx
import { useVault } from "@/hooks/useVault";

const { createVault } = useVault();

await createVault({
  targetAmount: "1000", // 1000 USDC
  tokenSymbol: "MTP",
  recipientAddress: "rXXXX...",
  signers: [
    { address: "rSigner1...", weight: 1 },
    { address: "rSigner2...", weight: 1 },
  ],
  requiredSignatures: 2,
});
```

### Contribuer à un Vault

```jsx
const { contribute } = useVault();
const { wallet } = useWallet();

await contribute(
  "VAULT-1234-abc", // vaultId
  wallet.address, // investorAddress
  "100" // amount (USDC)
);
```

### Finaliser un Vault

```jsx
const { finalize } = useVault();

await finalize(
  "VAULT-1234-abc", // vaultId
  ["sig1", "sig2"] // signatures des signataires
);
```

## 🔐 Système Multi-Sig

Le vault utilise **multi-signature** pour sécuriser la finalisation :

1. **Création du vault** : Spécifier les signataires et nombre de signatures requises
2. **Contributions** : Investisseurs versent des USDC
3. **Finalisation** : Une fois objectif atteint, les signataires signent pour confirmer
4. **Mint & Transfer** : Tokens MTP mintés et fonds transférés au destinataire

## 📊 Structure d'un Vault

```javascript
{
  id: "VAULT-1704067200-abc123",
  targetAmount: "1000",           // Objectif USDC
  currentAmount: "1000",          // Total reçu
  maxAmount: "1000",              // Cap (ne pas dépasser)
  tokenSymbol: "MTP",
  tokensToMint: "1000",           // 1 MTP = 1 USDC
  recipientAddress: "rXXX...",    // Adresse recevant les fonds
  status: "COMPLETED",            // FUNDING | COMPLETED
  investors: [
    { address: "rInv1...", amount: "500", tokensMinted: "500" },
    { address: "rInv2...", amount: "500", tokensMinted: "500" }
  ],
  multisig: {
    signers: [
      { address: "rSig1...", weight: 1 },
      { address: "rSig2...", weight: 1 }
    ],
    requiredSignatures: 2
  }
}
```

## ✅ Validation & Erreurs

### Cas d'erreur gérés

- ❌ Contribution > cap restant : `"Contribution exceeds vault limit"`
- ❌ Montant invalide : `"Invalid amount. Must be a positive number."`
- ❌ Adresse invalide : `"Invalid address. Must be a valid XRPL address."`
- ❌ Objectif non atteint : `"Objective not reached yet"`
- ❌ Signatures insuffisantes : `"Not enough signatures"`

### Messages d'erreur détaillés

Chaque erreur retourne le montant restant disponible :

```json
{
  "error": "Contribution exceeds vault limit. Max remaining: 100.00 USDC",
  "maxRemaining": "100.00",
  "attemptedAmount": "150.00"
}
```

## 🎯 Ratio 1:1 (USDC → MTP)

- 1 USDC versé = 1 MTP reçu
- Les tokens sont mintés proportionnellement à la contribution
- Ratio défini dans `backend/src/lib/vaultOps.js`

## 🔧 Configuration Multi-Sig

Pour modifier les signataires ou le nombre requis :

1. Créer les wallets sur https://xrpl.org/xrp-testnet-faucet.html
2. Copier leurs addresses et seeds dans `.env`
3. Modifier `requiredSignatures` lors de la création du vault

```env
REACT_APP_SIGNATORY_1_ADDRESS=rXXX...
REACT_APP_SIGNATORY_1_SEED=sEd...
REACT_APP_SIGNATORY_2_ADDRESS=rYYY...
REACT_APP_SIGNATORY_2_SEED=sEd...
```

## 📚 API Reference

### VaultOps

```javascript
import * as VaultOps from '@/backend/src/lib/vaultOps';

// Créer un vault
VaultOps.createVault(options) → Promise

// Contribuer
VaultOps.contributeToVault(vaultId, address, amount) → Promise

// Récupérer le statut
VaultOps.getVaultStatus(vaultId) → Object

// Finaliser
VaultOps.finalizeVault(vaultId, signatures) → Promise

// Lister tous les vaults
VaultOps.listAllVaults() → Object

// Réinitialiser (dev)
VaultOps.resetVaults() → Object
```

## 🎮 Commandes

```bash
# Développement
npm run dev

# Build
npm run build

# Linter
npm run lint

# Formatter
npm run format
```

## 🌐 Testnet XRPL

- **Network URL** : https://s.altnet.rippletest.net:51234
- **Faucet** : https://xrpl.org/xrp-testnet-faucet.html
- **Explorer** : https://testnet.xrpl.org/

## 🚨 Limitations Hackathon

- Stockage en mémoire (pas de BDD)
- Pas de persistance entre redémarrages
- Transactions simulées (pas vraiment exécutées sur XRPL)
- Pas de gestion des erreurs réseau complète

## ✅ Pour la production

- [ ] Intégrer une vraie BDD (MongoDB, PostgreSQL)
- [ ] Vraies transactions XRPL
- [ ] Gestion des erreurs réseau robuste
- [ ] Tests unitaires et d'intégration
- [ ] Sécuriser les seeds/keys (HSM, Vault)
- [ ] Audit de sécurité
- [ ] Documentation de déploiement

## 📝 Notes

- Pas de serveur Express (utiliser API Routes de Next.js si besoin)
- Utiliser Crossmark pour les transactions
- Support du testnet uniquement pour l'instant

Bon hackathon ! 🚀
