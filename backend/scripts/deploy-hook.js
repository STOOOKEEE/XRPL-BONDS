#!/usr/bin/env node

/**
 * Script de déploiement du Hook vault_manager sur Hooks Testnet v3
 * 
 * Usage: node scripts/deploy-hook.js
 */

const xrpl = require('xrpl');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const HOOKS_TESTNET = 'wss://hooks-testnet-v3.xrpl-labs.com';
const NETWORK_ID = 21338;

// Interface pour lire les entrées utilisateur
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('═'.repeat(70));
  console.log('🚀 DÉPLOIEMENT DU HOOK vault_manager.c');
  console.log('═'.repeat(70));
  
  let client;
  
  try {
    // 1. Connexion
    console.log('\n[1/6] 🌐 Connexion à Hooks Testnet v3...');
    client = new xrpl.Client(HOOKS_TESTNET);
    await client.connect();
    console.log('✅ Connecté à:', HOOKS_TESTNET);
    
    // 2. Wallet
    console.log('\n[2/6] 💼 Configuration du wallet...');
    console.log('\nOptions:');
    console.log('1. Créer un nouveau wallet');
    console.log('2. Utiliser un wallet existant (seed)');
    
    const choice = await question('\nChoix (1 ou 2): ');
    
    let wallet;
    if (choice.trim() === '1') {
      wallet = xrpl.Wallet.generate();
      console.log('\n✨ Nouveau wallet créé !');
      console.log('Adresse:', wallet.address);
      console.log('Seed:', wallet.seed);
      console.log('⚠️  GARDE CE SEED EN SÉCURITÉ !');
      
      console.log('\n💰 Fund ce wallet sur: https://hooks-testnet-v3.xrpl-labs.com/');
      console.log('Entre l\'adresse:', wallet.address);
      await question('\nAppuie sur ENTRÉE une fois le wallet fundé...');
      
    } else {
      const seed = await question('\nEntre le seed du wallet: ');
      wallet = xrpl.Wallet.fromSeed(seed.trim());
      console.log('✅ Wallet chargé:', wallet.address);
    }
    
    // Vérifier le balance
    try {
      const accountInfo = await client.request({
        command: 'account_info',
        account: wallet.address,
        ledger_index: 'validated'
      });
      const balance = Number(accountInfo.result.account_data.Balance) / 1000000;
      console.log('💰 Balance:', balance, 'XRP');
      
      if (balance < 100) {
        console.log('⚠️  Attention: Balance faible. Recommandé: au moins 100 XRP');
      }
    } catch (e) {
      console.log('⚠️  Impossible de vérifier le balance:', e.message);
    }
    
    // 3. Lire le Hook compilé
    console.log('\n[3/6] 📖 Lecture du Hook compilé...');
    const hexPath = path.join(__dirname, '../build/vault_manager.hex');
    
    if (!fs.existsSync(hexPath)) {
      throw new Error('Fichier .hex introuvable ! Compile d\'abord avec: bash compile-hook.sh hooks/vault_manager.c');
    }
    
    const hookHex = fs.readFileSync(hexPath, 'utf8').trim();
    console.log('✅ Hook chargé:', hookHex.length, 'caractères');
    console.log('   Taille:', Math.round(hookHex.length / 2), 'bytes');
    
    // 4. Confirmer le déploiement
    console.log('\n[4/6] ⚠️  Confirmer le déploiement...');
    console.log('Wallet:', wallet.address);
    console.log('Hook size:', Math.round(hookHex.length / 2), 'bytes');
    console.log('Network: Hooks Testnet v3');
    
    const confirm = await question('\nDéployer le Hook ? (oui/non): ');
    if (confirm.trim().toLowerCase() !== 'oui') {
      console.log('❌ Déploiement annulé');
      process.exit(0);
    }
    
    // 5. Déployer le Hook
    console.log('\n[5/6] 🚀 Déploiement du Hook...');
    
    const setHookTx = {
      TransactionType: 'SetHook',
      Account: wallet.address,
      Hooks: [{
        Hook: {
          CreateCode: hookHex.toUpperCase(),
          HookOn: '0000000000000000',      // Tous les types de transactions
          HookNamespace: '0'.repeat(64),    // Namespace par défaut
          HookApiVersion: 0,
          Flags: 1                          // hsfOVERRIDE
        }
      }],
      NetworkID: NETWORK_ID
    };
    
    console.log('📤 Préparation de la transaction...');
    const prepared = await client.autofill(setHookTx);
    
    console.log('✍️  Signature...');
    const signed = wallet.sign(prepared);
    
    console.log('📡 Envoi au réseau...');
    console.log('⏳ Cela peut prendre 10-30 secondes...');
    const result = await client.submitAndWait(signed.tx_blob);
    
    console.log('\n' + '═'.repeat(70));
    if (result.result.meta.TransactionResult === 'tesSUCCESS') {
      console.log('✅ HOOK DÉPLOYÉ AVEC SUCCÈS !');
      console.log('═'.repeat(70));
      console.log('\n📊 Détails:');
      console.log('Hash de transaction:', result.result.hash);
      console.log('Ledger:', result.result.ledger_index);
      console.log('Compte Hook:', wallet.address);
      console.log('\n🔗 Explorer:');
      console.log(`https://hooks-testnet-v3.xrpl-labs.com/tx/${result.result.hash}`);
      
    } else {
      console.log('❌ DÉPLOIEMENT ÉCHOUÉ');
      console.log('═'.repeat(70));
      console.log('Code d\'erreur:', result.result.meta.TransactionResult);
      console.log('Détails:', JSON.stringify(result.result, null, 2));
    }
    
    // 6. Initialisation (optionnel)
    console.log('\n[6/6] ⚙️  Initialisation du Hook State...');
    const initChoice = await question('\nInitialiser target_amount = 10,000 XRP ? (oui/non): ');
    
    if (initChoice.trim().toLowerCase() === 'oui') {
      const targetValue = '10000000000';  // 10,000 XRP en drops
      
      const invokeTx = {
        TransactionType: 'Invoke',
        Account: wallet.address,
        Destination: wallet.address,
        HookParameters: [{
          HookParameter: {
            HookParameterName: Buffer.from('target_amount').toString('hex').toUpperCase(),
            HookParameterValue: Buffer.from(targetValue).toString('hex').toUpperCase()
          }
        }],
        NetworkID: NETWORK_ID
      };
      
      console.log('📤 Initialisation...');
      const initPrepared = await client.autofill(invokeTx);
      const initSigned = wallet.sign(initPrepared);
      const initResult = await client.submitAndWait(initSigned.tx_blob);
      
      if (initResult.result.meta.TransactionResult === 'tesSUCCESS') {
        console.log('✅ Hook State initialisé !');
        console.log('   target_amount = 10,000 XRP');
      } else {
        console.log('⚠️  Initialisation échouée:', initResult.result.meta.TransactionResult);
      }
    }
    
    // Résumé final
    console.log('\n' + '═'.repeat(70));
    console.log('🎉 DÉPLOIEMENT TERMINÉ !');
    console.log('═'.repeat(70));
    console.log('\n📝 Informations importantes:');
    console.log('Adresse du Hook:', wallet.address);
    console.log('Seed (GARDE SECRET):', wallet.seed);
    console.log('\n🧪 Tester le Hook:');
    console.log('1. Envoie un paiement XRP à cette adresse');
    console.log('2. Le Hook trackera automatiquement les contributions');
    console.log('3. Quand total >= target → ready_to_finalize = "1"');
    console.log('\n📊 Vérifier le Hook State:');
    console.log(`node -e "const xrpl = require('xrpl'); (async () => {
  const c = new xrpl.Client('${HOOKS_TESTNET}');
  await c.connect();
  const r = await c.request({command: 'account_objects', account: '${wallet.address}', type: 'hook_state'});
  console.log(JSON.stringify(r.result, null, 2));
  await c.disconnect();
})()"`);
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error(error.stack);
  } finally {
    rl.close();
    if (client && client.isConnected()) {
      console.log('\n🔌 Déconnexion...');
      await client.disconnect();
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
