# 🏦 XRPL Bonds - Corporate Bonds Marketplace

<div align="center">

![XRPL](https://img.shields.io/badge/XRPL-Testnet-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

**Plateforme de tokenisation et trading d'obligations d'entreprises sur le XRP Ledger**

[Demo](#-demo) • [Features](#-fonctionnalités) • [Installation](#-installation) • [Documentation](#-documentation) • [Roadmap](#-roadmap)

</div>

---

## 📋 Table des matières

- [À propos](#-à-propos)
- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Technologies](#-technologies)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Utilisation](#-utilisation)
- [API](#-api)
- [Wallets supportés](#-wallets-supportés)
- [Roadmap](#-roadmap)
- [Contribuer](#-contribuer)
- [Licence](#-licence)

---

## 🎯 À propos

**XRPL Bonds** est une plateforme innovante qui révolutionne le marché des obligations d'entreprises en utilisant la technologie blockchain du XRP Ledger. Le projet permet aux entreprises d'émettre des obligations tokenisées et aux investisseurs d'acheter, vendre et gérer leurs portefeuilles d'obligations de manière transparente et sécurisée.

### 🌟 Pourquoi XRPL Bonds ?

- **🔒 Sécurité** : Transactions sécurisées sur le XRP Ledger
- **⚡ Rapidité** : Règlement instantané des transactions
- **💰 Faible coût** : Frais de transaction minimaux
- **🌍 Accessibilité** : Marché 24/7 accessible mondialement
- **📊 Transparence** : Traçabilité complète via blockchain
- **🤖 Automatisation** : Distribution automatique des coupons

---

## ✨ Fonctionnalités

### Pour les Entreprises (Émetteurs)

- ✅ **Émission d'obligations** : Créez et tokenisez vos obligations sur XRPL
- 📈 **Gestion de campagnes** : Configurez les paramètres de votre levée de fonds
- 💳 **Distribution automatique** : Paiement automatique des coupons aux détenteurs
- 📊 **Dashboard analytics** : Suivez vos obligations en temps réel
- 🔐 **KYC/AML** : Conformité réglementaire intégrée

### Pour les Investisseurs

- 🛒 **Marketplace** : Explorez et achetez des obligations tokenisées
- 👛 **Multi-wallet** : Connectez votre wallet préféré (Xaman, Crossmark, GemWallet, WalletConnect)
- 💼 **Portfolio management** : Gérez vos investissements en un seul endroit
- 💰 **Revenus passifs** : Recevez automatiquement vos paiements de coupons
- 📉 **Trading secondaire** : Achetez et vendez sur le marché secondaire
- 🔔 **Notifications** : Alertes pour les paiements et événements importants

### Techniques

- 🔄 **Monitoring temps réel** : Surveillance des transactions XRPL
- 🗄️ **Base de données MongoDB** : Stockage et indexation des données
- 🔐 **Smart contracts** : Utilisation des MPTokens et Escrows XRPL
- 📧 **Notifications email** : Intégration Resend pour les communications
- 🎨 **UI/UX moderne** : Interface responsive avec Tailwind CSS et Radix UI

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     XRPL Bonds Platform                      │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
        ┌───────▼────────┐         ┌───────▼────────┐
        │   Frontend     │         │    Backend     │
        │   (Next.js)    │◄────────┤  (Express.js)  │
        │   Port 3000    │  REST   │   Port 3001    │
        └────────────────┘         └────────────────┘
                │                          │
                │                          │
        ┌───────▼────────┐         ┌───────▼────────┐
        │  XRPL Wallets  │         │    MongoDB     │
        │  - Xaman       │         │   Database     │
        │  - Crossmark   │         │                │
        │  - GemWallet   │         └────────────────┘
        │  - WalletCon.  │                 │
        └────────────────┘                 │
                │                          │
                └────────────┬─────────────┘
                             │
                    ┌────────▼─────────┐
                    │   XRP Ledger     │
                    │   (Testnet)      │
                    │  - MPTokens      │
                    │  - Escrows       │
                    │  - Payments      │
                    └──────────────────┘
```

---

## 🛠️ Technologies

### Frontend

- **Next.js 16** - Framework React avec App Router
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styling utilitaire
- **Radix UI** - Composants UI accessibles
- **xrpl-connect** - Connexion multi-wallet
- **Zustand** - State management
- **React Query** - Data fetching et cache

### Backend

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** - Base de données NoSQL
- **Mongoose** - ODM MongoDB
- **xrpl.js** - SDK XRP Ledger
- **TypeScript** - Typage côté serveur

### Blockchain

- **XRP Ledger** - Blockchain sous-jacente
- **MPTokens** - Tokens multi-purpose pour les obligations
- **Escrows** - Smart contracts pour les campagnes
- **Payments** - Distribution des coupons

### Services externes

- **Resend** - Envoi d'emails
- **Xaman** - Wallet mobile OAuth
- **WalletConnect** - Protocol de connexion universel

---

## 🚀 Installation

### Prérequis

- **Node.js** >= 18.0
- **npm** ou **pnpm**
- **MongoDB** >= 5.0
- **Git**

### Installation rapide

```bash
# Cloner le repository
git clone https://github.com/STOOOKEEE/XRPL-BONDS.git
cd XRPL-BONDS

# Installer les dépendances frontend
npm install

# Installer les dépendances backend
cd backend
npm install
cd ..
```

---

## ⚙️ Configuration

### 1. Configuration Frontend

Créez un fichier `.env.local` à la racine :

```bash
# Wallets XRPL
NEXT_PUBLIC_XAMAN_API_KEY=your-xaman-api-key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Email (Resend)
RESEND_API_KEY=your-resend-api-key
FROM_EMAIL=onboarding@resend.dev
```

**Obtenir les clés :**
- Xaman API Key : https://apps.xumm.dev/
- WalletConnect Project ID : https://cloud.walletconnect.com/
- Resend API Key : https://resend.com/api-keys

### 2. Configuration Backend

Créez un fichier `backend/.env` :

```bash
# MongoDB
MONGODB_URI=mongodb+srv://xrpluser:HaCcXpg6cz0FPpQV@cluster0.ml4qq54.mongodb.net/xrpl-bonds?retryWrites=true&w=majority&appName=Cluster0

# XRPL
XRPL_URL=wss://s.altnet.rippletest.net:51233
ISSUER_SEED=sYourIssuerSeedHere

# Server
PORT=3001
```

### 3. Démarrer MongoDB

```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

---

## 🎮 Utilisation

### Démarrer l'application

**Terminal 1 - Backend :**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend :**
```bash
npm run dev
```

**Accéder à l'application :**
- Frontend : http://localhost:3000
- Backend API : http://localhost:3001
- Health check : http://localhost:3001/health

### Workflow complet

#### 1. Connexion Wallet
```bash
# Ouvrir http://localhost:3000
# Cliquer sur "Connect Wallet"
# Choisir votre wallet (Crossmark, GemWallet, Xaman, WalletConnect)
```

#### 2. Explorer le Marketplace
```bash
# Naviguer vers /marketplace
# Voir les obligations disponibles
# Filtrer par taux, maturité, risque
```

#### 3. Investir
```bash
# Sélectionner une obligation
# Cliquer sur "Invest"
# Confirmer la transaction dans votre wallet
```

#### 4. Gérer le Portfolio
```bash
# Voir vos holdings
# Suivre les paiements de coupons
# Vendre sur le marché secondaire
```

---

## 📡 API

### Endpoints principaux

#### Obligations

```bash
# Liste toutes les obligations
GET /api/bonds

# Détails d'une obligation
GET /api/bonds/:bondId

# Créer une obligation
POST /api/bonds

# Mettre à jour une obligation
PATCH /api/bonds/:bondId
```

#### Détenteurs

```bash
# Liste des détenteurs d'une obligation
GET /api/bonds/:bondId/holders

# Obligations d'un détenteur
GET /api/holders/:address/bonds
```

#### Transactions

```bash
# Transactions d'une obligation
GET /api/bonds/:bondId/transactions?type=transfer&limit=50

# Historique des coupons
GET /api/bonds/:bondId/coupons
```

#### Exemples

```javascript
// Récupérer toutes les obligations
const response = await fetch('http://localhost:3001/api/bonds');
const data = await response.json();

// Créer une obligation
const bond = await fetch('http://localhost:3001/api/bonds', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    bondId: 'BOND-001',
    tokenName: 'TechCorp Bond 2025',
    tokenCurrency: 'TC2025',
    totalSupply: '10000000',
    couponRate: 5.5,
    // ...autres paramètres
  })
});
```

---

## 👛 Wallets supportés

### Sans configuration (prêts à l'emploi)

#### 🌐 Crossmark
- **Type** : Extension navigateur
- **Installation** : https://crossmark.io/
- **Plateformes** : Chrome, Firefox, Edge, Brave

#### 💎 GemWallet
- **Type** : Extension navigateur
- **Installation** : https://gemwallet.app/
- **Plateformes** : Chrome, Firefox, Edge

### Avec configuration API

#### 📱 Xaman (ex-XUMM)
- **Type** : Application mobile
- **Installation** : https://xaman.app/
- **Plateformes** : iOS, Android
- **Nécessite** : API Key de https://apps.xumm.dev/

#### 🔗 WalletConnect
- **Type** : Protocol universel (QR Code)
- **Compatible avec** : 100+ wallets
- **Nécessite** : Project ID de https://cloud.walletconnect.com/

---

## 🗺️ Roadmap

### Phase 1 : MVP (Terminée ✅)
- [x] Connexion multi-wallet
- [x] Backend avec MongoDB
- [x] Marketplace basique
- [x] Émission d'obligations
- [x] Distribution automatique des coupons

### Phase 2 : Amélioration (En cours 🚧)
- [ ] KYC/AML intégré
- [ ] Trading peer-to-peer
- [ ] Charts et analytics avancés
- [ ] Mobile app (React Native)
- [ ] Support multilingue

### Phase 3 : Production (À venir 🔮)
- [ ] Migration Mainnet
- [ ] Audit de sécurité
- [ ] Intégration DEX
- [ ] API publique
- [ ] Programme de gouvernance

### Phase 4 : Expansion (Futur 🌟)
- [ ] Support multi-chain
- [ ] NFT pour obligations uniques
- [ ] Staking et yield farming
- [ ] DAO pour la gouvernance
- [ ] Marketplace secondaire avancé

---

## 🧪 Tests

### Tests unitaires
```bash
npm run test
```

### Tests d'intégration
```bash
npm run test:integration
```

### Tests E2E
```bash
npm run test:e2e
```

### Workflow de test complet
```bash
# Backend
cd backend
npm run test-workflow

# Frontend
npm run test
```

---

## 📚 Documentation

### Documentation détaillée

- **[WALLET_SETUP.md](./WALLET_SETUP.md)** - Configuration des wallets
- **[Backend README](./backend/README.md)** - Documentation backend
- **[ESCROW_README.md](./backend/ESCROW_README.md)** - Smart contracts Escrow
- **[EMAIL_SETUP.md](./EMAIL_SETUP.md)** - Configuration emails

### Ressources externes

- [XRPL Documentation](https://xrpl.org/)
- [xrpl-connect GitHub](https://github.com/XRPL-Labs/xrpl-connect)
- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Documentation](https://www.mongodb.com/docs/)

---

## 🤝 Contribuer

Les contributions sont les bienvenues ! Voici comment contribuer :

### 1. Fork le projet
```bash
gh repo fork STOOOKEEE/XRPL-BONDS
```

### 2. Créer une branche
```bash
git checkout -b feature/AmazingFeature
```

### 3. Commit les changements
```bash
git commit -m 'Add some AmazingFeature'
```

### 4. Push vers la branche
```bash
git push origin feature/AmazingFeature
```

### 5. Ouvrir une Pull Request

### Guidelines

- Suivez le style de code existant
- Ajoutez des tests pour les nouvelles fonctionnalités
- Mettez à jour la documentation
- Utilisez des messages de commit clairs

---

## 🐛 Signaler un bug

Trouvé un bug ? Aidez-nous à l'améliorer :

1. Vérifiez qu'il n'a pas déjà été signalé
2. Ouvrez une [issue](https://github.com/STOOOKEEE/XRPL-BONDS/issues)
3. Décrivez le problème et les étapes pour le reproduire
4. Ajoutez des captures d'écran si possible

---

## 📊 Statistiques du projet

![GitHub stars](https://img.shields.io/github/stars/STOOOKEEE/XRPL-BONDS?style=social)
![GitHub forks](https://img.shields.io/github/forks/STOOOKEEE/XRPL-BONDS?style=social)
![GitHub issues](https://img.shields.io/github/issues/STOOOKEEE/XRPL-BONDS)
![GitHub pull requests](https://img.shields.io/github/issues-pr/STOOOKEEE/XRPL-BONDS)

---

## 👥 Équipe

- **[STOOOKEEE](https://github.com/STOOOKEEE)** - Lead Developer

---

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](./LICENSE) pour plus de détails.

---

## 🙏 Remerciements

- **XRPL Foundation** pour la blockchain
- **Xaman** pour l'excellent wallet mobile
- **WalletConnect** pour le protocol universel
- **Next.js Team** pour le framework
- **MongoDB** pour la base de données
- **Vercel** pour l'hébergement

---

## 📞 Contact

- **GitHub** : [@STOOOKEEE](https://github.com/STOOOKEEE)
- **Issues** : [GitHub Issues](https://github.com/STOOOKEEE/XRPL-BONDS/issues)

---

<div align="center">

**⭐ Si vous aimez ce projet, donnez-lui une étoile ! ⭐**

Made with ❤️ by the XRPL Bonds Team

[⬆ Retour en haut](#-xrpl-bonds---corporate-bonds-marketplace)

</div>
