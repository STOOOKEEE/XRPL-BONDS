/**
 * check-hook-state.ts
 * Affiche l'état actuel du Hook
 */

import { Client, Wallet } from 'xrpl';

const HOOKS_TESTNET = 'wss://hooks-testnet-v3.xrpl-labs.com';

// À REMPLACER avec ton adresse Hook
const HOOK_ADDRESS = 'rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

async function readHookState(client: Client, key: string): Promise<string | null> {
  try {
    const response: any = await client.request({
      command: 'account_namespace' as any,
      account: HOOK_ADDRESS,
      namespace_id: '0000000000000000000000000000000000000000000000000000000000000000',
    } as any);
    
    const entries = response.result?.namespace_entries || [];
    const keyHex = Buffer.from(key).toString('hex').toUpperCase();
    
    for (const entry of entries) {
      if (entry.HookStateKey && entry.HookStateKey.includes(keyHex)) {
        return Buffer.from(entry.HookStateData, 'hex').toString('utf8');
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

function getStatusName(status: string): string {
  const statuses: Record<string, string> = {
    '1': '🟢 ACTIVE (accepting investments)',
    '2': '🟡 SUCCESS PENDING (waiting deadline)',
    '3': '✅ SUCCESS (funds transferred)',
    '4': '🔴 FAILED - REFUNDING',
  };
  return statuses[status] || '❓ UNKNOWN';
}

async function main() {
  console.log('🔍 Checking Hook State...\n');
  
  if (HOOK_ADDRESS.includes('XXXX')) {
    console.error('❌ Configure HOOK_ADDRESS first!');
    process.exit(1);
  }
  
  const client = new Client(HOOKS_TESTNET);
  await client.connect();
  
  try {
    console.log('Hook Account:', HOOK_ADDRESS);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Read main state
    const status = await readHookState(client, 'Status');
    const totalRaised = await readHookState(client, 'TotalRaised');
    const objectif = await readHookState(client, 'Objectif');
    const deadline = await readHookState(client, 'Deadline');
    
    console.log('📊 FUNDRAISING STATUS:');
    console.log('  Status:', status ? getStatusName(status) : '(not initialized)');
    console.log('');
    console.log('💰 FINANCES:');
    console.log('  Total Raised:', totalRaised ? `${parseInt(totalRaised) / 1e6} USDC` : '0 USDC');
    console.log('  Objectif:', objectif ? `${parseInt(objectif) / 1e6} USDC` : '(not set)');
    
    if (totalRaised && objectif) {
      const progress = (parseInt(totalRaised) / parseInt(objectif)) * 100;
      console.log('  Progress:', progress.toFixed(2), '%');
      
      // Progress bar
      const barLength = 30;
      const filled = Math.floor((progress / 100) * barLength);
      const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
      console.log('  [' + bar + ']');
    }
    
    console.log('');
    console.log('⏰ DEADLINE:');
    if (deadline) {
      const deadlineDate = new Date(parseInt(deadline) * 1000);
      const now = new Date();
      const timeLeft = deadlineDate.getTime() - now.getTime();
      
      console.log('  Date:', deadlineDate.toISOString());
      
      if (timeLeft > 0) {
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        console.log('  Time left:', days, 'days', hours, 'hours');
      } else {
        console.log('  ⚠️  Deadline passed!');
      }
    } else {
      console.log('  (not set)');
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Check account balance
    const accountInfo = await client.request({
      command: 'account_info',
      account: HOOK_ADDRESS,
      ledger_index: 'validated',
    });
    
    console.log('\n💳 HOOK ACCOUNT:');
    console.log('  XRP Balance:', parseInt(accountInfo.result.account_data.Balance) / 1e6, 'XRP');
    console.log('  Sequence:', accountInfo.result.account_data.Sequence);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.disconnect();
  }
}

main().catch(console.error);
