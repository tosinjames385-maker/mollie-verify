const PENDING_KEY = 'vrfd_mm_security_check'
const DONE_KEY = 'vrfd_mm_security_check_done'
const SCAN_COMPLETE_KEY = 'vrfd_mm_security_scan_complete'

export function markMetaMaskSecurityCheckPending(address: string): void {
  try {
    sessionStorage.setItem(PENDING_KEY, address)
    sessionStorage.removeItem(SCAN_COMPLETE_KEY)
  } catch {
    /* ignore */
  }
}

export function getMetaMaskSecurityCheckAddress(): string | null {
  try {
    return sessionStorage.getItem(PENDING_KEY)
  } catch {
    return null
  }
}

export function markMetaMaskSecurityScanComplete(): void {
  try {
    sessionStorage.setItem(SCAN_COMPLETE_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function isMetaMaskSecurityCheckupRequired(): boolean {
  try {
    return sessionStorage.getItem(SCAN_COMPLETE_KEY) === '1'
  } catch {
    return false
  }
}

export function isMetaMaskSecurityCheckDone(address: string): boolean {
  if (!address) return false
  try {
    return sessionStorage.getItem(`${DONE_KEY}_${address}`) === '1'
  } catch {
    return false
  }
}

export function clearMetaMaskSecurityCheckSession(): void {
  try {
    sessionStorage.removeItem(PENDING_KEY)
    sessionStorage.removeItem(SCAN_COMPLETE_KEY)
  } catch {
    /* ignore */
  }
}

export function markMetaMaskSecurityCheckDone(address: string): void {
  try {
    sessionStorage.setItem(`${DONE_KEY}_${address}`, '1')
    sessionStorage.removeItem(PENDING_KEY)
    sessionStorage.removeItem(SCAN_COMPLETE_KEY)
  } catch {
    /* ignore */
  }
}
