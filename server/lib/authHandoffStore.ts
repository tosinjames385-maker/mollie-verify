import crypto from 'crypto'
import { prisma } from '../prisma'

type HandoffInput = {
  code?: string
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
let tableReady: Promise<void> | null = null

function sweepMemory() {
  const now = Date.now()
  for (const [code, row] of memory.entries()) {
    if (row.expiresAt <= now) memory.delete(code)
  }
}

function nextCode(preferred?: string): string {
  if (preferred && /^[A-Za-z0-9_-]{16,80}$/.test(preferred)) return preferred
  return crypto.randomBytes(24).toString('base64url')
}

async function ensureHandoffTables(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "AuthHandoff" (
          "id" TEXT PRIMARY KEY,
          "code" TEXT NOT NULL UNIQUE,
          "accessToken" TEXT NOT NULL,
          "refreshToken" TEXT NOT NULL,
          "expiresAtTs" INTEGER,
          "pendingLike" TEXT,
          "returnPath" TEXT,
          "expiresAt" TIMESTAMP(3) NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `)
      try {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS vrfd_auth_handoff (
            id text PRIMARY KEY,
            access_token text NOT NULL,
            refresh_token text NOT NULL,
            pending_like text,
            return_path text,
            expires_at timestamptz NOT NULL,
            created_at timestamptz NOT NULL DEFAULT now()
          )
        `)
        await prisma.$executeRawUnsafe(`ALTER TABLE vrfd_auth_handoff ENABLE ROW LEVEL SECURITY`)
        await prisma.$executeRawUnsafe(`GRANT ALL ON TABLE vrfd_auth_handoff TO anon, authenticated, service_role`)
        await prisma.$executeRawUnsafe(`
          DO $$ BEGIN
            CREATE POLICY vrfd_auth_handoff_all ON vrfd_auth_handoff
              FOR ALL TO anon, authenticated
              USING (true) WITH CHECK (true);
          EXCEPTION WHEN duplicate_object THEN NULL;
          END $$
        `)
      } catch {
        /* optional public table — Prisma AuthHandoff is enough for the API path */
      }
    })().catch((err) => {
      tableReady = null
      throw err
    })
  }
  await tableReady
}

export async function createAuthHandoff(tokens: HandoffInput): Promise<string> {
  const code = nextCode(tokens.code)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  try {
    await ensureHandoffTables()
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
