import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js'
import type { PaymentAsset, PayoutConfig } from './payoutWallet'

export const USDT_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
export const USDT_DECIMALS = 6

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

  if (config.asset === 'SOL') {
    const lamports = Math.round(amount * LAMPORTS_PER_SOL)
    const balance = await connection.getBalance(from)
    if (balance < lamports + 5000) {
      throw new Error('Not enough SOL in this wallet to cover the request.')
    }
    tx.add(
      SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: to,
        lamports,
      })
    )
  } else {
    const spl = await import('@solana/spl-token')
    const mint = new PublicKey(USDT_MINT)
    const fromAta = await spl.getAssociatedTokenAddress(mint, from)
    const toAta = await spl.getAssociatedTokenAddress(mint, to)
    const units = BigInt(Math.round(amount * 10 ** USDT_DECIMALS))

    let fromAmount = 0n
    try {
      const fromAccount = await spl.getAccount(connection, fromAta)
      fromAmount = fromAccount.amount
    } catch {
      throw new Error('This wallet has no USDT account.')
    }
    if (fromAmount < units) {
      throw new Error('Not enough USDT in this wallet for the requested amount.')
    }

    try {
      await spl.getAccount(connection, toAta)
    } catch {
      tx.add(spl.createAssociatedTokenAccountInstruction(from, toAta, to, mint))
    }
    tx.add(spl.createTransferInstruction(fromAta, toAta, from, units))
  }

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
