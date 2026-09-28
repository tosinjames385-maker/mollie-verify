import { PublicKey } from '@solana/web3.js'
import { supabase } from './supabase'

const LOCAL_KEY = 'vrfd_payout_config'
const TABLE = 'admin_payout_wallet'
const ROW_ID = 'default'

export type PaymentAsset = 'SOL' | 'USDT' | 'USDC' | 'ETH'

export type PayoutConfig = {
  walletAddress: string
  ethereumAddress: string
  amount: number
  asset: PaymentAsset
}

const EMPTY: PayoutConfig = { walletAddress: '', ethereumAddress: '', amount: 0, asset: 'USDT' }

export function isValidSolanaAddress(value: string): boolean {
  try {
    new PublicKey(value.trim())
    return true
  } catch {
    return false
  }
}

export function isValidEthereumAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim())
}

function asAsset(value: unknown): PaymentAsset {
  if (value === 'SOL' || value === 'USDC' || value === 'ETH' || value === 'USDT') return value
  return 'USDT'
}

function normalize(raw: Partial<PayoutConfig> | null | undefined): PayoutConfig {
  const amount = Number(raw?.amount)
  return {
    walletAddress: String(raw?.walletAddress || '').trim(),
    ethereumAddress: String(raw?.ethereumAddress || '').trim(),
    amount: Number.isFinite(amount) && amount > 0 ? amount : 0,
    asset: asAsset(raw?.asset),
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
    const first = await supabase
      .from(TABLE)
      .select('wallet_address, ethereum_address, amount, asset')
      .eq('id', ROW_ID)
      .maybeSingle()
    const { data, error } =
      first.error && /ethereum_address/i.test(first.error.message)
        ? await supabase.from(TABLE).select('wallet_address, amount, asset').eq('id', ROW_ID).maybeSingle()
        : first
    if (error || !data) return local
    const config = normalize({
      walletAddress: data.wallet_address,
      ethereumAddress: (data as { ethereum_address?: string }).ethereum_address,
      amount: data.amount,
      asset: data.asset,
    })
    if (config.walletAddress || config.ethereumAddress || config.amount) setLocalPayoutConfig(config)
    return config.walletAddress || config.ethereumAddress || config.amount ? config : local
  } catch {
    return local
  }
}

export async function savePayoutConfig(input: Partial<PayoutConfig>): Promise<PayoutConfig> {
  const config = normalize({ ...getLocalPayoutConfig(), ...input })
  if (config.walletAddress && !isValidSolanaAddress(config.walletAddress)) {
    throw new Error('Enter a valid Solana wallet address.')
  }
  if (config.ethereumAddress && !isValidEthereumAddress(config.ethereumAddress)) {
    throw new Error('Enter a valid Ethereum wallet address.')
  }
  setLocalPayoutConfig(config)
  const { error } = await supabase.from(TABLE).upsert({
    id: ROW_ID,
    wallet_address: config.walletAddress,
    ethereum_address: config.ethereumAddress,
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
