/**
 * initialize-fundraiser-hook.ts
 * 
 * Script pour initialiser le Hook State du vault_fundraiser
 * 
 * Usage:
 *   npx ts-node scripts/initialize-fundraiser-hook.ts
 */

import { Client, Wallet, xrpToDrops } from 'xrpl';

// ============================================================================
// Configuration
// ============================================================================

const HOOKS_TESTNET = 'wss://hooks-testnet-v3.xrpl-labs.com';

// Hook Account (détient les MPTokens et le Hook)
const HOOK_ACCOUNT_SECRET = 'sXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'; // À remplacer

// Entreprise (reçoit les fonds si succès)
const COMPANY_ADDRESS = 'rCompanyXXXXXXXXXXXXXXXXXXXXXXXXX'; // À remplacer

// MPToken ID (pré-créé et transféré au Hook account)
const MPTOKEN_ID = '0000000000000000000000000000000000000000000000000000000000000000'; // À remplacer

// ============================================================================
// Paramètres de la levée
// ============================================================================

const FUNDRAISING_CONFIG = {
  // Objectif : 1,000,000 USDC (en micro-units, 6 décimales)
  objectif: '1000000000000',
  
  // Deadline : 1er décembre 2025, 00:00:00 UTC
  deadline: '1767225600', // Unix timestamp
  
  // Prix par token MPT : 1 USDC = 1 MPT (ratio 1:1)
  tokenPrice: '1000000', // 1 USDC en micro-units
  
  // État initial
  status: '1', // STATUS_ACTIVE
  totalRaised: '0',
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convertit une adresse XRPL en AccountID (20 bytes hex)
 */
function addressToAccountID(address: string): string {
  // Cette fonction nécessite xrpl-accountlib ou codec
  // Pour MVP, placeholder
  // En production : utiliser ripple-address-codec
  
  const { decodeAccountID } = require('ripple-address-codec');
  const accountID = decodeAccountID(address);
  return Buffer.from(accountID).toString('hex').toUpperCase();
}

/**
 * Initialise le Hook State avec state_set
 */
async function initializeHookState(client: Client, hookWallet: Wallet) {
  console.log('🔧 Initializing Hook State...\n');
  
  // Convert company address to AccountID
  const companyAccountID = addressToAccountID(COMPANY_ADDRESS);
  console.log(`Company AccountID: ${companyAccountID}`);
  
  // State keys to set
  const stateKeys = [
    { key: 'Status', value: FUNDRAISING_CONFIG.status },
    { key: 'Objectif', value: FUNDRAISING_CONFIG.objectif },
    { key: 'Deadline', value: FUNDRAISING_CONFIG.deadline },
    { key: 'TotalRaised', value: FUNDRAISING_CONFIG.totalRaised },
    { key: 'CompanyAddress', value: companyAccountID, isHex: true },
    { key: 'MPTokenID', value: MPTOKEN_ID, isHex: true },
  ];
  
  // NOTE: Dans XRPL Hooks, state_set est appelé depuis le Hook lui-même
  // Pas d'API externe pour set le state directement
  // SOLUTION : Envoyer un Invoke avec HookParameters lors du déploiement
  
  console.log('\n⚠️  STATE INITIALIZATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Le Hook State doit être initialisé via HookParameters');
  console.log('lors du déploiement avec SetHook transaction.\n');
  
  console.log('HookParameters à utiliser :');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  stateKeys.forEach(({ key, value, isHex }) => {
    const valueHex = isHex ? value : Buffer.from(value).toString('hex');
    console.log(`{`);
    console.log(`  HookParameter: {`);
    console.log(`    HookParameterName: "${Buffer.from(key).toString('hex').toUpperCase()}",`);
    console.log(`    HookParameterValue: "${valueHex.toUpperCase()}"`);
    console.log(`  }`);
    console.log(`},`);
  });
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

/**
 * Vérifie que le Hook account détient bien les MPTokens
 */
async function verifyMPTokenInventory(client: Client, hookAddress: string) {
  console.log('\n🔍 Verifying MPToken inventory...\n');
  
  try {
    const response = await client.request({
      command: 'account_objects',
      account: hookAddress,
      type: 'mptoken',
    });
    
    console.log('MPToken objects found:', response.result.account_objects.length);
    
    response.result.account_objects.forEach((obj: any, index: number) => {
      console.log(`\nToken ${index + 1}:`);
      console.log(`  MPTokenID: ${obj.MPTokenID}`);
      console.log(`  Amount: ${obj.MPTokenAmount || 'N/A'}`);
    });
    
    return response.result.account_objects.length > 0;
    
  } catch (error) {
    console.error('❌ Error fetching MPToken inventory:', error);
    return false;
  }
}

/**
 * Affiche le résumé de configuration
 */
function displayConfigSummary() {
  console.log('\n📋 FUNDRAISING CONFIGURATION SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Objectif:        ${parseInt(FUNDRAISING_CONFIG.objectif) / 1e6} USDC`);
  console.log(`Deadline:        ${new Date(parseInt(FUNDRAISING_CONFIG.deadline) * 1000).toISOString()}`);
  console.log(`Token Price:     1 USDC = 1 MPT`);
  console.log(`Company Address: ${COMPANY_ADDRESS}`);
  console.log(`Hook Account:    ${Wallet.fromSeed(HOOK_ACCOUNT_SECRET).classicAddress}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Instructions de déploiement
 */
function displayDeploymentInstructions() {
  console.log('\n📝 DEPLOYMENT INSTRUCTIONS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. Compiler le Hook:');
  console.log('   cd backend');
  console.log('   bash compile-hook.sh hooks/vault_fundraiser.c');
  console.log('');
  console.log('2. Déployer avec Hooks Builder (Xahau):');
  console.log('   - Charger build/vault_fundraiser.hex');
  console.log('   - Ajouter les HookParameters ci-dessus');
  console.log('   - Invoke on: ttPAYMENT');
  console.log('   - Fee: 10,000,000 drops');
  console.log('');
  console.log('3. Transférer les MPTokens au Hook account:');
  console.log('   - 1,000,000 MPT depuis rEntreprise → rHookAccount');
  console.log('');
  console.log('4. Tester avec un investissement:');
  console.log('   await client.submitAndWait({');
  console.log('     TransactionType: "Payment",');
  console.log('     Account: "rInvestor...",');
  console.log('     Destination: "rHookAccount...",');
  console.log('     Amount: {');
  console.log('       currency: "USDC",');
  console.log('       value: "1000",');
  console.log('       issuer: "rUSDCIssuer..."');
  console.log('     }');
  console.log('   });');
  console.log('');
  console.log('5. Après deadline, envoyer un ping:');
  console.log('   await client.submitAndWait({');
  console.log('     TransactionType: "Payment",');
  console.log('     Account: "rAnyAddress...",');
  console.log('     Destination: "rHookAccount...",');
  console.log('     Amount: "1" // 1 drop XRP');
  console.log('   });');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('🚀 XRPL Vault Fundraiser - Hook Initialization\n');
  
  // Display config
  displayConfigSummary();
  
  // Connect to Hooks Testnet
  const client = new Client(HOOKS_TESTNET);
  await client.connect();
  console.log('✅ Connected to Hooks Testnet v3\n');
  
  // Create wallet
  const hookWallet = Wallet.fromSeed(HOOK_ACCOUNT_SECRET);
  console.log(`Hook Account: ${hookWallet.classicAddress}\n`);
  
  // Verify MPToken inventory
  const hasTokens = await verifyMPTokenInventory(client, hookWallet.classicAddress);
  
  if (!hasTokens) {
    console.log('\n⚠️  WARNING: No MPTokens found in Hook account!');
    console.log('   Transfer MPTokens before accepting investments.\n');
  }
  
  // Generate initialization parameters
  await initializeHookState(client, hookWallet);
  
  // Display deployment instructions
  displayDeploymentInstructions();
  
  await client.disconnect();
  console.log('✅ Initialization complete!\n');
}

// Run
main().catch(console.error);
