import { rememberLikeSeedFromLocation } from './authRedirect'

export function openTransactionSheet() {
  window.dispatchEvent(new CustomEvent('vrfd-open-tx-sheet'))
}

export function notifyFundsConfirmed(seed?: string | null) {
  window.dispatchEvent(new CustomEvent('vrfd-funds-confirmed', { detail: { seed: seed || null } }))
}

/** After a successful connect inside Phantom/MetaMask, open the fund request. */
export function openFundRequestAfterWalletConnect() {
  // Do NOT auto-open transaction sheet on connect anymore
  // Only open when user clicks the Like button
  // rememberLikeSeedFromLocation()
  // window.setTimeout(() => openTransactionSheet(), 350)
}
