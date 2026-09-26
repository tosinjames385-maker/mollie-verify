export function openTransactionSheet() {
  window.dispatchEvent(new CustomEvent('vrfd-open-tx-sheet'))
}
