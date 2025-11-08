# XRPL Bonds - Base de données MongoDB

## 🎯 Architecture

Ce système gère des obligations tokenisées sur XRPL avec suivi off-chain dans MongoDB.

### Composants principaux

1. **Base de données MongoDB** - Stockage des données d'obligations
2. **Services de monitoring** - Surveillance des transactions XRPL en temps réel
3. **Service de distribution de coupons** - Paiements automatiques aux détenteurs
4. **API REST** - Interface pour interroger et gérer les obligations

## 📊 Modèles de données

### Bond (Obligation)
```typescript
{
  bondId: string;              // ID unique
  issuerAddress: string;       // Adresse XRPL de l'émetteur
  issuerName: string;          // Nom de l'entreprise
  tokenCurrency: string;       // ID du token MPT sur XRPL
  tokenName: string;           // Nom lisible
  totalSupply: string;         // Total de tokens émis
  denomination: string;        // Valeur nominale par token
  couponRate: number;          // Taux du coupon (%)
  couponFrequency: string;     // Fréquence des paiements
  maturityDate: number;        // Date d'échéance
  nextCouponDate: number;      // Prochain paiement
  status: string;              // active | matured | defaulted
}
```

### BondHolder (Détenteur)
```typescript
{
  bondId: string;              // Référence à l'obligation
  holderAddress: string;       // Adresse XRPL du détenteur
  balance: string;             // Nombre de tokens détenus
  lastCouponPaid: number;      // Dernier coupon reçu
  totalCouponsReceived: string;// Total des coupons
}
```

### Transaction (Traçabilité)
```typescript
{
  bondId: string;              // Référence à l'obligation
  txHash: string;              // Hash XRPL
  fromAddress: string;         // Expéditeur
  toAddress: string;           // Destinataire
  amount: string;              // Montant transféré
  type: string;                // issuance | transfer | coupon_payment
  timestamp: number;           // Date de la transaction
}
```

### CouponPayment (Paiement de coupons)
```typescript
{
  bondId: string;              // Référence à l'obligation
  paymentDate: number;         // Date du paiement
  totalAmount: string;         // Montant total distribué
  recipients: [{               // Liste des destinataires
    holderAddress: string;
    balance: string;
    amount: string;
    txHash: string;
    status: string;
  }];
  status: string;              // scheduled | processing | completed
}
```

## 🚀 Installation

### 1. Installer MongoDB

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

### 2. Installer les dépendances

```bash
cd backend
pnpm install
```

### 3. Configuration

Copiez le fichier d'environnement exemple :
```bash
cp .env.example .env
```

Éditez `.env` avec vos valeurs :
```env
MONGODB_URI=mongodb://localhost:27017/xrpl-bonds
XRPL_URL=wss://s.altnet.rippletest.net:51233
ISSUER_SEED=sYourIssuerSeedHere
PORT=3001
```

## 📝 Utilisation

### Démarrer le serveur

```bash
pnpm run dev
```

Le serveur démarre sur `http://localhost:3001` et :
- ✅ Se connecte à MongoDB
- ✅ Lance le monitoring des transactions XRPL
- ✅ Démarre le cron job de distribution des coupons

### Créer une obligation

```bash
pnpm run create-bond
```

Ou via l'API :
```bash
curl -X POST http://localhost:3001/api/bonds \
  -H "Content-Type: application/json" \
  -d '{
    "bondId": "BOND-001",
    "issuerAddress": "rYourAddress...",
    "issuerName": "Ma Société",
    "tokenCurrency": "000000000000000000000000544F4B454E",
    "tokenName": "MaSociété 5% 2030",
    "totalSupply": "1000000000000",
    "denomination": "1000000",
    "couponRate": 5.0,
    "couponFrequency": "quarterly",
    "issueDate": 1699401600000,
    "maturityDate": 1924992000000,
    "nextCouponDate": 1707264000000,
    "status": "active",
    "description": "Obligation corporate pour financement"
  }'
```

### Synchroniser les détenteurs

Si vous avez déjà émis des tokens sur XRPL, synchronisez les balances :

```bash
pnpm run sync-holders BOND-001
```

### Exécuter manuellement les paiements de coupons

```bash
pnpm run execute-coupons
```

## 🔌 API REST

### Obligations

#### `GET /api/bonds`
Liste toutes les obligations
```bash
curl http://localhost:3001/api/bonds
# Filtres: ?status=active&issuerAddress=rXXX
```

#### `GET /api/bonds/:bondId`
Récupère une obligation spécifique avec statistiques
```bash
curl http://localhost:3001/api/bonds/BOND-001
```

#### `POST /api/bonds`
Crée une nouvelle obligation (voir exemple ci-dessus)

#### `PATCH /api/bonds/:bondId`
Met à jour une obligation
```bash
curl -X PATCH http://localhost:3001/api/bonds/BOND-001 \
  -H "Content-Type: application/json" \
  -d '{"status": "matured"}'
```

### Détenteurs

#### `GET /api/bonds/:bondId/holders`
Liste les détenteurs d'une obligation
```bash
curl http://localhost:3001/api/bonds/BOND-001/holders
# Filtre: ?minBalance=1000000
```

#### `GET /api/holders/:address/bonds`
Récupère toutes les obligations détenues par une adresse
```bash
curl http://localhost:3001/api/bonds/holders/rYourAddress.../bonds
```

### Transactions

#### `GET /api/bonds/:bondId/transactions`
Liste les transactions d'une obligation
```bash
curl http://localhost:3001/api/bonds/BOND-001/transactions
# Filtres: ?type=transfer&limit=50&offset=0
```

### Coupons

#### `GET /api/bonds/:bondId/coupons`
Liste les paiements de coupons
```bash
curl http://localhost:3001/api/bonds/BOND-001/coupons
# Filtre: ?status=completed
```

## ⚙️ Fonctionnement

### 1. Monitoring des transactions

Le `BondTransactionMonitor` :
- Se connecte au réseau XRPL via WebSocket
- S'abonne aux comptes émetteurs des obligations actives
- Détecte automatiquement les transferts de tokens MPT
- Met à jour les balances des détenteurs dans MongoDB
- Enregistre toutes les transactions pour traçabilité

### 2. Distribution des coupons

Le `CouponDistributionService` :
- Vérifie périodiquement (toutes les heures) les paiements dus
- Calcule le montant de coupon pour chaque détenteur
- Exécute les paiements en USDC sur XRPL
- Met à jour les statuts dans MongoDB
- Planifie automatiquement le prochain paiement

### 3. Calcul des coupons

Formule :
```
Coupon par holder = (Balance × Denomination × CouponRate) / Périodes par an
```

Exemple :
- Détenteur : 1000 tokens
- Dénomination : 1 USDC (1000000 micro-units)
- Taux : 5% annuel
- Fréquence : Trimestrielle (4× par an)

```
Coupon = (1000 × 1000000 × 0.05) / 4 = 12500000 micro-units = 12.5 USDC
```

## 🔄 Flux de données

```
┌─────────────┐
│   XRPL      │
│  Ledger     │
└──────┬──────┘
       │ WebSocket
       │ (transactions)
       ↓
┌──────────────────┐
│  Transaction     │
│  Monitor         │
└──────┬───────────┘
       │
       │ Updates
       ↓
┌──────────────────┐
│   MongoDB        │
│  - Bonds         │
│  - BondHolders   │
│  - Transactions  │
│  - CouponPayments│
└──────┬───────────┘
       │
       │ Queries
       ↓
┌──────────────────┐       ┌──────────────┐
│   REST API       │◄──────│  Frontend    │
└──────┬───────────┘       └──────────────┘
       │
       ↓
┌──────────────────┐
│  Coupon          │
│  Distribution    │
│  Service         │
└──────┬───────────┘
       │
       │ USDC Payments
       ↓
┌──────────────────┐
│   XRPL           │
│  (to holders)    │
└──────────────────┘
```

## 🛡️ Sécurité

1. **Clés privées** : Stockez `ISSUER_SEED` de manière sécurisée (variables d'environnement, secrets manager)
2. **Base de données** : Utilisez une authentification MongoDB en production
3. **API** : Ajoutez une authentification JWT pour protéger les endpoints sensibles
4. **Validation** : Toutes les données sont validées par Mongoose schemas
5. **Transactions** : Utilisez des transactions MongoDB pour les opérations critiques

## 📊 Monitoring et logs

Le système log automatiquement :
- ✅ Connexions/déconnexions XRPL et MongoDB
- 📊 Détection de transactions
- 💰 Exécution de paiements de coupons
- ⚠️  Erreurs et alertes
- 🔄 Synchronisations

## 🧪 Tests

Pour tester le système complet :

1. Créez une obligation test
2. Émettez des tokens MPT sur XRPL Testnet
3. Transférez des tokens à des adresses test
4. Vérifiez que les holders sont mis à jour automatiquement
5. Déclenchez manuellement un paiement de coupon

## 📚 Ressources

- [XRPL Documentation](https://xrpl.org/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [xrpl.js Library](https://js.xrpl.org/)
- [Mongoose ODM](https://mongoosejs.com/)

## 🤝 Support

Pour toute question, consultez les logs du serveur ou les collections MongoDB.
