#!/usr/bin/env node

/**
 * Script de test pour le Hook vault_manager
 * 
 * Ce script permet de :
 * 1. Tester localement la logique du Hook
 * 2. Déployer le Hook sur Hooks Testnet v3
 * 3. Simuler des contributions d'investisseurs
 * 4. Vérifier la finalisation et distribution des tokens
 */

const xrpl = require('xrpl');
const fs = require('fs');
const path = require('path');

// Configuration
const HOOKS_TESTNET = 'wss://hooks-testnet-v3.xrpl-labs.com';
const NETWORK_ID = 21338;

// Adresses de test (à générer ou utiliser des wallets existants)
let issuerWallet;
let investor1Wallet;
let investor2Wallet;
let investor3Wallet;

/**
 * Étape 1 : Compiler le Hook (optionnel, suppose déjà compilé)
 */
async function compileHook() {
  console.log('📦 Compilation du Hook...');
  
  const { execSync } = require('child_process');
  
  try {
    execSync('bash compile-hook.sh hooks/vault_manager.c', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    console.log('✅ Hook compilé avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur de compilation:', error.message);
    return false;
  }
}

/**
 * Étape 2 : Lire le fichier .hex compilé
 */
function readHookHex() {
  console.log('📖 Lecture du Hook compilé...');
  
  const hexPath = path.join(__dirname, '../build/vault_manager.hex');
  
  if (!fs.existsSync(hexPath)) {
    throw new Error('Fichier .hex introuvable. Compilez d\'abord le Hook.');
  }
  
  const hexContent = fs.readFileSync(hexPath, 'utf8').trim();
  console.log(`✅ Hook chargé (${hexContent.length} caractères)`);
  
  return hexContent;
}

/**
 * Étape 3 : Se connecter à Hooks Testnet v3
 */
async function connectToTestnet() {
  console.log('🌐 Connexion à Hooks Testnet v3...');
  
  const client = new xrpl.Client(HOOKS_TESTNET);
  await client.connect();
  
  console.log('✅ Connecté à:', HOOKS_TESTNET);
  console.log('Network ID:', NETWORK_ID);
  
  return client;
}

/**
 * Étape 4 : Créer des wallets de test et les funder
 */
async function createTestWallets(client) {
  console.log('\n💼 Création des wallets de test...');
  
  // Wallet émetteur (celui qui aura le Hook)
  issuerWallet = xrpl.Wallet.generate();
  console.log('Issuer:', issuerWallet.address);
  
  // Funder le wallet émetteur
  console.log('💰 Funding issuer wallet...');
  const fundResult = await client.fundWallet(issuerWallet);
  console.log('✅ Issuer funded:', fundResult.balance, 'XRP');
  
  // Wallets investisseurs
  investor1Wallet = xrpl.Wallet.generate();
  investor2Wallet = xrpl.Wallet.generate();
  investor3Wallet = xrpl.Wallet.generate();
  
  console.log('Investor 1:', investor1Wallet.address);
  console.log('Investor 2:', investor2Wallet.address);
  console.log('Investor 3:', investor3Wallet.address);
  
  // Funder les investisseurs
  for (const wallet of [investor1Wallet, investor2Wallet, investor3Wallet]) {
    const result = await client.fundWallet(wallet);
    console.log(`✅ ${wallet.address} funded:`, result.balance, 'XRP');
  }
  
  return { issuerWallet, investor1Wallet, investor2Wallet, investor3Wallet };
}

/**
 * Étape 5 : Déployer le Hook sur le compte émetteur
 */
async function deployHook(client, hookHex) {
  console.log('\n🚀 Déploiement du Hook sur le compte émetteur...');
  
  // Transaction SetHook pour installer le Hook
  const setHookTx = {
    TransactionType: 'SetHook',
    Account: issuerWallet.address,
    Hooks: [
      {
        Hook: {
          CreateCode: hookHex.toUpperCase(),
          HookOn: '0000000000000000', // Écouter tous les types de transactions
          HookNamespace: '0'.repeat(64), // Namespace par défaut
          HookApiVersion: 0,
          Flags: 1 // hsfOVERRIDE
        }
      }
    ],
    NetworkID: NETWORK_ID
  };
  
  try {
    console.log('📤 Envoi de la transaction SetHook...');
    const prepared = await client.autofill(setHookTx);
    const signed = issuerWallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    
    if (result.result.meta.TransactionResult === 'tesSUCCESS') {
      console.log('✅ Hook déployé avec succès !');
      console.log('Hash de transaction:', result.result.hash);
      return true;
    } else {
      console.error('❌ Échec du déploiement:', result.result.meta.TransactionResult);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur lors du déploiement:', error.message);
    return false;
  }
}

/**
 * Étape 6 : Initialiser le Hook State (paramètres du vault)
 */
async function initializeHookState(client) {
  console.log('\n⚙️ Initialisation du Hook State...');
  
  // Définir le target_amount = 10,000 USDC (10,000,000,000 drops)
  const targetAmount = Buffer.alloc(8);
  targetAmount.writeBigUInt64BE(BigInt('10000000000'));
  
  const setHookStateTx = {
    TransactionType: 'Invoke',
    Account: issuerWallet.address,
    Destination: issuerWallet.address,
    HookParameters: [
      {
        HookParameter: {
          HookParameterName: Buffer.from('target_amount').toString('hex').toUpperCase(),
          HookParameterValue: targetAmount.toString('hex').toUpperCase()
        }
      }
    ],
    NetworkID: NETWORK_ID
  };
  
  try {
    const prepared = await client.autofill(setHookStateTx);
    const signed = issuerWallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    
    if (result.result.meta.TransactionResult === 'tesSUCCESS') {
      console.log('✅ Hook State initialisé');
      console.log('Target amount: 10,000 USDC');
      return true;
    } else {
      console.error('❌ Échec de l\'initialisation');
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return false;
  }
}

/**
 * Étape 7 : Simuler des contributions
 */
async function simulateContributions(client) {
  console.log('\n💸 Simulation des contributions...');
  
  // Contributions de test (en drops XRP pour simplifier, 
  // dans la vraie version ce serait de l'USDC IOU)
  const contributions = [
    { wallet: investor1Wallet, amount: '3000000000', name: 'Investor 1' }, // 3000 USDC
    { wallet: investor2Wallet, amount: '4000000000', name: 'Investor 2' }, // 4000 USDC
    { wallet: investor3Wallet, amount: '3000000000', name: 'Investor 3' }  // 3000 USDC
  ];
  
  for (const contrib of contributions) {
    console.log(`\n📨 ${contrib.name} contribue ${parseInt(contrib.amount) / 1000000} USDC...`);
    
    const paymentTx = {
      TransactionType: 'Payment',
      Account: contrib.wallet.address,
      Destination: issuerWallet.address,
      Amount: contrib.amount, // En drops
      NetworkID: NETWORK_ID
    };
    
    try {
      const prepared = await client.autofill(paymentTx);
      const signed = contrib.wallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);
      
      if (result.result.meta.TransactionResult === 'tesSUCCESS') {
        console.log('✅ Contribution acceptée');
        console.log('Hash:', result.result.hash);
        
        // Attendre un peu pour voir les effets du Hook
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.error('❌ Contribution rejetée:', result.result.meta.TransactionResult);
      }
    } catch (error) {
      console.error('❌ Erreur:', error.message);
    }
  }
  
  console.log('\n✅ Total contribué: 10,000 USDC → Vault devrait être finalisé !');
}

/**
 * Étape 8 : Vérifier le Hook State
 */
async function checkHookState(client) {
  console.log('\n🔍 Vérification du Hook State...');
  
  try {
    const accountObjects = await client.request({
      command: 'account_objects',
      account: issuerWallet.address,
      type: 'hook_state'
    });
    
    console.log('📊 Hook State actuel:');
    console.log(JSON.stringify(accountObjects.result.account_objects, null, 2));
    
    return accountObjects.result.account_objects;
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return null;
  }
}

/**
 * Script principal
 */
async function main() {
  console.log('🎯 Test du Hook vault_manager.c\n');
  console.log('═'.repeat(60));
  
  let client;
  
  try {
    // 1. Compiler le Hook (optionnel)
    console.log('\n[1/8] Compilation du Hook');
    console.log('⚠️  Note: Le Hook utilise des placeholders SDK');
    console.log('⚠️  Pour une vraie compilation, remplace les fonctions par le SDK officiel');
    // await compileHook(); // Commenté car les placeholders ne compileront pas
    
    // 2. Lire le Hook hex (skip si pas compilé)
    console.log('\n[2/8] Lecture du Hook compilé');
    console.log('⚠️  Skipped - Hook pas encore compilable avec placeholders');
    // const hookHex = readHookHex();
    
    // 3. Connexion à Testnet
    console.log('\n[3/8] Connexion à Hooks Testnet v3');
    client = await connectToTestnet();
    
    // 4. Créer des wallets de test
    console.log('\n[4/8] Création des wallets de test');
    await createTestWallets(client);
    
    // 5. Déployer le Hook (skip car pas compilé)
    console.log('\n[5/8] Déploiement du Hook');
    console.log('⚠️  Skipped - Nécessite un Hook compilé');
    // await deployHook(client, hookHex);
    
    // 6. Initialiser le Hook State (skip)
    console.log('\n[6/8] Initialisation du Hook State');
    console.log('⚠️  Skipped - Hook pas déployé');
    // await initializeHookState(client);
    
    // 7. Simuler des contributions (skip)
    console.log('\n[7/8] Simulation des contributions');
    console.log('⚠️  Skipped - Hook pas déployé');
    // await simulateContributions(client);
    
    // 8. Vérifier le Hook State (skip)
    console.log('\n[8/8] Vérification du Hook State');
    console.log('⚠️  Skipped - Hook pas déployé');
    // await checkHookState(client);
    
    console.log('\n═'.repeat(60));
    console.log('✅ Test terminé (mode démo)');
    console.log('\n📝 Pour un vrai test:');
    console.log('1. Remplace les placeholders dans vault_manager.c par le vrai SDK');
    console.log('2. Compile avec: bash compile-hook.sh hooks/vault_manager.c');
    console.log('3. Décommente les étapes dans ce script');
    console.log('4. Relance: node scripts/test-vault-hook.js');
    
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error);
  } finally {
    if (client && client.isConnected()) {
      console.log('\n🔌 Déconnexion...');
      await client.disconnect();
    }
  }
}

// Lancer le script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
