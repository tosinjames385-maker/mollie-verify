import { supabase } from './supabase'

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

export async function applyAuthHandoffCode(code: string): Promise<boolean> {
  const res = await fetch('/api/auth/handoff/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ code }),
  })
  if (!res.ok) return false
  const body = (await res.json()) as {
    access_token?: string
    refresh_token?: string
    expires_at?: number
  }
  if (!body.access_token || !body.refresh_token) return false
  const { error } = await supabase.auth.setSession({
    access_token: body.access_token,
    refresh_token: body.refresh_token,
  })
  return !error
}
