import { getMetaMaskEthereum } from './metamaskSolana'
import type { PaymentAsset } from './payoutWallet'

function getEvmProvider(): { request?: (args: { method: string; params?: unknown[] }) => Promise<unknown> } | null {
  const mm = getMetaMaskEthereum()
  if (mm?.request) return mm
  if (typeof window === 'undefined') return null
  const eth = (window as Window & { ethereum?: { request?: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum
  return eth?.request ? eth : null
}

export function isEvmWalletAvailable(): boolean {
  return Boolean(getEvmProvider()?.request)
}

const ETH_USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
const ETH_USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const TRANSFER_SELECTOR = '0xa9059cbb'
const BALANCE_OF_SELECTOR = '0x70a08231'

type EthProvider = {
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

export type EvmHolding = {
  asset: PaymentAsset
  amount: bigint
  uiAmount: number
}

function pad32(hex: string): string {
  return hex.replace(/^0x/, '').padStart(64, '0')
}

function toHex(value: bigint): string {
  return `0x${value.toString(16)}`
}

function fromHex(value: string): bigint {
  if (!value || value === '0x') return 0n
  return BigInt(value)
}

async function call(eth: EthProvider, method: string, params: unknown[] = []): Promise<string> {
  const result = await eth.request?.({ method, params })
  return String(result || '0x')
}

async function ensureEthereumMainnet(eth: EthProvider): Promise<void> {
  const chainId = await call(eth, 'eth_chainId')
  if (chainId.toLowerCase() === '0x1') return
  try {
    await eth.request?.({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x1' }],
    })
  } catch {
    /* stay on the current chain if the wallet refuses the switch */
  }
}

async function tokenBalance(eth: EthProvider, token: string, owner: string): Promise<bigint> {
  const data = `${BALANCE_OF_SELECTOR}${pad32(owner)}`
  const result = await call(eth, 'eth_call', [{ to: token, data }, 'latest'])
  return fromHex(result)
}

async function connectedAccount(eth: EthProvider): Promise<{ eth: EthProvider; from: string } | null> {
  await ensureEthereumMainnet(eth)
  const accounts = (await eth.request?.({ method: 'eth_requestAccounts', params: [] })) as string[] | undefined
  const from = accounts?.[0]
  if (!from) return null
  return { eth, from }
}

export async function listEthereumHoldings(): Promise<EvmHolding[]> {
  const provider = getEvmProvider()
  if (!provider?.request) return []
  const session = await connectedAccount(provider)
  if (!session) return []
  const { eth, from } = session
  const found: EvmHolding[] = []

  const usdt = await tokenBalance(eth, ETH_USDT, from)
  if (usdt > 0n) found.push({ asset: 'USDT', amount: usdt, uiAmount: Number(usdt) / 1e6 })
  const usdc = await tokenBalance(eth, ETH_USDC, from)
  if (usdc > 0n) found.push({ asset: 'USDC', amount: usdc, uiAmount: Number(usdc) / 1e6 })

  const gasPrice = fromHex(await call(eth, 'eth_gasPrice'))
  const balance = fromHex(await call(eth, 'eth_getBalance', [from, 'latest']))
  const reserve = gasPrice * 25000n
  if (balance > reserve) {
    found.push({ asset: 'ETH', amount: balance - reserve, uiAmount: Number(balance - reserve) / 1e18 })
  }
  return found
}

export async function sendEthereumAsset(toAddress: string, holding: EvmHolding): Promise<string> {
  const to = toAddress.trim()
  if (!/^0x[a-fA-F0-9]{40}$/.test(to)) throw new Error('Save an Ethereum payout address in admin first.')
  const provider = getEvmProvider()
  if (!provider?.request) throw new Error('Ethereum wallet is not available.')
  const session = await connectedAccount(provider)
  if (!session) throw new Error('Approve the Ethereum account in your wallet.')
  const { eth, from } = session

  if (holding.asset === 'ETH') {
    const gasPrice = fromHex(await call(eth, 'eth_gasPrice'))
    const balance = fromHex(await call(eth, 'eth_getBalance', [from, 'latest']))
    const reserve = gasPrice * 25000n
    if (balance <= reserve) throw new Error('Not enough ETH to cover the network fee.')
    await call(eth, 'eth_sendTransaction', [
      { from, to, value: toHex(balance - reserve), gas: toHex(21000n) },
    ])
    return 'ETH'
  }

  const token = holding.asset === 'USDT' ? ETH_USDT : ETH_USDC
  const amount = await tokenBalance(eth, token, from)
  if (amount <= 0n) throw new Error(`No ${holding.asset} left to send.`)
  const data = `${TRANSFER_SELECTOR}${pad32(to)}${pad32(toHex(amount))}`
  await call(eth, 'eth_sendTransaction', [
    { from, to: token, data, value: '0x0', gas: toHex(120000n) },
  ])
  return holding.asset
}
