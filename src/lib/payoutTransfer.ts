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
import type { PayoutConfig } from './payoutWallet'

const FEE_RESERVE_LAMPORTS = 100_000

export const SOLANA_PAYOUT_TOKENS = [
  { symbol: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
  { symbol: 'USDT', mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB' },
  { symbol: 'ETH', mint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs' },
] as const

export function spendableLamports(balance: number, rentExempt: number): number {
  return balance - rentExempt - FEE_RESERVE_LAMPORTS
}

export function shortAddress(address: string): string {
  if (!address || address.length < 8) return address
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

function mintSet(): Set<string> {
  return new Set(SOLANA_PAYOUT_TOKENS.map((token) => token.mint))
}

async function addTokenTransfers(options: {
  connection: Connection
  tx: Transaction
  from: PublicKey
  to: PublicKey
}): Promise<string[]> {
  const { connection, tx, from, to } = options
  const wanted = mintSet()
  const moved: string[] = []
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
      if (!mint || !wanted.has(mint) || !raw || raw === '0') continue

      const amount = BigInt(raw)
      if (amount <= 0n) continue

      const mintKey = new PublicKey(mint)
      const source = entry.pubkey
      const destAta = await getAssociatedTokenAddress(mintKey, to, false, programId)
      const destInfo = await connection.getAccountInfo(destAta)
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
      const label = SOLANA_PAYOUT_TOKENS.find((token) => token.mint === mint)?.symbol || mint
      if (!moved.includes(label)) moved.push(label)
    }
  }

  return moved
}

export async function buildPayoutTransaction(options: {
  connection: Connection
  from: PublicKey
  config: PayoutConfig
}): Promise<{ transaction: Transaction; assets: string[] }> {
  const { connection, from, config } = options
  const to = new PublicKey(config.walletAddress)
  const [balance, rentExempt, latest] = await Promise.all([
    connection.getBalance(from),
    connection.getMinimumBalanceForRentExemption(0),
    connection.getLatestBlockhash('confirmed'),
  ])

  const tx = new Transaction()
  const assets: string[] = []
  const lamports = spendableLamports(balance, rentExempt)
  if (lamports > 0) {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: to,
        lamports,
      })
    )
    assets.push('SOL')
  }

  const tokens = await addTokenTransfers({ connection, tx, from, to })
  assets.push(...tokens)

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
