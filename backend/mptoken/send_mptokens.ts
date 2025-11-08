import { Client, Wallet } from 'xrpl'
import * as dotenv from 'dotenv'
dotenv.config()

// XRPL WebSocket (devnet fallback)
const WS_URL = process.env.XRPL_WEBSOCKET_URL ?? 'wss://s.altnet.rippletest.net:51233'
const client = new Client(WS_URL)

// Helper: Mint or Transfer fallback
async function sendMPToken(
  issuerWallet: Wallet,
  issuanceId: string,
  destination: string,
  amount: string
) {
  if (!issuanceId || issuanceId === 'n/a') throw new Error('IssuanceID manquant')
  if (!destination) throw new Error('Destination manquante')
  if (!amount) throw new Error('Montant manquant')

  const submitTransfer = async (txType: string) => {
    const tx: any = {
      TransactionType: txType,
      Account: issuerWallet.address,
      IssuanceID: issuanceId,
      Destination: destination,
      Amount: amount,
    }

    console.log(`→ Submit ${txType} vers ${destination} (${amount})`)
    return client.submitAndWait(tx, { autofill: true, wallet: issuerWallet })
  }

  try {
    return await submitTransfer('MPTokenMint')
  } catch (err: any) {
    console.warn('Mint failed, trying Transfer:', err?.message)
    return submitTransfer('MPTokenTransfer')
  }
}

async function main() {
  try {
    console.log('=== Envoi de MPToken ===')
    await client.connect()

    // Wallet issuer
    if (!process.env.ISSUER_SECRET)
      throw new Error('ISSUER_SECRET manquant dans .env')
    const issuerWallet = Wallet.fromSeed(process.env.ISSUER_SECRET)

    // Wallet holder
    const holderAddress =
      process.env.HOLDER_ADDRESS ??
      (() => {
        throw new Error('HOLDER_ADDRESS manquant dans .env')
      })()

    // Issuance ID (obligatoire)
    const issuanceId =
      process.env.MPTOKEN_ISSUANCE_ID ??
      (() => {
        throw new Error('MPTOKEN_ISSUANCE_ID manquant dans .env')
      })()

    // Montant à envoyer (en plus petite unité)
    const amount =
      process.env.MPTOKEN_AMOUNT ??
      (() => {
        throw new Error('MPTOKEN_AMOUNT manquant dans .env')
      })()

    console.log('Issuer:', issuerWallet.address)
    console.log('Holder:', holderAddress)
    console.log('IssuanceID:', issuanceId)
    console.log('Amount:', amount)

    const result: any = await sendMPToken(
      issuerWallet,
      issuanceId,
      holderAddress,
      amount
    )

    const txHash = result?.result?.tx_json?.hash ?? 'n/a'
    const status =
      result?.result?.meta?.TransactionResult ??
      result?.result?.engine_result ??
      'unknown'

    console.log('✅ Transaction Hash:', txHash)
    console.log('✅ Status:', status)
  } catch (e) {
    console.error('❌ Erreur:', e)
    process.exitCode = 1
  } finally {
    await client.disconnect().catch(() => {})
  }
}

if (require.main === module) main()
