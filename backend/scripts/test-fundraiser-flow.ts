/**
 * test-fundraiser-flow.ts
 * 
 * Script de test end-to-end du Hook vault_fundraiser
 * 
 * Teste:
 * 1. Investissement → Réception MPT
 * 2. Deadline check → Transfert entreprise (si succès)
 * 3. Remboursement (si échec)
 */

import { Client, Wallet, xrpToDrops } from 'xrpl';

// ============================================================================
// Configuration
// ============================================================================

const HOOKS_TESTNET = 'wss://hooks-testnet-v3.xrpl-labs.com';

// Wallets (à remplacer par vos secrets)
const HOOK_WALLET = Wallet.fromSeed('sXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
const COMPANY_WALLET = Wallet.fromSeed('sXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
const INVESTOR1_WALLET = Wallet.fromSeed('sXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
const INVESTOR2_WALLET = Wallet.fromSeed('sXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');

// USDC Issuer (Testnet)
const USDC_ISSUER = 'rUSDCIssuerXXXXXXXXXXXXXXXXXXXXXXXXX';

// ============================================================================
// Helper Functions
// ============================================================================

async function fundAccount(client: Client, address: string) {
  console.log(`💰 Funding account ${address}...`);
  
  try {
    const response = await client.fundWallet(Wallet.fromSeed('sXXX'));
    console.log(`✅ Funded with ${response.balance} XRP`);
  } catch (error) {
    console.log(`⚠️  Account already funded or error:`, error);
  }
}

async function readHookState(client: Client, account: string, key: string): Promise<string | null> {
  try {
    const response: any = await client.request({
      command: 'account_namespace' as any,
      account: account,
      namespace_id: '0000000000000000000000000000000000000000000000000000000000000000',
    } as any);
    
    // Search for the key in HookStateData
    const entries = response.result.namespace_entries || [];
    
    for (const entry of entries) {
      if (entry.HookStateKey) {
        const keyHex = Buffer.from(key).toString('hex').toUpperCase();
        if (entry.HookStateKey.includes(keyHex)) {
          return Buffer.from(entry.HookStateData, 'hex').toString('utf8');
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Error reading Hook State for key "${key}":`, error);
    return null;
  }
}

async function displayHookState(client: Client, account: string) {
  console.log('\n📊 Current Hook State:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const keys = ['Status', 'TotalRaised', 'Objectif', 'Deadline'];
  
  for (const key of keys) {
    const value = await readHookState(client, account, key);
    console.log(`${key.padEnd(15)}: ${value || '(not set)'}`);
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

function getStatusName(statusCode: string): string {
  const statuses: Record<string, string> = {
    '1': 'ACTIVE',
    '2': 'SUCCESS_PENDING',
    '3': 'SUCCESS',
    '4': 'FAILED_REFUNDING',
  };
  return statuses[statusCode] || 'UNKNOWN';
}

// ============================================================================
// Test Scenarios
// ============================================================================

/**
 * Test 1: Investment
 */
async function testInvestment(client: Client) {
  console.log('\n🧪 TEST 1: Investment');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const investmentAmount = '50000'; // 50,000 USDC
  
  console.log(`Investor: ${INVESTOR1_WALLET.classicAddress}`);
  console.log(`Amount: ${investmentAmount} USDC\n`);
  
  try {
    const payment = {
      TransactionType: 'Payment' as const,
      Account: INVESTOR1_WALLET.classicAddress,
      Destination: HOOK_WALLET.classicAddress,
      Amount: {
        currency: 'USDC',
        value: investmentAmount,
        issuer: USDC_ISSUER,
      },
    };
    
    console.log('Submitting investment transaction...');
    const result = await client.submitAndWait(payment as any, { wallet: INVESTOR1_WALLET });
    
    if (result.result.meta && typeof result.result.meta === 'object') {
      const meta = result.result.meta as any;
      console.log(`\n✅ Transaction successful!`);
      console.log(`Result: ${meta.TransactionResult}`);
      console.log(`Ledger: ${result.result.ledger_index}`);
      
      // Check Hook State
      await new Promise(resolve => setTimeout(resolve, 2000));
      const totalRaised = await readHookState(client, HOOK_WALLET.classicAddress, 'TotalRaised');
      console.log(`\nTotal Raised: ${totalRaised || '0'} USDC`);
      
      // Check investor's invested amount
      const investorKey = `invested:${INVESTOR1_WALLET.classicAddress}`;
      const investorAmount = await readHookState(client, HOOK_WALLET.classicAddress, investorKey);
      console.log(`Investor Amount: ${investorAmount || '0'} USDC`);
      
    } else {
      console.log(`❌ Transaction failed`);
    }
    
  } catch (error: any) {
    console.error(`❌ Error:`, error.message);
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Test 2: Multiple Investments
 */
async function testMultipleInvestments(client: Client) {
  console.log('\n🧪 TEST 2: Multiple Investments');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const investors = [
    { wallet: INVESTOR1_WALLET, amount: '200000' },
    { wallet: INVESTOR2_WALLET, amount: '300000' },
  ];
  
  for (const { wallet, amount } of investors) {
    console.log(`\nInvestor: ${wallet.classicAddress}`);
    console.log(`Amount: ${amount} USDC`);
    
    try {
      const payment = {
        TransactionType: 'Payment' as const,
        Account: wallet.classicAddress,
        Destination: HOOK_WALLET.classicAddress,
        Amount: {
          currency: 'USDC',
          value: amount,
          issuer: USDC_ISSUER,
        },
      };
      
      const result = await client.submitAndWait(payment as any, { wallet });
      console.log(`✅ Investment successful`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error: any) {
      console.error(`❌ Error:`, error.message);
    }
  }
  
  // Display final state
  await displayHookState(client, HOOK_WALLET.classicAddress);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Test 3: Deadline Check (Success Case)
 */
async function testDeadlineSuccess(client: Client) {
  console.log('\n🧪 TEST 3: Deadline Check (Success)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  console.log('Sending ping to trigger deadline check...\n');
  
  try {
    const ping = {
      TransactionType: 'Payment' as const,
      Account: INVESTOR1_WALLET.classicAddress,
      Destination: HOOK_WALLET.classicAddress,
      Amount: '1', // 1 drop XRP
    };
    
    const result = await client.submitAndWait(ping as any, { wallet: INVESTOR1_WALLET });
    
    if (result.result.meta && typeof result.result.meta === 'object') {
      const meta = result.result.meta as any;
      console.log(`✅ Ping successful!`);
      console.log(`Result: ${meta.TransactionResult}`);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check status
      const status = await readHookState(client, HOOK_WALLET.classicAddress, 'Status');
      console.log(`\nStatus: ${status} (${getStatusName(status || '')})`);
      
      if (status === '3') {
        console.log('🎉 SUCCESS: Funds should be transferred to company!');
        
        // Check company balance
        const companyInfo = await client.request({
          command: 'account_info',
          account: COMPANY_WALLET.classicAddress,
        });
        console.log(`Company Balance: ${JSON.stringify(companyInfo.result.account_data.Balance)}`);
      }
      
    } else {
      console.log(`❌ Ping failed`);
    }
    
  } catch (error: any) {
    console.error(`❌ Error:`, error.message);
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Test 4: Refund Request
 */
async function testRefundRequest(client: Client) {
  console.log('\n🧪 TEST 4: Refund Request');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  console.log(`Investor: ${INVESTOR1_WALLET.classicAddress}`);
  console.log('Requesting refund...\n');
  
  try {
    // First check investor's invested amount
    const investorKey = `invested:${INVESTOR1_WALLET.classicAddress}`;
    const invested = await readHookState(client, HOOK_WALLET.classicAddress, investorKey);
    console.log(`Invested Amount: ${invested || '0'} USDC`);
    
    // Send ping to request refund
    const refundRequest = {
      TransactionType: 'Payment' as const,
      Account: INVESTOR1_WALLET.classicAddress,
      Destination: HOOK_WALLET.classicAddress,
      Amount: '1', // 1 drop XRP
    };
    
    const result = await client.submitAndWait(refundRequest as any, { wallet: INVESTOR1_WALLET });
    
    if (result.result.meta && typeof result.result.meta === 'object') {
      const meta = result.result.meta as any;
      console.log(`✅ Refund request processed!`);
      console.log(`Result: ${meta.TransactionResult}`);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if marked as refunded
      const refundedKey = `refunded:${INVESTOR1_WALLET.classicAddress}`;
      const refunded = await readHookState(client, HOOK_WALLET.classicAddress, refundedKey);
      console.log(`\nRefunded Status: ${refunded === '1' ? 'YES' : 'NO'}`);
      
    } else {
      console.log(`❌ Refund request failed`);
    }
    
  } catch (error: any) {
    console.error(`❌ Error:`, error.message);
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Test 5: Check Hook State
 */
async function testCheckState(client: Client) {
  console.log('\n🧪 TEST 5: Hook State Inspection');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  await displayHookState(client, HOOK_WALLET.classicAddress);
  
  // Try to read all namespace entries
  try {
    const response: any = await client.request({
      command: 'account_namespace' as any,
      account: HOOK_WALLET.classicAddress,
      namespace_id: '0000000000000000000000000000000000000000000000000000000000000000',
    } as any);
    
    console.log('All Hook State Entries:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const entries = response.result.namespace_entries || [];
    
    if (entries.length === 0) {
      console.log('(No entries found)');
    } else {
      entries.forEach((entry: any, index: number) => {
        console.log(`\nEntry ${index + 1}:`);
        console.log(`  Key (hex): ${entry.HookStateKey || 'N/A'}`);
        console.log(`  Data (hex): ${entry.HookStateData || 'N/A'}`);
        
        // Try to decode
        if (entry.HookStateData) {
          try {
            const decoded = Buffer.from(entry.HookStateData, 'hex').toString('utf8');
            console.log(`  Data (decoded): ${decoded}`);
          } catch {
            console.log(`  Data (decoded): (binary)`);
          }
        }
      });
    }
    
  } catch (error: any) {
    console.error(`❌ Error reading namespace:`, error.message);
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// ============================================================================
// Main Test Suite
// ============================================================================

async function main() {
  console.log('🚀 XRPL Vault Fundraiser - Test Suite\n');
  console.log('Hook Account:', HOOK_WALLET.classicAddress);
  console.log('Company:', COMPANY_WALLET.classicAddress);
  console.log('Investor 1:', INVESTOR1_WALLET.classicAddress);
  console.log('Investor 2:', INVESTOR2_WALLET.classicAddress);
  console.log('');
  
  // Connect
  const client = new Client(HOOKS_TESTNET);
  await client.connect();
  console.log('✅ Connected to Hooks Testnet v3\n');
  
  try {
    // Run tests (comment/uncomment as needed)
    
    // await testInvestment(client);
    // await testMultipleInvestments(client);
    // await testDeadlineSuccess(client);
    // await testRefundRequest(client);
    await testCheckState(client);
    
  } catch (error) {
    console.error('❌ Test suite error:', error);
  } finally {
    await client.disconnect();
    console.log('✅ Disconnected\n');
  }
}

// Run
if (require.main === module) {
  main().catch(console.error);
}

export { testInvestment, testMultipleInvestments, testDeadlineSuccess, testRefundRequest, testCheckState };
