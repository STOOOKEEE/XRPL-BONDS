import { isInstalled, getAddress, getNetwork } from "@gemwallet/api"

export async function connectGemWallet(): Promise<string> {
  const isGemInstalled = await isInstalled()

  if (!isGemInstalled) {
    throw new Error("GemWallet is not installed. Please install GemWallet extension to continue.")
  }

  const addressResponse = await getAddress()
  if (!addressResponse.result?.address) {
    throw new Error("Failed to get wallet address")
  }

  const networkResponse = await getNetwork()
  if (networkResponse.result?.network !== "TESTNET") {
    throw new Error("Please switch to XRPL Testnet in GemWallet")
  }

  return addressResponse.result.address
}

export function formatAddress(address: string): string {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
