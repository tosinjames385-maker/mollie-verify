const STORAGE_KEY = 'vrfd_admin_gate'

export const ADMIN_PASSWORD = 'brutal.force.attac'

export function isAdminUnlocked(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function unlockAdmin(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1')
    sessionStorage.setItem(`${STORAGE_KEY}_pw`, ADMIN_PASSWORD)
  } catch {
    /* ignore */
  }
}

export function lockAdmin(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(`${STORAGE_KEY}_pw`)
  } catch {
    /* ignore */
  }
}

export function getAdminPasswordHeader(): Record<string, string> {
  if (!isAdminUnlocked()) return {}
  return { 'x-admin-password': ADMIN_PASSWORD }
}

export function verifyAdminPassword(value: string): boolean {
  return value.trim() === ADMIN_PASSWORD
}
