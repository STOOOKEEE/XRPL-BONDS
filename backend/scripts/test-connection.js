#!/usr/bin/env node

/**
 * Script de test simplifié - Connexion et préparation
 * 
 * Ce script teste uniquement :
 * 1. La connexion à Hooks Testnet v3
 * 2. La création de wallets de test
 * 3. La structure de transaction SetHook (sans déployer)
 */

const xrpl = require('xrpl');

const HOOKS_TESTNET = 'wss://hooks-testnet-v3.xrpl-labs.com';
const NETWORK_ID = 21338;

async function main() {
  console.log('🧪 Test de Connexion à Hooks Testnet v3\n');
  console.log('═'.repeat(60));
  
  let client;
  
  try {
    // 1. Connexion
    console.log('\n[1/4] 🌐 Connexion au réseau...');
    client = new xrpl.Client(HOOKS_TESTNET);
    await client.connect();
    console.log('✅ Connecté à:', HOOKS_TESTNET);
    
    // Vérifier la version du serveur (sans API version pour Hooks Testnet)
    try {
      const serverInfo = await client.request({ command: 'server_state' });
      console.log('Server state:', serverInfo.result.state.server_state);
    } catch (e) {
      console.log('⚠️  Server info non disponible (normal pour Hooks Testnet)');
    }
    console.log('Network ID:', NETWORK_ID);
    
    // 2. Créer un wallet émetteur
    console.log('\n[2/4] 💼 Création du wallet émetteur...');
    const issuerWallet = xrpl.Wallet.generate();
    console.log('Adresse:', issuerWallet.address);
    console.log('Seed (GARDE SECRET):', issuerWallet.seed);
    
    // Funder le wallet manuellement
    console.log('\n💰 Pour funder ce wallet:');
    console.log('1. Va sur: https://hooks-testnet-v3.xrpl-labs.com/');
    console.log('2. Entre l\'adresse:', issuerWallet.address);
    console.log('3. Clique sur "Get XRP"');
    console.log('\n⏳ Appuie sur ENTRÉE une fois le wallet fundé...');
    
    // Attendre que l'utilisateur appuie sur ENTRÉE
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });
    
    // Vérifier le balance
    const accountInfo = await client.request({
      command: 'account_info',
      account: issuerWallet.address,
      ledger_index: 'validated'
    });
    
    const balance = Number(accountInfo.result.account_data.Balance) / 1000000;
    console.log('✅ Wallet fundé avec', balance, 'XRP');
    
    // 3. Créer des wallets investisseurs
    console.log('\n[3/4] 👥 Création de 3 wallets investisseurs...');
    const investors = [];
    
    for (let i = 1; i <= 3; i++) {
      const wallet = xrpl.Wallet.generate();
      investors.push(wallet);
      
      console.log(`\nInvestor ${i}:`);
      console.log('  Adresse:', wallet.address);
      console.log('  Fund sur: https://hooks-testnet-v3.xrpl-labs.com/');
      console.log('  Appuie sur ENTRÉE une fois fundé...');
      
      await new Promise(resolve => {
        process.stdin.once('data', () => resolve());
      });
      
      const accInfo = await client.request({
        command: 'account_info',
        account: wallet.address,
        ledger_index: 'validated'
      });
      
      const bal = Number(accInfo.result.account_data.Balance) / 1000000;
      console.log('  ✅ Balance:', bal, 'XRP');
    }
    
    // 4. Montrer la structure d'une transaction SetHook (sans l'envoyer)
    console.log('\n[4/4] 📝 Structure de la transaction SetHook:');
    
    const setHookTx = {
      TransactionType: 'SetHook',
      Account: issuerWallet.address,
      Hooks: [
        {
          Hook: {
            CreateCode: 'VOTRE_HOOK_HEX_ICI'.toUpperCase(),
            HookOn: '0000000000000000',
            HookNamespace: '0'.repeat(64),
            HookApiVersion: 0,
            Flags: 1
          }
        }
      ],
      NetworkID: NETWORK_ID
    };
    
    console.log(JSON.stringify(setHookTx, null, 2));
    
    // 5. Test d'une transaction Payment simple (pour vérifier que tout fonctionne)
    console.log('\n[5/5] 💸 Test d\'un paiement simple...');
    
    const paymentTx = {
      TransactionType: 'Payment',
      Account: investors[0].address,
      Destination: issuerWallet.address,
      Amount: '1000000', // 1 XRP
      NetworkID: NETWORK_ID
    };
    
    const prepared = await client.autofill(paymentTx);
    const signed = investors[0].sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    
    if (result.result.meta.TransactionResult === 'tesSUCCESS') {
      console.log('✅ Paiement test réussi !');
      console.log('Hash:', result.result.hash);
      console.log('Ledger:', result.result.ledger_index);
    } else {
      console.log('❌ Paiement échoué:', result.result.meta.TransactionResult);
    }
    
    // Résumé
    console.log('\n═'.repeat(60));
    console.log('✅ Test terminé avec succès !\n');
    console.log('📋 Wallets créés:');
    console.log('   Émetteur:', issuerWallet.address);
    investors.forEach((inv, i) => {
      console.log(`   Investor ${i + 1}:`, inv.address);
    });
    
    console.log('\n📝 Prochaines étapes:');
    console.log('1. Remplace les placeholders dans vault_manager.c');
    console.log('2. Compile le Hook: bash compile-hook.sh hooks/vault_manager.c');
    console.log('3. Déploie avec: node scripts/test-vault-hook.js');
    console.log('4. Utilise ces wallets pour tester les contributions');
    
    // Sauvegarder les wallets dans un fichier (pour réutilisation)
    const wallets = {
      issuer: {
        address: issuerWallet.address,
        seed: issuerWallet.seed
      },
      investors: investors.map((inv, i) => ({
        id: i + 1,
        address: inv.address,
        seed: inv.seed
      }))
    };
    
    const fs = require('fs');
    const path = require('path');
    const walletsPath = path.join(__dirname, '../test-wallets.json');
    fs.writeFileSync(walletsPath, JSON.stringify(wallets, null, 2));
    console.log('\n💾 Wallets sauvegardés dans:', walletsPath);
    console.log('⚠️  ATTENTION : Ce fichier contient les seeds privés !');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error(error.stack);
  } finally {
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
