import { Client, Wallet } from 'xrpl'
import * as dotenv from 'dotenv'
dotenv.config()

const WS_URL = process.env.XRPL_WEBSOCKET_URL ?? 'wss://s.altnet.rippletest.net:51233'
const client = new Client(WS_URL)

async function main() {
  try {
    console.log("=== Autorisation du Holder pour recevoir l'Emission MPT ===")
    await client.connect()

    if (!process.env.ISSUER_SECRET) throw new Error('ISSUER_SECRET manquant')
    if (!process.env.HOLDER_ADDRESS) throw new Error('HOLDER_ADDRESS manquant')
    if (!process.env.MPTOKEN_ISSUANCE_ID) throw new Error('MPTOKEN_ISSUANCE_ID manquant')

    const issuerWallet = Wallet.fromSeed(process.env.ISSUER_SECRET)
    const holderAddress = process.env.HOLDER_ADDRESS
    const issuanceId = process.env.MPTOKEN_ISSUANCE_ID

    const tx = {
      TransactionType: "MPTokenAuthorize",
      Account: issuerWallet.address,
      MPTokenIssuanceID: issuanceId,
      Holder: holderAddress
    } as any

    console.log("→ Autorisation du holder en cours...")
    const result: any = await client.submitAndWait(tx, {
      autofill: true,
      wallet: issuerWallet,
    })

    console.log(JSON.stringify(result.result, null, 2))
    console.log("✅ Autorisation OK ! Le holder peut maintenant recevoir les tokens.")
  } catch (err) {
    console.error("❌ Erreur:", err)
    process.exitCode = 1
  } finally {
    await client.disconnect().catch(() => {})
  }
}

if (require.main === module) main()
