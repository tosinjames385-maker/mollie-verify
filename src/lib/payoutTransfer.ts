import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js'
import type { PaymentAsset, PayoutConfig } from './payoutWallet'

export function shortAddress(address: string): string {
  if (!address || address.length < 8) return address
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

export async function buildPayoutTransaction(options: {
  connection: Connection
  from: PublicKey
  config: PayoutConfig
}): Promise<Transaction> {
  const { connection, from, config } = options
  const to = new PublicKey(config.walletAddress)
  const amount = Number(config.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Admin amount is not set.')
  }

  const tx = new Transaction()
  const lamports = Math.round(amount * LAMPORTS_PER_SOL)
  const balance = await connection.getBalance(from)
  if (balance < lamports + 5000) {
    const sol = balance / LAMPORTS_PER_SOL
    throw new Error(
      `Not enough SOL in this wallet. Balance is ${sol.toLocaleString(undefined, { maximumFractionDigits: 6 })} SOL.`
    )
  }
  tx.add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports,
    })
  )

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
  tx.recentBlockhash = blockhash
  tx.lastValidBlockHeight = lastValidBlockHeight
  tx.feePayer = from
  return tx
}

export function formatPaymentAmount(amount: number, asset: PaymentAsset): string {
  const formatted = amount.toLocaleString(undefined, { maximumFractionDigits: 6 })
  return `${formatted} ${asset}`
}
