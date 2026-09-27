import crypto from 'crypto'
import { prisma } from '../prisma'

const memory = new Map<string, { verifier: string; expiresAt: number }>()

function sweep() {
  const now = Date.now()
  for (const [id, row] of memory.entries()) {
    if (row.expiresAt <= now) memory.delete(id)
  }
}

export async function storePkceVerifier(id: string, verifier: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
  try {
    await prisma.authPkce.upsert({
      where: { id },
      create: { id, verifier, expiresAt },
      update: { verifier, expiresAt },
    })
  } catch (err) {
    console.warn('PKCE verifier saved in memory only:', (err as Error).message)
    sweep()
    memory.set(id, { verifier, expiresAt: expiresAt.getTime() })
  }
}

export async function consumePkceVerifier(id: string): Promise<string | null> {
  try {
    const row = await prisma.authPkce.findUnique({ where: { id } })
    if (row) {
      await prisma.authPkce.delete({ where: { id } }).catch(() => {})
      if (row.expiresAt.getTime() <= Date.now()) return null
      return row.verifier
    }
  } catch (err) {
    console.warn('PKCE verifier DB read failed, trying memory:', (err as Error).message)
  }

  sweep()
  const mem = memory.get(id)
  if (!mem || mem.expiresAt <= Date.now()) {
    memory.delete(id)
    return null
  }
  memory.delete(id)
  return mem.verifier
}

export function newPkceId(): string {
  return crypto.randomBytes(18).toString('base64url')
}
