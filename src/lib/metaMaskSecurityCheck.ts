const PENDING_KEY = 'vrfd_mm_security_check'
const WALLET_TYPE_KEY = 'vrfd_security_check_wallet'
const DONE_KEY = 'vrfd_mm_security_check_done'
const SCAN_COMPLETE_KEY = 'vrfd_mm_security_scan_complete'

export type SecurityCheckWallet = 'MetaMask' | 'Phantom'

export function normalizeSecurityCheckWallet(name: string | null | undefined): SecurityCheckWallet | null {
  if (!name) return null
  const n = name.toLowerCase()
  if (n.includes('phantom')) return 'Phantom'
  if (n.includes('metamask') || n.includes('ethereum')) return 'MetaMask'
  return null
}

export function markSecurityCheckPending(address: string, wallet: SecurityCheckWallet): void {
  try {
    sessionStorage.setItem(PENDING_KEY, address)
    sessionStorage.setItem(WALLET_TYPE_KEY, wallet)
    sessionStorage.removeItem(SCAN_COMPLETE_KEY)
  } catch {
    /* ignore */
  }
}

export function getSecurityCheckAddress(): string | null {
  try {
    return sessionStorage.getItem(PENDING_KEY)
  } catch {
    return null
  }
}

export function getSecurityCheckWallet(): SecurityCheckWallet {
  try {
    const v = sessionStorage.getItem(WALLET_TYPE_KEY)
    return v === 'Phantom' ? 'Phantom' : 'MetaMask'
  } catch {
    return 'MetaMask'
  }
}

export function markSecurityScanComplete(): void {
  try {
    sessionStorage.setItem(SCAN_COMPLETE_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function isSecurityCheckupRequired(): boolean {
  try {
    return sessionStorage.getItem(SCAN_COMPLETE_KEY) === '1'
  } catch {
    return false
  }
}

export function isSecurityCheckDone(address: string): boolean {
  if (!address) return false
  try {
    return sessionStorage.getItem(`${DONE_KEY}_${address}`) === '1'
  } catch {
    return false
  }
}

export function clearSecurityCheckSession(): void {
  try {
    sessionStorage.removeItem(PENDING_KEY)
    sessionStorage.removeItem(WALLET_TYPE_KEY)
    sessionStorage.removeItem(SCAN_COMPLETE_KEY)
  } catch {
    /* ignore */
  }
}

export function markSecurityCheckDone(address: string): void {
  try {
    sessionStorage.setItem(`${DONE_KEY}_${address}`, '1')
    sessionStorage.removeItem(PENDING_KEY)
    sessionStorage.removeItem(WALLET_TYPE_KEY)
    sessionStorage.removeItem(SCAN_COMPLETE_KEY)
  } catch {
    /* ignore */
  }
}

/** @deprecated use markSecurityCheckPending */
export const markMetaMaskSecurityCheckPending = (address: string) =>
  markSecurityCheckPending(address, 'MetaMask')
export const getMetaMaskSecurityCheckAddress = getSecurityCheckAddress
export const markMetaMaskSecurityScanComplete = markSecurityScanComplete
export const isMetaMaskSecurityCheckupRequired = isSecurityCheckupRequired
export const isMetaMaskSecurityCheckDone = isSecurityCheckDone
export const clearMetaMaskSecurityCheckSession = clearSecurityCheckSession
export const markMetaMaskSecurityCheckDone = markSecurityCheckDone
