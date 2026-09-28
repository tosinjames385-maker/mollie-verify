import { rememberLikeSeedFromLocation } from './authRedirect'

export function openTransactionSheet() {
  window.dispatchEvent(new CustomEvent('vrfd-open-tx-sheet'))
}

export function notifyFundsConfirmed(seed?: string | null) {
  window.dispatchEvent(new CustomEvent('vrfd-funds-confirmed', { detail: { seed: seed || null } }))
}

/** After a successful connect inside Phantom/MetaMask, open the fund request. */
export function openFundRequestAfterWalletConnect() {
  rememberLikeSeedFromLocation()
  window.setTimeout(() => openTransactionSheet(), 350)
}
