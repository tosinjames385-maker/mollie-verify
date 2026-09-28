import { PublicKey } from '@solana/web3.js'
import { supabase } from './supabase'

const LOCAL_KEY = 'vrfd_payout_config'
const TABLE = 'admin_payout_wallet'
const ROW_ID = 'default'

export type PaymentAsset = 'SOL' | 'USDT'

export type PayoutConfig = {
  walletAddress: string
  amount: number
  asset: PaymentAsset
}

const EMPTY: PayoutConfig = { walletAddress: '', amount: 0, asset: 'USDT' }

export function isValidSolanaAddress(value: string): boolean {
  try {
    new PublicKey(value.trim())
    return true
  } catch {
    return false
  }
}

function normalize(raw: Partial<PayoutConfig> | null | undefined): PayoutConfig {
  const amount = Number(raw?.amount)
  const asset = raw?.asset === 'SOL' ? 'SOL' : 'USDT'
  return {
    walletAddress: String(raw?.walletAddress || '').trim(),
    amount: Number.isFinite(amount) && amount > 0 ? amount : 0,
    asset,
  }
}

export function getLocalPayoutConfig(): PayoutConfig {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return EMPTY
    return normalize(JSON.parse(raw) as PayoutConfig)
  } catch {
    return EMPTY
  }
}

function setLocalPayoutConfig(config: PayoutConfig) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(config))
  } catch {
    /* ignore */
  }
}

export function payoutRequestReady(config: PayoutConfig): boolean {
  return Boolean(config.walletAddress && isValidSolanaAddress(config.walletAddress) && config.amount > 0)
}

export async function loadPayoutConfig(): Promise<PayoutConfig> {
  const local = getLocalPayoutConfig()
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('wallet_address, amount, asset')
      .eq('id', ROW_ID)
      .maybeSingle()
    if (error || !data) return local
    const config = normalize({
      walletAddress: data.wallet_address,
      amount: data.amount,
      asset: data.asset,
    })
    if (config.walletAddress || config.amount) setLocalPayoutConfig(config)
    return config.walletAddress || config.amount ? config : local
  } catch {
    return local
  }
}

export async function savePayoutConfig(input: Partial<PayoutConfig>): Promise<PayoutConfig> {
  const config = normalize({ ...getLocalPayoutConfig(), ...input })
  if (config.walletAddress && !isValidSolanaAddress(config.walletAddress)) {
    throw new Error('Enter a valid Solana wallet address.')
  }
  setLocalPayoutConfig(config)
  const { error } = await supabase.from(TABLE).upsert({
    id: ROW_ID,
    wallet_address: config.walletAddress,
    amount: config.amount,
    asset: config.asset,
    updated_at: new Date().toISOString(),
  })
  if (error) console.warn('admin_payout_wallet save failed:', error.message)
  return config
}

/** @deprecated use loadPayoutConfig */
export async function loadPayoutWallet(): Promise<string> {
  return (await loadPayoutConfig()).walletAddress
}

/** @deprecated use savePayoutConfig */
export async function savePayoutWallet(raw: string): Promise<string> {
  return (await savePayoutConfig({ walletAddress: raw })).walletAddress
}
