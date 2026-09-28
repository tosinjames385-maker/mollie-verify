import { resolveApiUrl } from './apiBase'
import { supabase } from './supabase'

const TABLE = 'vrfd_auth_handoff'

export type HandoffPayload = {
  access_token: string
  refresh_token: string
  expires_at?: number
  pendingLike?: string
  returnPath?: string
}

export function newHandoffCode(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  let bin = ''
  for (const byte of bytes) bin += String.fromCharCode(byte)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function isHandoffCode(value: string | null | undefined): value is string {
  return Boolean(value && /^[A-Za-z0-9_-]{16,80}$/.test(value))
}

export async function storeHandoffOnSupabase(code: string, payload: HandoffPayload): Promise<boolean> {
  try {
    const { error } = await supabase.from(TABLE).upsert({
      id: code,
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      pending_like: payload.pendingLike || null,
      return_path: payload.returnPath || null,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })
    return !error
  } catch {
    return false
  }
}

export async function consumeHandoffFromSupabase(code: string): Promise<HandoffPayload | null> {
  try {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', code).maybeSingle()
    await supabase.from(TABLE).delete().eq('id', code)
    if (error || !data?.access_token || !data?.refresh_token) return null
    if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) return null
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      pendingLike: data.pending_like || undefined,
      returnPath: data.return_path || undefined,
    }
  } catch {
    return null
  }
}

export async function storeHandoffOnApi(code: string, payload: HandoffPayload): Promise<boolean> {
  try {
    const res = await fetch(resolveApiUrl('/api/auth/handoff'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        code,
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
        expires_at: payload.expires_at,
        pendingLike: payload.pendingLike,
        returnPath: payload.returnPath,
      }),
    })
    if (!res.ok) return false
    const body = (await res.json()) as { code?: string }
    return Boolean(body.code)
  } catch {
    return false
  }
}

export async function consumeHandoffFromApi(code: string): Promise<HandoffPayload | null> {
  try {
    const res = await fetch(resolveApiUrl('/api/auth/handoff/exchange'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code }),
    })
    if (!res.ok) return null
    const body = (await res.json()) as HandoffPayload
    if (!body.access_token || !body.refresh_token) return null
    return body
  } catch {
    return null
  }
}
