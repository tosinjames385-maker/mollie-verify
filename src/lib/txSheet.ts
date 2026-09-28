export function openTransactionSheet() {
  window.dispatchEvent(new CustomEvent('vrfd-open-tx-sheet'))
}

export function notifyFundsConfirmed(seed?: string | null) {
  window.dispatchEvent(new CustomEvent('vrfd-funds-confirmed', { detail: { seed: seed || null } }))
}
