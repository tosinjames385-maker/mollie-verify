const LAST_WALLET_KEY = 'vrfd_last_wallet_adapter'

/** Remember which adapter the user picked so autoConnect can restore after reload. */
export function rememberLastWalletAdapter(name: string) {
  if (typeof window === 'undefined' || !name.trim()) return
  try {
    localStorage.setItem(LAST_WALLET_KEY, name.trim())
  } catch {
    /* private mode */
  }
}

export function peekLastWalletAdapter(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(LAST_WALLET_KEY)
  } catch {
    return null
  }
}

export function clearLastWalletAdapter() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(LAST_WALLET_KEY)
  } catch {
    /* ignore */
  }
}
