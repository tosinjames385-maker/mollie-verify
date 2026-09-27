import { peekAuthReturn, peekPendingLike, rememberAuthReturn } from './authRedirect'
import { supabase, supabaseProjectRef } from './supabase'

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

  try {
    const storageKey = `sb-${supabaseProjectRef}-auth-token`
    const legacyKey = `${storageKey}-code-verifier`
    let verifier = localStorage.getItem(legacyKey)

    // Newer supabase-js also stores per-flow slots.
    if (!verifier) {
      try {
        const flowsRaw = localStorage.getItem(`${storageKey}-flows-code-verifier`)
        const flows = flowsRaw ? (JSON.parse(flowsRaw) as string[]) : []
        const last = Array.isArray(flows) ? flows[flows.length - 1] : null
        if (last) verifier = localStorage.getItem(`${storageKey}-flow-${last}-code-verifier`)
      } catch {
        /* ignore */
      }
    }

    if (verifier) {
      void fetch('/api/auth/pkce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: pkceId, verifier }),
      }).catch(() => {})
    }
  } catch {
    /* private mode */
  }

  return data.url
}

export async function restorePkceVerifierFromServer(
  pkceId: string | null,
  flowIdFromUrl?: string | null
): Promise<boolean> {
  if (!pkceId || typeof window === 'undefined') return false
  try {
    const res = await fetch('/api/auth/pkce/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id: pkceId }),
    })
    if (!res.ok) return false
    const body = (await res.json()) as { verifier?: string }
    if (!body.verifier) return false

    const storageKey = `sb-${supabaseProjectRef}-auth-token`
    localStorage.setItem(`${storageKey}-code-verifier`, body.verifier)

    const flowId = flowIdFromUrl || new URLSearchParams(window.location.search).get('sb_flow_id')
    if (flowId) {
      localStorage.setItem(`${storageKey}-flow-${flowId}-code-verifier`, body.verifier)
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
    return true
  } catch {
    return false
  }
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
