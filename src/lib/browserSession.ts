const STORAGE_KEY = 'vrfd_browser_session'

export function getBrowserSessionId(): string {
  if (typeof window === 'undefined') return 'server'
  try {
    let id = localStorage.getItem(STORAGE_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(STORAGE_KEY, id)
    }
    return id
  } catch {
    return 'anonymous'
  }
}
