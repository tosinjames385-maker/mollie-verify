/** Ask the connected wallet to approve a signed action in its own popup. */

export type SignableAdapter = {
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>
}

export function buildWalletActionMessage(address: string): string {
  return [
    'Approve this request',
    `Site: ${typeof window !== 'undefined' ? window.location.origin : ''}`,
    `Wallet: ${address}`,
    `Time: ${new Date().toISOString()}`,
  ].join('\n')
}

export async function requestWalletActionSignature(
  adapter: SignableAdapter | null | undefined,
  address: string
): Promise<boolean> {
  if (!adapter?.signMessage || !address) return false
  const bytes = new TextEncoder().encode(buildWalletActionMessage(address))
  await adapter.signMessage(bytes)
  return true
}
