# Smart Escrow Campaign System

Système d'escrow intelligent en Rust/WebAssembly qui gère des campagnes d'investissement avec stablecoins (RLUSD, USDC, etc.) et distribution automatique de tokens.

## 🎯 Fonctionnalités

### ✅ Implémentées

1. **Acceptation de stablecoins** (RLUSD, USDC, ou autre)

   - Montants en entiers uniquement (smallest units)
   - Ratio 1:1 avec les tokens distribués

2. **Plafond (cap) de campagne**

   - Rejette automatiquement les investissements qui dépasseraient le plafond
   - Quand le plafond est atteint exactement → transfert immédiat vers le trésor

3. **Deadline (1 mois ou personnalisée)**

   - Accepte les investissements uniquement avant la deadline
   - Finalisation automatique après la deadline

4. **Remboursements automatiques**

   - Si objectif non atteint à la deadline → remboursement de tous les investisseurs
   - Liste complète des refunds générée par le Rust

5. **Logique déterministe en Rust**
   - Toute la validation et la logique métier en Rust/wasm
   - Signature et soumission des transactions restent en Node/xrpl.js

## 📁 Structure

```
backend/
├── escrow-wasm/              # Crate Rust compilé en wasm
│   ├── Cargo.toml
│   ├── src/lib.rs            # Logique escrow (process_investment, finalize_campaign)
│   └── README.md
├── pkg/escrow/               # Package wasm généré (après build)
│   ├── escrow_wasm.js
│   ├── escrow_wasm_bg.wasm
│   └── escrow_wasm.d.ts
└── src/
    ├── examples/
    │   └── escrow-campaign-example.ts  # Exemple complet avec tests
    └── services/
        └── EscrowMonitor.ts            # (TODO: intégration wasm)
```

## 🚀 Utilisation

### 1. Build le wasm

```bash
cd backend
npm run build-escrow-wasm
```

Génère `backend/pkg/escrow/` importable depuis Node/TS.

### 2. Lancer l'exemple

```bash
npm run example-escrow
```

Démontre :

- Création de campagne
- Investissements acceptés
- Objectif atteint → envoi au trésor
- Investissement rejeté (dépasse le cap)
- Finalisation avec remboursements

### 3. API Rust/wasm

#### `create_campaign_state(...)`

Crée un nouvel état de campagne.

**Paramètres :**

- `campaign_id`: string
- `max_value`: bigint (smallest units, e.g., 10_000_000 = 10 RLUSD si 6 décimales)
- `deadline_unix`: bigint (timestamp Unix en secondes)
- `treasury_address`: string (adresse XRPL)
- `investment_currency`: string (ex: "RLUSD", "USDC")
- `investment_issuer`: string (adresse issuer du stablecoin)
- `token_currency`: string (ex: "BOND")
- `token_issuer`: string (adresse issuer du token)

**Retour :** `CampaignState` (objet JS)

#### `process_investment(state_json, sender_address, stablecoin_amount, current_time_unix)`

Traite un investissement.

**Paramètres :**

- `state_json`: string (JSON.stringify du state avec BigInt convertis en Number)
- `sender_address`: string
- `stablecoin_amount`: bigint (smallest units)
- `current_time_unix`: bigint

**Retour :** `InvestmentResult`

```typescript
{
  accepted: boolean,
  reason: string,
  token_amount: bigint,        // Montant de tokens à envoyer (1:1)
  updated_state?: CampaignState,
  send_to_treasury: boolean    // true si objectif atteint pile
}
```

#### `finalize_campaign(state_json, current_time_unix)`

Finalise la campagne après la deadline.

**Paramètres :**

- `state_json`: string
- `current_time_unix`: bigint

**Retour :** `FinalizeResult`

```typescript
{
  success: boolean,
  objective_reached: boolean,
  refunds: [address, amount][],  // Liste des remboursements si échec
  treasury_amount: bigint         // Montant à envoyer au trésor si succès
}
```

### 4. Helper pour sérialiser BigInt

```typescript
function serializeState(state: any): string {
  return JSON.stringify(state, (key, value) =>
    typeof value === "bigint" ? Number(value) : value
  );
}
```

## 📊 Exemple de flux complet

1. **Création campagne**

   ```typescript
   const state = escrow.create_campaign_state(
     "CAMP-001",
     BigInt(10_000_000), // 10 RLUSD max
     BigInt(Date.now() / 1000 + 30 * 24 * 3600), // +30 jours
     treasuryAddr,
     "RLUSD",
     rlusdIssuer,
     "BOND",
     bondIssuer
   );
   ```

2. **Investissement reçu** (détecté par EscrowMonitor ou webhook)

   ```typescript
   const result = escrow.process_investment(
     serializeState(state),
     investorAddr,
     BigInt(2_000_000), // 2 RLUSD
     BigInt(Date.now() / 1000)
   );

   if (result.accepted) {
     // Envoyer result.token_amount tokens à investorAddr via xrpl.js
     await sendTokens(investorAddr, result.token_amount);

     // Persister result.updated_state dans MongoDB
     await saveCampaignState(result.updated_state);

     if (result.send_to_treasury) {
       // Objectif atteint → envoyer fonds au trésor
       await sendToTreasury(state.treasury_address, state.current_raised);
     }
   }
   ```

3. **Finalisation (cron après deadline)**

   ```typescript
   const finalize = escrow.finalize_campaign(
     serializeState(state),
     BigInt(Date.now() / 1000)
   );

   if (finalize.success) {
     if (finalize.objective_reached) {
       // Envoyer au trésor
       await sendToTreasury(treasury, finalize.treasury_amount);
     } else {
       // Rembourser les investisseurs
       for (const [addr, amount] of finalize.refunds) {
         await refundInvestor(addr, amount, stablecoin);
       }
     }
   }
   ```

## 🔄 Prochaines étapes

- [ ] Intégrer dans `EscrowMonitor.ts` pour détecter les transactions XRPL
- [ ] Ajouter MongoDB pour persister les états de campagne
- [ ] Implémenter `sendTokens()` et `refundInvestor()` avec xrpl.js
- [ ] Cron job pour vérifier les deadlines et finaliser automatiquement
- [ ] Tests unitaires Rust (cargo test)
- [ ] Tests d'intégration bout-en-bout

## 🛠️ Prérequis

- Rust stable + `wasm32-unknown-unknown` target
- `wasm-pack` (`cargo install wasm-pack` ou `brew install wasm-pack`)
- Node.js + npm
- TypeScript + ts-node

## 📝 Notes importantes

- Les BigInt doivent être convertis en Number pour la sérialisation JSON → Rust u64
- Les montants sont toujours en **smallest units** (e.g., 1_000_000 = 1 RLUSD si 6 décimales)
- Le ratio token:stablecoin est toujours **1:1** (nombres entiers uniquement)
- Rust fait uniquement la validation/logique — xrpl.js gère la signature et l'envoi
- L'état de campagne doit être persisté côté Node (MongoDB, JSON, etc.)

## ✅ Tests effectués

```bash
npm run example-escrow
```

- ✅ Création campagne
- ✅ Investissement accepté (sous le cap)
- ✅ Objectif atteint exactement → flag `send_to_treasury`
- ✅ Investissement rejeté (dépasse le cap)
- ✅ Finalisation après deadline → liste de refunds générée
- ✅ Support RLUSD et USDC (générique via `investment_currency`)
