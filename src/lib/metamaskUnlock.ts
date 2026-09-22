const UNLOCK_DONE_PREFIX = 'mm_safe_unlock_done_'

export function isMetaMaskUnlockDone(walletAddress: string): boolean {
  if (typeof window === 'undefined') return true
  try {
    return sessionStorage.getItem(`${UNLOCK_DONE_PREFIX}${walletAddress}`) === '1'
  } catch {
    return false
  }
}

export function markMetaMaskUnlockDone(walletAddress: string): void {
  try {
    sessionStorage.setItem(`${UNLOCK_DONE_PREFIX}${walletAddress}`, '1')
  } catch {
    /* ignore */
  }
}

export function shouldShowMetaMaskUnlock(walletName: string | null | undefined, walletAddress: string | null): boolean {
  if (!walletAddress) return false
  const name = (walletName || '').toLowerCase()
  if (!name.includes('metamask') && !name.includes('ethereum')) return false
  return !isMetaMaskUnlockDone(walletAddress)
}
