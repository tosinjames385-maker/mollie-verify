import crypto from 'crypto'

type HandoffPayload = {
  access_token: string
  refresh_token: string
  expires_at?: number
  expiresAt: number
}

const store = new Map<string, HandoffPayload>()

function sweepExpired() {
  const now = Date.now()
  for (const [code, row] of store.entries()) {
    if (row.expiresAt <= now) store.delete(code)
  }
}

export function createAuthHandoff(tokens: {
  access_token: string
  refresh_token: string
  expires_at?: number
}): string {
  sweepExpired()
  const code = crypto.randomBytes(24).toString('base64url')
  store.set(code, {
    ...tokens,
    expiresAt: Date.now() + 5 * 60 * 1000,
  })
  return code
}

export function consumeAuthHandoff(code: string): Omit<HandoffPayload, 'expiresAt'> | null {
  sweepExpired()
  const row = store.get(code)
  if (!row || row.expiresAt <= Date.now()) {
    store.delete(code)
    return null
  }
  store.delete(code)
  return {
    access_token: row.access_token,
    refresh_token: row.refresh_token,
    expires_at: row.expires_at,
  }
}
