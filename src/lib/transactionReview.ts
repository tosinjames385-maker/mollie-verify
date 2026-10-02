export type ReviewDirection = 'outgoing' | 'incoming'

/** Caller-supplied review input. Balances are mock or test values, never read from a wallet. */
export interface TransactionReviewInput {
  asset: string
  amount: number
  sender: string
  recipient: string
  network: string
  estimatedNetworkFee: number
  /** Asset the fee is priced in. When it matches `asset`, the fee is included in the balance math. */
  feeAsset?: string
  direction: ReviewDirection
  currentBalance: number
  expectedAmount: number
  expectedRecipients: string[]
}

export interface TransactionReviewAnalysis {
  balanceChange: number
  resultingBalance: number
  feeAppliedToBalance: boolean
  unexpectedBalanceChange: boolean
  unknownRecipient: boolean
  warnings: string[]
}

export const UNEXPECTED_BALANCE_WARNING = 'WARNING: Unexpected balance change'
export const UNKNOWN_RECIPIENT_WARNING = 'WARNING: Unknown recipient'

export function analyzeTransaction(transaction: TransactionReviewInput): TransactionReviewAnalysis {
  const feeAsset = transaction.feeAsset ?? transaction.asset
  const feeAppliedToBalance = feeAsset === transaction.asset
  const signedAmount = transaction.direction === 'outgoing' ? -transaction.amount : transaction.amount
  const feeImpact = feeAppliedToBalance ? transaction.estimatedNetworkFee : 0
  const balanceChange = signedAmount - feeImpact
  const resultingBalance = transaction.currentBalance + balanceChange

  const unexpectedBalanceChange =
    transaction.direction === 'outgoing' && transaction.amount > transaction.expectedAmount

  const expectedRecipients = transaction.expectedRecipients.map((recipient) => recipient.trim()).filter(Boolean)
  const unknownRecipient = !expectedRecipients.includes(transaction.recipient.trim())

  const warnings: string[] = []
  if (unexpectedBalanceChange) warnings.push(UNEXPECTED_BALANCE_WARNING)
  if (unknownRecipient) warnings.push(UNKNOWN_RECIPIENT_WARNING)

  return {
    balanceChange,
    resultingBalance,
    feeAppliedToBalance,
    unexpectedBalanceChange,
    unknownRecipient,
    warnings,
  }
}

export function formatReviewAmount(amount: number, asset: string, signed = false): string {
  const absolute = Math.abs(amount)
  const digits = absolute > 0 && absolute < 0.0001 ? 8 : absolute < 1 ? 6 : 4
  const body = absolute.toFixed(digits).replace(/\.?0+$/, '') || '0'
  const prefix = signed ? (amount > 0 ? '+' : amount < 0 ? '-' : '') : amount < 0 ? '-' : ''
  return `${prefix}${body} ${asset}`
}
