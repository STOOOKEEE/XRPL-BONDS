/**
 * Example: Using the escrow wasm module to manage a campaign that accepts
 * RLUSD or USDC and distributes tokens 1:1
 */

import * as escrow from '../../pkg/escrow/escrow_wasm';
import { Client, Wallet, Payment, xrpToDrops } from 'xrpl';
import * as dotenv from 'dotenv';

dotenv.config();

interface CampaignState {
  campaign_id: string;
  max_value: bigint;
  current_raised: bigint;
  deadline_unix: bigint;
  treasury_address: string;
  investments: Record<string, bigint>;
  investment_currency: string;
  investment_issuer: string;
  token_currency: string;
  token_issuer: string;
}

interface InvestmentResult {
  accepted: boolean;
  reason: string;
  token_amount: bigint;
  updated_state?: CampaignState;
  send_to_treasury: boolean;
}

interface FinalizeResult {
  success: boolean;
  objective_reached: boolean;
  refunds: [string, bigint][];
  treasury_amount: bigint;
}

// Helper to serialize state with BigInt to JSON
// Convert BigInt to Number for Rust u64 compatibility (safe up to 2^53)
function serializeState(state: any): string {
  return JSON.stringify(state, (key, value) =>
    typeof value === 'bigint' ? Number(value) : value
  );
}

async function exampleCampaign() {
  const WEBSOCKET_URL = process.env.XRPL_WEBSOCKET_URL || 'wss://s.altnet.rippletest.net:51233';
  
  console.log('🚀 Escrow Campaign Example\n');

  // 1. Create campaign state (supports RLUSD or USDC)
  const campaignId = 'CAMP-' + Date.now();
  const maxValue = BigInt(10_000_000); // 10 RLUSD (assuming 6 decimals)
  const deadlineUnix = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 3600); // +30 days
  const treasuryAddress = process.env.COMPANY_SECRET 
    ? Wallet.fromSeed(process.env.COMPANY_SECRET).address 
    : 'rTreasuryPlaceholder';
  
  // Choose your stablecoin: RLUSD or USDC
  const investmentCurrency = 'RLUSD'; // or 'USDC'
  const investmentIssuer = 'rRLUSDIssuerAddress'; // replace with real RLUSD issuer on your network
  
  const tokenCurrency = 'BOND';
  const tokenIssuer = process.env.ISSUER_ADDRESS || 'rTokenIssuer';

  console.log(`📋 Creating campaign: ${campaignId}`);
  console.log(`   Investment: ${investmentCurrency} (issuer: ${investmentIssuer})`);
  console.log(`   Token: ${tokenCurrency} (issuer: ${tokenIssuer})`);
  console.log(`   Max: ${maxValue} (smallest units)`);
  console.log(`   Deadline: ${new Date(Number(deadlineUnix) * 1000).toISOString()}\n`);

  const state: CampaignState = escrow.create_campaign_state(
    campaignId,
    maxValue,
    deadlineUnix,
    treasuryAddress,
    investmentCurrency,
    investmentIssuer,
    tokenCurrency,
    tokenIssuer
  );

  console.log('✅ Campaign state created\n');

  // 2. Simulate investor sending RLUSD
  const investor1 = 'rInvestor1Address';
  const investment1 = BigInt(2_000_000); // 2 RLUSD
  
  console.log(`💰 Processing investment from ${investor1}: ${investment1} ${investmentCurrency}`);
  
  const result1: InvestmentResult = escrow.process_investment(
    serializeState(state),
    investor1,
    investment1,
    BigInt(Math.floor(Date.now() / 1000))
  );

  if (result1.accepted) {
    console.log(`   ✅ ${result1.reason}`);
    console.log(`   🎫 Tokens to send: ${result1.token_amount} ${tokenCurrency}`);
    console.log(`   📊 Total raised: ${result1.updated_state?.current_raised}/${maxValue}\n`);

    // TODO: Send tokens using xrpl.js Payment transaction
    // await sendTokens(investor1, result1.token_amount, tokenCurrency, tokenIssuer);

    // Update state (in production: save to MongoDB)
    Object.assign(state, result1.updated_state);
  } else {
    console.log(`   ❌ ${result1.reason}\n`);
  }

  // 3. Simulate reaching the cap
  const investor2 = 'rInvestor2Address';
  const investment2 = BigInt(8_000_000); // 8 RLUSD (reaches exactly 10)

  console.log(`💰 Processing investment from ${investor2}: ${investment2} ${investmentCurrency}`);

  const result2: InvestmentResult = escrow.process_investment(
    serializeState(state),
    investor2,
    investment2,
    BigInt(Math.floor(Date.now() / 1000))
  );

  if (result2.accepted) {
    console.log(`   ✅ ${result2.reason}`);
    console.log(`   🎫 Tokens to send: ${result2.token_amount} ${tokenCurrency}`);
    console.log(`   🏦 Send to treasury: ${result2.send_to_treasury}`);
    console.log(`   📊 Total raised: ${result2.updated_state?.current_raised}/${maxValue}\n`);

    if (result2.send_to_treasury) {
      console.log(`   🎯 Objective reached! Transfer ${result2.updated_state?.current_raised} ${investmentCurrency} to treasury ${treasuryAddress}\n`);
      // TODO: Send full amount to treasury using xrpl.js
    }

    Object.assign(state, result2.updated_state);
  } else {
    console.log(`   ❌ ${result2.reason}\n`);
  }

  // 4. Try to invest after cap reached (should be rejected)
  const investor3 = 'rInvestor3Address';
  const investment3 = BigInt(1_000_000);

  console.log(`💰 Processing investment from ${investor3}: ${investment3} ${investmentCurrency}`);

  const result3: InvestmentResult = escrow.process_investment(
    serializeState(state),
    investor3,
    investment3,
    BigInt(Math.floor(Date.now() / 1000))
  );

  if (result3.accepted) {
    console.log(`   ✅ ${result3.reason}\n`);
  } else {
    console.log(`   ❌ ${result3.reason}\n`);
  }

  // 5. Finalize campaign (simulate deadline passed, objective not reached)
  console.log('⏰ Simulating finalization after deadline...\n');

  // Create a failed campaign state: deadline in the past, objective not reached
  const pastDeadline = BigInt(Math.floor(Date.now() / 1000) - 86400); // Yesterday
  const failedCampaignState: CampaignState = {
    campaign_id: 'CAMP-FAILED',
    max_value: BigInt(10_000_000),
    current_raised: BigInt(5_000_000), // Only 5 RLUSD raised (50% of goal)
    deadline_unix: pastDeadline,
    treasury_address: treasuryAddress,
    investments: {
      'rInvestor1Address': BigInt(2_000_000),
      'rInvestor2Address': BigInt(3_000_000), // Total = 5M
    },
    investment_currency: investmentCurrency,
    investment_issuer: investmentIssuer,
    token_currency: tokenCurrency,
    token_issuer: tokenIssuer,
  };

  const currentTime = BigInt(Math.floor(Date.now() / 1000));

  const finalizeResult: FinalizeResult = escrow.finalize_campaign(
    serializeState(failedCampaignState),
    currentTime
  );

  if (finalizeResult.success) {
    if (finalizeResult.objective_reached) {
      console.log(`   ✅ Campaign succeeded! Treasury receives: ${finalizeResult.treasury_amount} ${investmentCurrency}\n`);
    } else {
      console.log(`   ❌ Campaign failed. Issuing ${finalizeResult.refunds.length} refunds:\n`);
      for (const [address, amount] of finalizeResult.refunds) {
        console.log(`      → ${address}: ${amount} ${investmentCurrency}`);
        // TODO: Send refund using xrpl.js Payment transaction
      }
      console.log();
    }
  } else {
    console.log(`   ⚠️  Finalize failed: deadline not yet reached or invalid state\n`);
  }

  console.log('✅ Example complete\n');
}

// Helper function to send tokens (stub - implement with xrpl.js)
async function sendTokens(
  destination: string,
  amount: bigint,
  currency: string,
  issuer: string
) {
  console.log(`   [TODO] Send ${amount} ${currency} (issuer: ${issuer}) to ${destination}`);
  
  // Implementation:
  // const client = new Client(WEBSOCKET_URL);
  // await client.connect();
  // const wallet = Wallet.fromSeed(process.env.ISSUER_SECRET!);
  // 
  // const payment: Payment = {
  //   TransactionType: 'Payment',
  //   Account: wallet.address,
  //   Destination: destination,
  //   Amount: {
  //     currency: currency,
  //     value: (Number(amount) / 1_000_000).toString(), // Convert to human units
  //     issuer: issuer
  //   }
  // };
  // 
  // const result = await client.submitAndWait(payment, { wallet });
  // await client.disconnect();
}

// Run example
if (require.main === module) {
  exampleCampaign().catch(console.error);
}

export { exampleCampaign };
