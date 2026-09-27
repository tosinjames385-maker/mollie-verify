import { supabase } from './supabase'
import { peekAuthReturn, peekPendingLike, rememberAuthReturn } from './authRedirect'

export async function getXOAuthUrl(redirectTo: string): Promise<string | null> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'x' as 'twitter',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  })
  if (error || !data?.url) return null
  return data.url
}

export type HandoffExchangeResult = {
  ok: boolean
  pendingLike?: string
  returnPath?: string
}

/** Create a short-lived server handoff code from the current X session. */
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
