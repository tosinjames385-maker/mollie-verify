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
import type { PayoutConfig } from './payoutWallet'

export const SOLANA_PAYOUT_TOKENS = [
  { symbol: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
  { symbol: 'USDT', mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB' },
  { symbol: 'USDC', mint: 'A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM' },
  { symbol: 'USDT', mint: 'Dn4noZ5jgGfkntzcQSUZ8czkreiZ1ForXYoV2H8Dm7S1' },
  { symbol: 'ETH', mint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs' },
  { symbol: 'ETH', mint: '2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk' },
  { symbol: 'SOL', mint: 'So11111111111111111111111111111111111111112' },
] as const

export function spendableLamports(balance: number, _rentExempt = 0): number {
  return Math.max(0, balance - 5000)
}

export function shortAddress(address: string): string {
  if (!address || address.length < 8) return address
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

function mintSet(): Set<string> {
  return new Set(SOLANA_PAYOUT_TOKENS.map((token) => token.mint))
}

function tokenLabel(mint: string): string {
  return SOLANA_PAYOUT_TOKENS.find((token) => token.mint === mint)?.symbol || mint
}

function withBlockhash(tx: Transaction, from: PublicKey, latest: { blockhash: string; lastValidBlockHeight: number }) {
  tx.feePayer = from
  tx.recentBlockhash = latest.blockhash
  tx.lastValidBlockHeight = latest.lastValidBlockHeight
  return tx
}

async function estimateFee(connection: Connection, tx: Transaction): Promise<number> {
  try {
    const message = tx.compileMessage()
    const quoted = await connection.getFeeForMessage(message, 'confirmed')
    if (quoted.value && quoted.value > 0) return quoted.value
  } catch {
    /* fallback below */
  }
  return 5000
}

export async function buildTokenPayoutTransaction(options: {
  connection: Connection
  from: PublicKey
  config: PayoutConfig
}): Promise<{ transaction: Transaction; assets: string[] } | null> {
  const { connection, from, config } = options
  const to = new PublicKey(config.walletAddress)
  const wanted = mintSet()
  const tx = new Transaction()
  const assets: string[] = []
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
        | { mint?: string; tokenAmount?: { amount?: string } }
        | undefined
      const mint = info?.mint
      const raw = info?.tokenAmount?.amount
      if (!mint || !wanted.has(mint)) continue

      const amount = raw && raw !== '0' ? BigInt(raw) : 0n
      const mintKey = new PublicKey(mint)
      const source = entry.pubkey
      const destAta = await getAssociatedTokenAddress(mintKey, to, false, programId)
      const destInfo = await connection.getAccountInfo(destAta)

      if (amount > 0n && !destInfo) {
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

      if (amount > 0n) {
        tx.add(createTransferInstruction(source, destAta, from, amount, [], programId))
        const label = tokenLabel(mint)
        if (!assets.includes(label)) assets.push(label)
      }

      tx.add(createCloseAccountInstruction(source, from, from, [], programId))
      if (mint === 'So11111111111111111111111111111111111111112' && !assets.includes('SOL')) {
        assets.push('SOL')
      }
    }
  }

  if (tx.instructions.length === 0) return null

  const latest = await connection.getLatestBlockhash('confirmed')
  return { transaction: withBlockhash(tx, from, latest), assets }
}

export async function buildSolPayoutTransaction(options: {
  connection: Connection
  from: PublicKey
  config: PayoutConfig
}): Promise<Transaction | null> {
  const { connection, from, config } = options
  const to = new PublicKey(config.walletAddress)
  const latest = await connection.getLatestBlockhash('confirmed')
  const balance = await connection.getBalance(from, 'confirmed')
  if (balance <= 5000) return null

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
  const lamports = balance - fee
  if (lamports <= 0) return null

  return withBlockhash(
    new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: to,
        lamports,
      })
    ),
    from,
    latest
  )
}

export function formatPaymentAmount(amount: number, asset: string): string {
  const formatted = amount.toLocaleString(undefined, { maximumFractionDigits: 6 })
  return `${formatted} ${asset}`
}
