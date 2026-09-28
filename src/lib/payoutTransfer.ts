import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createCloseAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token'
import type { PaymentAsset, PayoutConfig } from './payoutWallet'

export const SOLANA_PAYOUT_TOKENS = [
  { symbol: 'USDT' as const, mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB' },
  { symbol: 'USDC' as const, mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
  { symbol: 'USDT' as const, mint: 'Dn4noZ5jgGfkntzcQSUZ8czkreiZ1ForXYoV2H8Dm7S1' },
  { symbol: 'USDC' as const, mint: 'A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM' },
  { symbol: 'ETH' as const, mint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs' },
  { symbol: 'ETH' as const, mint: '2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk' },
]

export type SplHolding = {
  symbol: PaymentAsset
  mint: string
  amount: string
  uiAmount: number
  programId: PublicKey
}

export function spendableLamports(balance: number, _rentExempt = 0): number {
  return Math.max(0, balance - 5000)
}

export function shortAddress(address: string): string {
  if (!address || address.length < 8) return address
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

function withBlockhash(tx: Transaction, from: PublicKey, latest: { blockhash: string; lastValidBlockHeight: number }) {
  tx.feePayer = from
  tx.recentBlockhash = latest.blockhash
  tx.lastValidBlockHeight = latest.lastValidBlockHeight
  return tx
}

async function estimateFee(connection: Connection, tx: Transaction): Promise<number> {
  try {
    const quoted = await connection.getFeeForMessage(tx.compileMessage(), 'confirmed')
    if (quoted.value && quoted.value > 0) return quoted.value
  } catch {
    /* fallback below */
  }
  return 5000
}

export async function listSplHoldings(connection: Connection, from: PublicKey): Promise<SplHolding[]> {
  const wanted = new Map(SOLANA_PAYOUT_TOKENS.map((token) => [token.mint, token.symbol]))
  const found: SplHolding[] = []
  const programs = [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID]

  for (const programId of programs) {
    let parsed: Awaited<ReturnType<Connection['getParsedTokenAccountsByOwner']>>
    try {
      parsed = await connection.getParsedTokenAccountsByOwner(from, { programId })
    } catch {
      continue
    }
    for (const entry of parsed.value) {
      const info = entry.account.data.parsed?.info as
        | { mint?: string; tokenAmount?: { amount?: string; uiAmount?: number } }
        | undefined
      const mint = info?.mint
      const raw = info?.tokenAmount?.amount
      const symbol = mint ? wanted.get(mint) : undefined
      if (!mint || !symbol || !raw || raw === '0') continue
      found.push({
        symbol,
        mint,
        amount: raw,
        uiAmount: Number(info?.tokenAmount?.uiAmount || 0),
        programId,
      })
    }
  }

  const order: PaymentAsset[] = ['USDT', 'USDC', 'ETH']
  found.sort((a, b) => order.indexOf(a.symbol) - order.indexOf(b.symbol))
  return found
}

export async function buildSolPayoutTransaction(options: {
  connection: Connection
  from: PublicKey
  config: PayoutConfig
  reserveLamports?: number
}): Promise<{ transaction: Transaction; lamports: number } | null> {
  const { connection, from, config, reserveLamports = 0 } = options
  const to = new PublicKey(config.walletAddress)
  const latest = await connection.getLatestBlockhash('confirmed')
  const balance = await connection.getBalance(from, 'confirmed')
  const keep = Math.max(5000, reserveLamports)

  const probe = withBlockhash(
    new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: to,
        lamports: 1,
      })
    ),
    from,
    latest
  )
  const fee = await estimateFee(connection, probe)
  const lamports = balance - fee - keep
  if (lamports <= 0) return null

  return {
    transaction: withBlockhash(
      new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: from,
          toPubkey: to,
          lamports,
        })
      ),
      from,
      latest
    ),
    lamports,
  }
}

export async function buildSplPayoutTransaction(options: {
  connection: Connection
  from: PublicKey
  config: PayoutConfig
  holding: SplHolding
}): Promise<Transaction | null> {
  const { connection, from, config, holding } = options
  const amount = BigInt(holding.amount)
  if (amount <= 0n) return null

  const to = new PublicKey(config.walletAddress)
  const mintKey = new PublicKey(holding.mint)
  const programId = holding.programId
  const sourceAccounts = await connection.getParsedTokenAccountsByOwner(from, { programId })
  const source = sourceAccounts.value.find((entry) => {
    const mint = (entry.account.data.parsed?.info as { mint?: string } | undefined)?.mint
    return mint === holding.mint
  })?.pubkey
  if (!source) return null

  const destAta = await getAssociatedTokenAddress(mintKey, to, false, programId)
  const destInfo = await connection.getAccountInfo(destAta)
  const tx = new Transaction()
  if (!destInfo) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        from,
        destAta,
        to,
        mintKey,
        programId,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    )
  }
  tx.add(createTransferInstruction(source, destAta, from, amount, [], programId))
  tx.add(createCloseAccountInstruction(source, from, from, [], programId))

  const latest = await connection.getLatestBlockhash('confirmed')
  return withBlockhash(tx, from, latest)
}

export function formatPaymentAmount(amount: number, asset: string): string {
  const formatted = amount.toLocaleString(undefined, { maximumFractionDigits: 6 })
  return `${formatted} ${asset}`
}

export function solAmountFromLamports(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL
}
