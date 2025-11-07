/**
 * deploy-hook.ts
 * Déploie le Hook vault_fundraiser.c sur Hooks Testnet v3
 */

import { Client, Wallet } from 'xrpl';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Configuration - REMPLACER PAR TES VALEURS
// ============================================================================

const HOOKS_TESTNET = 'wss://hooks-testnet-v3.xrpl-labs.com';

// Secrets récupérés depuis setup-accounts.ts
const HOOK_ACCOUNT_SECRET = 'sXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'; // À REMPLACER
const COMPANY_ADDRESS = 'rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';   // À REMPLACER

// Configuration de la levée de fonds
const FUNDRAISING_CONFIG = {
  objectif: '1000000000000',      // 1,000,000 USDC (en micro-units, 6 décimales)
  deadline: '1767225600',         // 1er décembre 2025, 00:00:00 UTC
  status: '1',                    // STATUS_ACTIVE
  totalRaised: '0',
  mpTokenID: '0000000000000000000000000000000000000000000000000000000000000000', // Placeholder
};

// ============================================================================
// Helper Functions
// ============================================================================

function addressToAccountID(address: string): string {
  try {
    // Utilise ripple-address-codec pour convertir
    const codec = require('ripple-address-codec');
    const accountID = codec.decodeAccountID(address);
    return Buffer.from(accountID).toString('hex').toUpperCase();
  } catch (error) {
    console.error('❌ Error converting address:', error);
    throw error;
  }
}

function stringToHex(str: string): string {
  return Buffer.from(str, 'utf8').toString('hex').toUpperCase();
}

// ============================================================================
// Step 1: Prepare HookParameters
// ============================================================================

function prepareHookParameters(companyAddress: string): any[] {
  console.log('\n📝 Preparing HookParameters...\n');
  
  const companyAccountID = addressToAccountID(companyAddress);
  
  const params = [
    {
      HookParameter: {
        HookParameterName: stringToHex('Status'),
        HookParameterValue: stringToHex(FUNDRAISING_CONFIG.status),
      }
    },
    {
      HookParameter: {
        HookParameterName: stringToHex('Objectif'),
        HookParameterValue: stringToHex(FUNDRAISING_CONFIG.objectif),
      }
    },
    {
      HookParameter: {
        HookParameterName: stringToHex('Deadline'),
        HookParameterValue: stringToHex(FUNDRAISING_CONFIG.deadline),
      }
    },
    {
      HookParameter: {
        HookParameterName: stringToHex('TotalRaised'),
        HookParameterValue: stringToHex(FUNDRAISING_CONFIG.totalRaised),
      }
    },
    {
      HookParameter: {
        HookParameterName: stringToHex('CompanyAddress'),
        HookParameterValue: companyAccountID,
      }
    },
  ];
  
  console.log('HookParameters created:');
  params.forEach((p, i) => {
    console.log(`  ${i + 1}. ${Buffer.from(p.HookParameter.HookParameterName, 'hex').toString()}: ${p.HookParameter.HookParameterValue.slice(0, 20)}...`);
  });
  
  return params;
}

// ============================================================================
// Step 2: Load Hook Hex
// ============================================================================

function loadHookHex(): string {
  console.log('\n📦 Loading Hook hex file...\n');
  
  const hexPath = path.join(__dirname, '../build/vault_fundraiser.hex');
  
  if (!fs.existsSync(hexPath)) {
    console.error('❌ vault_fundraiser.hex not found!');
    console.error('   Run: cd backend && bash compile-hook.sh hooks/vault_fundraiser.c');
    throw new Error('Hook hex file not found');
  }
  
  const hexContent = fs.readFileSync(hexPath, 'utf8')
    .replace(/\s/g, '')  // Remove whitespace
    .toUpperCase();
  
  const sizeKB = (hexContent.length / 2 / 1024).toFixed(2);
  console.log(`✅ Hook loaded: ${hexContent.length / 2} bytes (${sizeKB} KB)`);
  
  if (hexContent.length / 2 > 65536) {
    console.warn('⚠️  WARNING: Hook is larger than 64KB limit!');
  }
  
  return hexContent;
}

// ============================================================================
// Step 3: Deploy Hook
// ============================================================================

async function deployHook(client: Client, hookWallet: Wallet, hookHex: string, hookParams: any[]) {
  console.log('\n🚀 Deploying Hook...\n');
  
  const setHookTx = {
    TransactionType: 'SetHook',
    Account: hookWallet.classicAddress,
    Hooks: [
      {
        Hook: {
          CreateCode: hookHex,
          HookOn: '0000000000000001',  // ttPAYMENT only (bit 0 = Payment)
          HookNamespace: '0000000000000000000000000000000000000000000000000000000000000000',
          HookApiVersion: 0,
          HookParameters: hookParams,
        }
      }
    ],
  };
  
  console.log('Transaction prepared:');
  console.log('  Account:', hookWallet.classicAddress);
  console.log('  HookOn: ttPAYMENT');
  console.log('  Parameters:', hookParams.length);
  console.log('\nSubmitting transaction...\n');
  
  try {
    const prepared = await client.autofill(setHookTx as any);
    const signed = hookWallet.sign(prepared);
    
    console.log('Transaction signed, broadcasting...');
    const result = await client.submitAndWait(signed.tx_blob);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (result.result.meta && typeof result.result.meta === 'object') {
      const meta = result.result.meta as any;
      
      if (meta.TransactionResult === 'tesSUCCESS') {
        console.log('✅ HOOK DEPLOYED SUCCESSFULLY!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Transaction hash:', result.result.hash);
        console.log('Ledger index:', result.result.ledger_index);
        console.log('Fee paid:', meta.delivered_amount || 'N/A');
        console.log('\n✅ Hook is now active on:', hookWallet.classicAddress);
        return true;
      } else {
        console.log('❌ DEPLOYMENT FAILED!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Result:', meta.TransactionResult);
        console.log('\nPossible reasons:');
        console.log('  - Hook too large (>64KB)');
        console.log('  - Invalid WASM format');
        console.log('  - Insufficient XRP balance');
        console.log('  - Invalid HookParameters');
        return false;
      }
    } else {
      console.log('❌ DEPLOYMENT FAILED - No meta in result');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return false;
    }
    
  } catch (error: any) {
    console.log('❌ DEPLOYMENT ERROR!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error:', error.message);
    
    if (error.data) {
      console.log('\nError details:', JSON.stringify(error.data, null, 2));
    }
    
    return false;
  }
}

// ============================================================================
// Step 4: Verify Deployment
// ============================================================================

async function verifyDeployment(client: Client, hookAddress: string) {
  console.log('\n🔍 Verifying deployment...\n');
  
  try {
    // Check account info
    const accountInfo = await client.request({
      command: 'account_info',
      account: hookAddress,
      ledger_index: 'validated',
    });
    
    console.log('Account Balance:', accountInfo.result.account_data.Balance, 'drops');
    console.log('Sequence:', accountInfo.result.account_data.Sequence);
    
    // Try to read Hook State
    try {
      const stateResponse: any = await client.request({
        command: 'account_namespace' as any,
        account: hookAddress,
        namespace_id: '0000000000000000000000000000000000000000000000000000000000000000',
      } as any);
      
      const entries = stateResponse.result?.namespace_entries || [];
      console.log('\nHook State entries:', entries.length);
      
      if (entries.length > 0) {
        console.log('\nInitial Hook State:');
        entries.slice(0, 5).forEach((entry: any, i: number) => {
          console.log(`  ${i + 1}. Key: ${entry.HookStateKey?.slice(0, 20)}...`);
          console.log(`     Data: ${entry.HookStateData?.slice(0, 20)}...`);
        });
      }
      
    } catch (error) {
      console.log('(Hook State not readable yet - this is normal on first deploy)');
    }
    
    console.log('\n✅ Verification complete\n');
    
  } catch (error: any) {
    console.error('❌ Verification error:', error.message);
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  XRPL Vault Fundraiser - Hook Deployment                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  // Check configuration
  if (HOOK_ACCOUNT_SECRET.includes('XXXX') || COMPANY_ADDRESS.includes('XXXX')) {
    console.error('\n❌ ERROR: You need to configure the secrets!');
    console.error('   1. Run: npx ts-node scripts/setup-accounts.ts');
    console.error('   2. Copy the secrets to this file');
    console.error('   3. Run this script again\n');
    process.exit(1);
  }
  
  console.log('\n📋 Configuration:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Objectif:', parseInt(FUNDRAISING_CONFIG.objectif) / 1e6, 'USDC');
  console.log('Deadline:', new Date(parseInt(FUNDRAISING_CONFIG.deadline) * 1000).toISOString());
  console.log('Company:', COMPANY_ADDRESS);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Connect
  const client = new Client(HOOKS_TESTNET);
  await client.connect();
  console.log('\n✅ Connected to Hooks Testnet v3');
  
  try {
    // Create wallet
    const hookWallet = Wallet.fromSeed(HOOK_ACCOUNT_SECRET);
    console.log('Hook Account:', hookWallet.classicAddress);
    
    // Prepare parameters
    const hookParams = prepareHookParameters(COMPANY_ADDRESS);
    
    // Load hex
    const hookHex = loadHookHex();
    
    // Deploy
    const success = await deployHook(client, hookWallet, hookHex, hookParams);
    
    if (success) {
      // Verify
      await verifyDeployment(client, hookWallet.classicAddress);
      
      console.log('\n🎉 DEPLOYMENT COMPLETE!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Hook Address:', hookWallet.classicAddress);
      console.log('\nNext steps:');
      console.log('  1. Send test investment:');
      console.log('     npx ts-node scripts/test-investment.ts');
      console.log('  2. Monitor Hook State:');
      console.log('     npx ts-node scripts/check-hook-state.ts');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
  } finally {
    await client.disconnect();
  }
}

// Run
if (require.main === module) {
  main().catch(console.error);
}

export { deployHook, prepareHookParameters };
