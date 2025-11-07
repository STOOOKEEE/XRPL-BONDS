# XRPL Bonds - Architecture Hooks

## 🎯 Architecture

Ce projet utilise une **architecture 100% décentralisée** basée sur **XRPL Hooks** au lieu d'un serveur backend centralisé.

### Structure du Projet

```
XRPL-BONDS/
├── backend/
│   ├── hooks/                    # Smart contracts XRPL Hooks (C)
│   │   ├── vault_manager.c       # Gestion des vaults et émissions
│   │   ├── coupon_distributor.c  # Distribution automatique des coupons
│   │   └── maturity_checker.c    # Vérification des échéances
│   ├── compile-hook.sh           # Script de compilation C → WASM → HEX
│   └── package.json              # Placeholder (backend serveur supprimé)
├── src/
│   ├── app/                      # Next.js App Router
│   ├── components/               # Composants React
│   ├── contexts/                 # Contexts React (Wallet, etc.)
│   ├── hooks/                    # React hooks personnalisés
│   ├── lib/                      # Bibliothèques client-side
│   │   └── vaultOps.ts          # Opérations vault côté client
│   └── types/                    # TypeScript type definitions
└── README.md
```

## 🔧 Hooks XRPL

### 1. Vault Manager (`vault_manager.c`)

**Responsabilités :**
- Tracking des contributions USDC des investisseurs
- Maintien des balances dans Hook State
- Création automatique des MPTokens quand l'objectif est atteint
- Distribution proportionnelle des tokens
- Transfert des fonds collectés à l'entreprise

**Clés Hook State :**
- `contributors_index` : Liste CSV des contributeurs
- `contrib:<address>` : Montant contribué par adresse
- `total_collected` : Total collecté
- `target_amount` : Objectif de financement
- `finalized` : Flag de finalisation

### 2. Coupon Distributor (`coupon_distributor.c`)

**Responsabilités :**
- Détection des paiements de coupons entrants
- Lecture des holders depuis Hook State
- Calcul des parts proportionnelles
- Distribution automatique aux holders
- Mise à jour `couponsRemaining` dans les métadonnées

**Clés Hook State :**
- `holders_index` : Liste CSV des détenteurs de tokens
- `holder:<address>` : Balance en tokens
- `active_token` : Token ID actif pour distribution
- `mpmeta:<token_id>:couponsRemaining` : Coupons restants

### 3. Maturity Checker (`maturity_checker.c`)

**Responsabilités :**
- Scan périodique des tokens (via transaction trigger)
- Vérification des dates d'échéance
- Marquage `isMatured=true` pour tokens expirés
- Blocage optionnel des trades pour tokens matures

**Clés Hook State :**
- `tokens_index` : Liste CSV des token IDs
- `mpmeta:<token_id>:maturityDate` : Date d'échéance (timestamp UNIX)
- `mpmeta:<token_id>:isMatured` : Flag de maturité
- `now_ts` : Timestamp actuel (fourni par caller)

## 🚀 Compilation des Hooks

### Prérequis

```bash
# macOS
brew install llvm@13
brew install binaryen

# Linux
apt-get install clang-13 binaryen
```

### Compiler un Hook

```bash
cd backend
./compile-hook.sh hooks/vault_manager.c
./compile-hook.sh hooks/coupon_distributor.c
./compile-hook.sh hooks/maturity_checker.c
```

Les fichiers `.wasm` et `.hex` seront générés dans `backend/build/`.

## 🌐 Frontend

### Configuration XRPL

Le frontend se connecte directement à **Hooks Testnet v3** :
- WebSocket: `wss://hooks-testnet-v3.xrpl-labs.com`
- Network ID: 21338

### Connexion Wallet

Intégration avec :
- **Crossmark** (extension navigateur)
- **Xaman** (mobile, anciennement XUMM)

Voir `/wallet-test` pour tester la connexion.

### Opérations Vault (Client-Side)

Fichier `src/lib/vaultOps.ts` :
- `createVault()` : Créer un vault en mémoire locale
- `contributeToVault()` : Ajouter contribution
- `getVaultStatus()` : Status du vault
- `finalizeVault()` : Finaliser (trigger Hook)

**Note :** Ces fonctions sont des wrappers client qui interagissent avec les Hooks via transactions XRPL, pas un serveur backend.

## 📝 Migration Backend → Hooks

### ❌ Supprimé (Backend Express)
- `backend/src/server.js` - Serveur Express
- `backend/src/routes/` - Routes API REST
- `backend/src/lib/vaultOps.js` - Logique serveur
- `backend/src/models/` - Modèles en mémoire
- `backend/src/utils/xrplOps.js` - Utilitaires serveur
- `backend/src/config/xrpl.js` - Config serveur

### ✅ Remplacé par
- **Hooks C** : Logique on-chain dans `backend/hooks/`
- **Client vaultOps.ts** : Interactions directes XRPL depuis le frontend
- **Hook State** : Stockage décentralisé sur la blockchain

## 🧪 Tests

### Tester le Frontend

```bash
npm run dev
# Ouvrir http://localhost:3000/wallet-test
```

### Tester les Hooks (À implémenter)

Scripts Node.js à créer pour simuler :
1. Création de wallets testnet
2. Déploiement des Hooks compilés
3. Simulation de contributions
4. Trigger de finalisation
5. Distribution de coupons
6. Vérification d'échéance

## 🔐 Sécurité

### Avantages Architecture Hooks
- ✅ Pas de serveur centralisé vulnérable
- ✅ Logique métier immuable on-chain
- ✅ Pas de clés privées stockées côté serveur
- ✅ Signatures locales (Xumm/Crossmark)
- ✅ Audit trail complet sur blockchain

### Points à Valider
- ⚠️ Hooks SDK : Remplacer les placeholders par vraies fonctions SDK
- ⚠️ Limits Hook State : Max 256 bytes/entrée (utiliser indexation off-chain si besoin)
- ⚠️ Gas/CPU limits : Éviter boucles coûteuses (batch holders si nécessaire)
- ⚠️ Audit sécurité : Faire auditer les Hooks avant production

## 🛠️ Développement

### Build Frontend

```bash
npm install
npm run build
npm start
```

### Lint & Format

```bash
npm run lint
npm run format
```

## 📚 Ressources

- [XRPL Hooks Documentation](https://hooks-testnet.xrpl-labs.com/)
- [MPTokens Spec](https://github.com/XRPLF/XRPL-Standards/discussions/80)
- [xrpl.js v4.2.0](https://github.com/XRPL-Labs/xrpl.js)
- [Xumm Wallet](https://xumm.app/)
- [Crossmark Wallet](https://crossmark.io/)

## 🚧 TODO

- [ ] Compiler les Hooks avec SDK complet (remplacer placeholders)
- [ ] Ajouter scripts de test Node.js pour Hooks
- [ ] Implémenter déploiement automatisé des Hooks
- [ ] Créer interface admin pour initialiser Hook State
- [ ] Ajouter monitoring des Hooks (logs, state queries)
- [ ] Audit sécurité des smart contracts
- [ ] Documentation API Hooks détaillée
- [ ] Tests end-to-end complets

## 📄 License

ISC
