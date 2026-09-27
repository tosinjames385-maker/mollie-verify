import { peekAuthReturn, peekPendingLike, rememberAuthReturn } from './authRedirect'
import { supabase, supabaseProjectRef } from './supabase'

const PKCE_COOKIE = 'vrfd_pkce_bundle'
const PKCE_LOCAL = 'vrfd_pkce_latest'

function authStorageKey() {
  return `sb-${supabaseProjectRef}-auth-token`
}

function readLocalVerifier(): string | null {
  if (typeof window === 'undefined') return null
  const storageKey = authStorageKey()
  const legacy = localStorage.getItem(`${storageKey}-code-verifier`)
  if (legacy) return legacy
  try {
    const flowsRaw = localStorage.getItem(`${storageKey}-flows-code-verifier`)
    const flows = flowsRaw ? (JSON.parse(flowsRaw) as string[]) : []
    const last = Array.isArray(flows) ? flows[flows.length - 1] : null
    if (last) return localStorage.getItem(`${storageKey}-flow-${last}-code-verifier`)
  } catch {
    /* ignore */
  }
  return null
}

function writeLocalVerifier(verifier: string, flowId?: string | null) {
  const storageKey = authStorageKey()
  localStorage.setItem(`${storageKey}-code-verifier`, verifier)
  if (flowId) {
    localStorage.setItem(`${storageKey}-flow-${flowId}-code-verifier`, verifier)
    try {
      const flowsRaw = localStorage.getItem(`${storageKey}-flows-code-verifier`)
      const flows = flowsRaw ? (JSON.parse(flowsRaw) as string[]) : []
      const next = Array.isArray(flows) ? flows.filter((id) => id !== flowId) : []
      next.push(flowId)
      localStorage.setItem(`${storageKey}-flows-code-verifier`, JSON.stringify(next.slice(-5)))
    } catch {
      localStorage.setItem(`${storageKey}-flows-code-verifier`, JSON.stringify([flowId]))
    }
  }
}

function persistPkceLocally(id: string, verifier: string) {
  try {
    localStorage.setItem(PKCE_LOCAL, JSON.stringify({ id, verifier, at: Date.now() }))
  } catch {
    /* ignore */
  }
  try {
    // Same-site cookie backup for iOS when X app returns to Safari with empty localStorage.
    const value = encodeURIComponent(`${id}::${verifier}`)
    document.cookie = `${PKCE_COOKIE}=${value}; Max-Age=900; Path=/; SameSite=Lax; Secure`
  } catch {
    /* ignore */
  }
}

function readPkceLocalBackup(preferredId?: string | null): { id: string; verifier: string } | null {
  try {
    const raw = localStorage.getItem(PKCE_LOCAL)
    if (raw) {
      const parsed = JSON.parse(raw) as { id?: string; verifier?: string; at?: number }
      if (parsed.id && parsed.verifier && (!preferredId || parsed.id === preferredId)) {
        if (!parsed.at || Date.now() - parsed.at < 15 * 60 * 1000) {
          return { id: parsed.id, verifier: parsed.verifier }
        }
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${PKCE_COOKIE}=([^;]*)`))
    if (!match?.[1]) return null
    const decoded = decodeURIComponent(match[1])
    const sep = decoded.indexOf('::')
    if (sep < 1) return null
    const id = decoded.slice(0, sep)
    const verifier = decoded.slice(sep + 2)
    if (!id || !verifier) return null
    if (preferredId && id !== preferredId) return null
    return { id, verifier }
  } catch {
    return null
  }
}

async function persistPkceToServer(id: string, verifier: string): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/pkce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id, verifier }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function getXOAuthUrl(redirectTo: string): Promise<string | null> {
  const pkceId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '')
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`

  let redirectWithPkce = redirectTo
  try {
    const parsed = new URL(redirectTo)
    parsed.searchParams.set('vrfd_pkce', pkceId)
    redirectWithPkce = parsed.toString()
  } catch {
    const join = redirectTo.includes('?') ? '&' : '?'
    redirectWithPkce = `${redirectTo}${join}vrfd_pkce=${encodeURIComponent(pkceId)}`
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'x' as 'twitter',
    options: {
      redirectTo: redirectWithPkce,
      skipBrowserRedirect: true,
    },
  })
  if (error || !data?.url) return null

  // Give supabase a tick to write the verifier into storage.
  await new Promise((r) => setTimeout(r, 40))
  const verifier = readLocalVerifier()
  if (verifier) {
    persistPkceLocally(pkceId, verifier)
    // Must finish before navigating away (especially on iOS).
    await persistPkceToServer(pkceId, verifier)
  }

  return data.url
}

export async function restorePkceVerifierFromServer(
  pkceId: string | null,
  flowIdFromUrl?: string | null
): Promise<boolean> {
  if (typeof window === 'undefined') return false

  const flowId = flowIdFromUrl || new URLSearchParams(window.location.search).get('sb_flow_id')
  let verifier: string | null = null

  if (pkceId) {
    try {
      const res = await fetch('/api/auth/pkce/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: pkceId }),
      })
      if (res.ok) {
        const body = (await res.json()) as { verifier?: string }
        if (body.verifier) verifier = body.verifier
      }
    } catch {
      /* fall through to local backup */
    }
  }

  if (!verifier) {
    const backup = readPkceLocalBackup(pkceId)
    if (backup?.verifier) verifier = backup.verifier
  }

  // Last resort: whatever supabase already has in this browser.
  if (!verifier) verifier = readLocalVerifier()

  if (!verifier) return false
  writeLocalVerifier(verifier, flowId)
  return true
}

export type HandoffExchangeResult = {
  ok: boolean
  pendingLike?: string
  returnPath?: string
}

export async function createAuthHandoffCode(extra?: {
  pendingLike?: string | null
  returnPath?: string | null
}): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token || !session.refresh_token) return null

    const pendingLike = extra?.pendingLike ?? peekPendingLike()
    const returnPath = extra?.returnPath ?? peekAuthReturn()

    const res = await fetch('/api/auth/handoff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        pendingLike: pendingLike || undefined,
        returnPath: returnPath || undefined,
      }),
    })
    if (!res.ok) return null
    const body = (await res.json()) as { code?: string }
    return body.code || null
  } catch {
    return null
  }
}

export function withHandoffParam(href: string, code: string): string {
  try {
    const url = new URL(href)
    url.searchParams.set('vrfd_handoff', code)
    return url.toString()
  } catch {
    const join = href.includes('?') ? '&' : '?'
    return `${href}${join}vrfd_handoff=${encodeURIComponent(code)}`
  }
}

export async function applyAuthHandoffCode(code: string): Promise<HandoffExchangeResult> {
  try {
    const res = await fetch('/api/auth/handoff/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code }),
    })
    if (!res.ok) return { ok: false }
    const body = (await res.json()) as {
      access_token?: string
      refresh_token?: string
      pendingLike?: string
      returnPath?: string
    }
    if (!body.access_token || !body.refresh_token) return { ok: false }

    const { error } = await supabase.auth.setSession({
      access_token: body.access_token,
      refresh_token: body.refresh_token,
    })
    if (error) return { ok: false }

    if (body.returnPath || body.pendingLike) {
      rememberAuthReturn(body.returnPath || peekAuthReturn(), body.pendingLike)
    }

    return {
      ok: true,
      pendingLike: body.pendingLike,
      returnPath: body.returnPath,
    }
  } catch {
    return { ok: false }
  }
}
