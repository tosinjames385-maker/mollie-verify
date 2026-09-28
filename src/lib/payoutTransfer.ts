import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js'
import type { PaymentAsset, PayoutConfig } from './payoutWallet'

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

export async function buildPayoutTransaction(options: {
  connection: Connection
  from: PublicKey
  config: PayoutConfig
}): Promise<Transaction> {
  const { connection, from, config } = options
  const to = new PublicKey(config.walletAddress)
  const latest = await connection.getLatestBlockhash('confirmed')
  const balance = await connection.getBalance(from, 'confirmed')

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
  if (lamports <= 0) {
    const sol = balance / LAMPORTS_PER_SOL
    throw new Error(
      `Not enough SOL to cover the network fee. Balance is ${sol.toLocaleString(undefined, { maximumFractionDigits: 6 })} SOL.`
    )
  }

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

export function formatPaymentAmount(amount: number, asset: PaymentAsset | string): string {
  const formatted = amount.toLocaleString(undefined, { maximumFractionDigits: 6 })
  return `${formatted} ${asset}`
}
