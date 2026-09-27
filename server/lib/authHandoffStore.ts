import crypto from 'crypto'
import { prisma } from '../prisma'

type HandoffInput = {
  access_token: string
  refresh_token: string
  expires_at?: number
  pendingLike?: string
  returnPath?: string
}

type HandoffResult = {
  access_token: string
  refresh_token: string
  expires_at?: number
  pendingLike?: string
  returnPath?: string
}

const memory = new Map<string, HandoffInput & { expiresAt: number }>()

function sweepMemory() {
  const now = Date.now()
  for (const [code, row] of memory.entries()) {
    if (row.expiresAt <= now) memory.delete(code)
  }
}

export async function createAuthHandoff(tokens: HandoffInput): Promise<string> {
  const code = crypto.randomBytes(24).toString('base64url')
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  try {
    await prisma.authHandoff.create({
      data: {
        code,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAtTs: tokens.expires_at ?? null,
        pendingLike: tokens.pendingLike ?? null,
        returnPath: tokens.returnPath ?? null,
        expiresAt,
      },
    })
    return code
  } catch (err) {
    console.warn('Auth handoff saved in memory only (database unavailable):', (err as Error).message)
    sweepMemory()
    memory.set(code, { ...tokens, expiresAt: expiresAt.getTime() })
    return code
  }
}

export async function consumeAuthHandoff(code: string): Promise<HandoffResult | null> {
  try {
    const row = await prisma.authHandoff.findUnique({ where: { code } })
    if (row) {
      await prisma.authHandoff.delete({ where: { id: row.id } }).catch(() => {})
      if (row.expiresAt.getTime() <= Date.now()) return null
      return {
        access_token: row.accessToken,
        refresh_token: row.refreshToken,
        expires_at: row.expiresAtTs ?? undefined,
        pendingLike: row.pendingLike ?? undefined,
        returnPath: row.returnPath ?? undefined,
      }
    }
  } catch (err) {
    console.warn('Auth handoff DB read failed, trying memory:', (err as Error).message)
  }

  sweepMemory()
  const mem = memory.get(code)
  if (!mem || mem.expiresAt <= Date.now()) {
    memory.delete(code)
    return null
  }
  memory.delete(code)
  return {
    access_token: mem.access_token,
    refresh_token: mem.refresh_token,
    expires_at: mem.expires_at,
    pendingLike: mem.pendingLike,
    returnPath: mem.returnPath,
  }
}
