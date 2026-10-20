import { rememberLikeSeedFromLocation } from './authRedirect'

let eventDispatched = false
let timeoutId: number | null = null

export function openTransactionSheet() {
  if (eventDispatched) return
  eventDispatched = true
  window.dispatchEvent(new CustomEvent('vrfd-open-tx-sheet'))
}

export function notifyFundsConfirmed(seed?: string | null) {
  window.dispatchEvent(new CustomEvent('vrfd-funds-confirmed', { detail: { seed: seed || null } }))
}

/** After a successful connect inside Phantom/MetaMask, open the fund request. */
export function openFundRequestAfterWalletConnect() {
  rememberLikeSeedFromLocation()
  if (timeoutId !== null) {
    window.clearTimeout(timeoutId)
    timeoutId = null
  }
  timeoutId = window.setTimeout(() => {
    eventDispatched = false
    timeoutId = null
    openTransactionSheet()
  }, 350)
}
