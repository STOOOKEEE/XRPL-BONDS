# Tests d'intégration Escrow On-Chain

## 🧪 Test complet on-chain

Le fichier `escrow-onchain-integration.test.ts` effectue un **test d'intégration complet** avec de vraies transactions XRPL sur le testnet.

### Ce qui est testé

#### ✅ Fonctionnalités validées

1. **Création de campagne escrow**

   - Wallets créés et fundés automatiquement via le faucet
   - Configuration: objectif, cap, deadline, trésor

2. **Investissements valides**

   - ✅ Acceptation d'investissements avant la deadline
   - ✅ Vérification que les investissements ne dépassent pas le cap
   - ✅ Transactions XRPL réelles avec paiements XRP

3. **Rejet d'investissements**

   - ❌ Rejet si dépassement du cap
   - ❌ Rejet si après la deadline
   - ✅ Vérification des raisons de rejet

4. **Cap atteint**

   - ✅ Détection quand l'objectif/cap est atteint exactement
   - ✅ Flag `objective_reached = true`

5. **Campagne réussie**

   - ✅ Transfert automatique vers le trésor
   - ✅ Vérification des balances on-chain après succès

6. **Campagne échouée**

   - ✅ Génération automatique des remboursements
   - ✅ Liste complète des investisseurs à rembourser
   - ✅ Montants corrects pour chaque remboursement

7. **Vérifications on-chain**
   - ✅ Balances XRP vérifiées avant/après
   - ✅ Transactions XRPL confirmées (tesSUCCESS)
   - ✅ Hash de transaction retourné

### 🚀 Lancer le test

```bash
# Depuis le dossier backend/
npm run test-escrow-onchain
```

### ⚠️ Prérequis

1. **Wasm compilé**

   ```bash
   npm run build-escrow-wasm
   ```

2. **Node.js + TypeScript**

   - Dependencies déjà installées via `npm install`

3. **Accès Internet**
   - Pour se connecter au testnet XRPL
   - Pour utiliser le faucet (creation de wallets)

### 📊 Durée du test

- **~2-3 minutes** (incluant les délais de validation des transactions)
- Le test attend 5 secondes entre chaque transaction pour la validation on-chain

### 🎯 Résultat attendu

Si tout fonctionne correctement, vous verrez:

```
================================================================================
🚀 ESCROW ON-CHAIN INTEGRATION TEST - DÉBUT
================================================================================

📋 PHASE 1: SETUP - Création des wallets
🔑 Creating Treasury (trésor de la campagne)...
✅ Treasury funded: rXXXXXXXXXXXXXXXXXXXX
...

📋 PHASE 2: CRÉATION DE LA CAMPAGNE ESCROW
📊 Paramètres de la campagne:
   Objectif: 500 XRP
   Cap: 500 XRP
   Deadline: 2025-11-08T12:34:56.000Z
...

📋 PHASE 3: INVESTISSEMENTS VALIDES
💸 Investissement 1: 150 XRP par Investor 1
   ✅ Transaction: ABCD1234...
   ✅ Investissement accepté! Total levé: 150 XRP
...

📋 PHASE 4: INVESTISSEMENT REJETÉ (dépassement du cap)
   ✅ CORRECT: Investissement rejeté (raison: would exceed cap)
...

📋 PHASE 7: TEST CAMPAGNE ÉCHOUÉE → REMBOURSEMENTS
   ✅ CORRECT: Campagne échouée (objectif non atteint)
   💸 Remboursements à effectuer: 2
      → rInvestor1...: 100 XRP
      → rInvestor2...: 200 XRP
...

================================================================================
✅ TOUS LES TESTS ON-CHAIN RÉUSSIS!
================================================================================

📊 Récapitulatif des tests:
   ✅ Création de campagne escrow
   ✅ Investissements valides acceptés (2 investissements)
   ✅ Rejet d'investissement dépassant le cap
   ✅ Cap atteint exactement → objectif reached
   ✅ Vérification des balances on-chain
   ✅ Campagne échouée → génération des remboursements
   ✅ Rejet d'investissement après deadline

🎉 Toutes les conditions de l'escrow fonctionnent correctement on-chain!
```

### 🔍 En cas d'erreur

Si le test échoue, vérifier:

1. **Connexion au testnet**

   ```bash
   # Tester manuellement
   curl -X POST https://s.devnet.rippletest.net:51234 \
     -H "Content-Type: application/json" \
     -d '{"method":"server_info"}'
   ```

2. **Faucet disponible**

   ```bash
   curl https://faucet.devnet.rippletest.net/accounts
   ```

3. **Wasm compilé**
   ```bash
   ls -la pkg/escrow/escrow_wasm.js
   # Devrait exister, sinon: npm run build-escrow-wasm
   ```

### 🧑‍💻 Modifier le test

Pour ajuster les paramètres:

```typescript
// Dans escrow-onchain-integration.test.ts

// Modifier l'objectif de la campagne
const objective = BigInt(1_000_000_000); // 1000 XRP au lieu de 500

// Modifier la deadline (en secondes)
const deadline = now + 600; // 10 minutes au lieu de 5

// Modifier les montants d'investissement
const inv1Amount = BigInt(300_000_000); // 300 XRP
```

### 📝 Logs détaillés

Chaque phase du test affiche:

- 🔑 Création des wallets (adresses + balances)
- 💸 Transactions XRPL (hash + montants)
- 📊 Résultats wasm (accepted/rejected + raisons)
- 💰 Balances avant/après
- ✅ Validations des conditions

Tous les logs sont horodatés et formatés pour faciliter le debug.

### 🚨 Important

- Ce test utilise le **testnet XRPL** (pas de vrais fonds)
- Les wallets sont créés temporairement (pas sauvegardés)
- Les XRP sont "fake" (fournis par le faucet)
- **Ne pas utiliser sur mainnet!**

---

**Note**: Pour des tests plus rapides sans on-chain, utiliser plutôt:

```bash
npm run example-escrow  # Tests logiques uniquement (wasm)
```
