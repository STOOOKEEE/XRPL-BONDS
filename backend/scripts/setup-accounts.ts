/**
 * setup-accounts.ts
 * Crée les comptes nécessaires sur Hooks Testnet v3
 */

import { Client, Wallet } from 'xrpl';

const HOOKS_TESTNET = 'wss://hooks-testnet-v3.xrpl-labs.com';

async function setupAccounts() {
  console.log('🚀 Setting up accounts on Hooks Testnet v3\n');
  
  const client = new Client(HOOKS_TESTNET);
  await client.connect();
  console.log('✅ Connected to Hooks Testnet v3\n');
  
  // ============================================
  // 1. Hook Account (où le Hook sera déployé)
  // ============================================
  console.log('1️⃣  Creating Hook Account...');
  const hookWallet = (await client.fundWallet()).wallet;
  console.log('   Address:', hookWallet.classicAddress);
  console.log('   Secret:', hookWallet.seed);
  console.log('   ⚠️  SAVE THIS SECRET!\n');
  
  // ============================================
  // 2. Company Account (recevra les fonds si succès)
  // ============================================
  console.log('2️⃣  Creating Company Account...');
  const companyWallet = (await client.fundWallet()).wallet;
  console.log('   Address:', companyWallet.classicAddress);
  console.log('   Secret:', companyWallet.seed);
  console.log('   ⚠️  SAVE THIS SECRET!\n');
  
  // ============================================
  // 3. Investor 1 (pour tester)
  // ============================================
  console.log('3️⃣  Creating Investor 1...');
  const investor1 = (await client.fundWallet()).wallet;
  console.log('   Address:', investor1.classicAddress);
  console.log('   Secret:', investor1.seed);
  console.log('   ⚠️  SAVE THIS SECRET!\n');
  
  // ============================================
  // 4. Investor 2 (pour tester)
  // ============================================
  console.log('4️⃣  Creating Investor 2...');
  const investor2 = (await client.fundWallet()).wallet;
  console.log('   Address:', investor2.classicAddress);
  console.log('   Secret:', investor2.seed);
  console.log('   ⚠️  SAVE THIS SECRET!\n');
  
  await client.disconnect();
  
  console.log('\n📝 COPY THESE VALUES TO YOUR .env FILE:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`HOOK_ACCOUNT_SECRET=${hookWallet.seed}`);
  console.log(`HOOK_ACCOUNT_ADDRESS=${hookWallet.classicAddress}`);
  console.log('');
  console.log(`COMPANY_SECRET=${companyWallet.seed}`);
  console.log(`COMPANY_ADDRESS=${companyWallet.classicAddress}`);
  console.log('');
  console.log(`INVESTOR1_SECRET=${investor1.seed}`);
  console.log(`INVESTOR1_ADDRESS=${investor1.classicAddress}`);
  console.log('');
  console.log(`INVESTOR2_SECRET=${investor2.seed}`);
  console.log(`INVESTOR2_ADDRESS=${investor2.classicAddress}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

setupAccounts().catch(console.error);
