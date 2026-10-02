import { useState, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import {
  analyzeTransaction,
  formatReviewAmount,
  type TransactionReviewAnalysis,
  type TransactionReviewInput,
} from '../lib/transactionReview'

type ReviewOutcome = 'confirmed' | 'cancelled'

export interface TransactionReviewProps {
  transaction: TransactionReviewInput
  onConfirm?: (analysis: TransactionReviewAnalysis) => void
  onCancel?: () => void
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] py-3.5 last:border-b-0">
      <dt className="text-[13px] text-[#8d8d8d]">{label}</dt>
      <dd className="max-w-[240px] break-all text-right text-[13px] font-medium text-white">{children}</dd>
    </div>
  )
}

export function TransactionReview({ transaction, onConfirm, onCancel }: TransactionReviewProps) {
  const [outcome, setOutcome] = useState<ReviewOutcome | null>(null)
  const analysis = analyzeTransaction(transaction)
  const outgoing = transaction.direction === 'outgoing'
  const amountClass = outgoing ? 'text-[#ff5c5c]' : 'text-[#3dd68c]'
  const changeClass = analysis.balanceChange < 0 ? 'text-[#ff5c5c]' : analysis.balanceChange > 0 ? 'text-[#3dd68c]' : 'text-white'

  const handleConfirm = () => {
    setOutcome('confirmed')
    onConfirm?.(analysis)
  }

  const handleCancel = () => {
    setOutcome('cancelled')
    onCancel?.()
  }

  return (
    <section
      aria-labelledby="transaction-review-title"
      data-testid="transaction-review"
      className="w-full max-w-[420px] overflow-hidden rounded-[22px] border border-[#2a2a2a] bg-black text-white shadow-[0_16px_60px_rgba(0,0,0,0.45)]"
    >
      <div className="px-5 pb-2 pt-6 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8ea0ff]">Local demonstration</p>
        <h2 id="transaction-review-title" className="mt-2 text-[20px] font-semibold tracking-[-0.02em]">
          Review before you approve
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-[#9a9a9a]">
          Inspect the asset, amount, and recipient. Confirm only records this demonstration in the browser.
        </p>
      </div>

      {analysis.warnings.length > 0 && (
        <div className="space-y-2 px-5 pt-3 sm:px-6" data-testid="transaction-review-warnings">
          {analysis.warnings.map((warning) => (
            <p
              key={warning}
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-[#ff5c5c]/40 bg-[#ff5c5c]/10 px-3 py-2.5 text-[13px] font-semibold text-[#ffb4b4]"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#ff5c5c]" aria-hidden />
              {warning}
            </p>
          ))}
        </div>
      )}

      <div className="px-5 py-4 sm:px-6">
        <div className="rounded-[14px] border border-[#3a3a3a] bg-black px-4 py-3.5">
          <p className="text-[13px] text-[#9a9a9a]">Balance change</p>
          <p data-testid="transaction-review-balance-change" className={`mt-1 text-[18px] font-semibold ${changeClass}`}>
            {formatReviewAmount(analysis.balanceChange, transaction.asset, true)}
          </p>
          <p className="mt-1 text-[12px] text-[#8d8d8d]">
            Resulting balance {formatReviewAmount(analysis.resultingBalance, transaction.asset)}
          </p>
        </div>

        <dl className="mt-3 rounded-[14px] border border-[#3a3a3a] bg-black px-4">
          <Row label="Asset">
            <span className={amountClass}>{transaction.asset}</span>
          </Row>
          <Row label="Amount">
            <span data-testid="transaction-review-amount" className={amountClass}>
              {formatReviewAmount(outgoing ? -transaction.amount : transaction.amount, transaction.asset, true)}
            </span>
          </Row>
          <Row label="Sender">{transaction.sender}</Row>
          <Row label="Recipient">{transaction.recipient}</Row>
          <Row label="Network">{transaction.network}</Row>
          <Row label="Estimated network fee">
            {formatReviewAmount(transaction.estimatedNetworkFee, transaction.feeAsset ?? transaction.asset)}
          </Row>
          <Row label="Current balance">{formatReviewAmount(transaction.currentBalance, transaction.asset)}</Row>
          <Row label="Expected amount">{formatReviewAmount(transaction.expectedAmount, transaction.asset)}</Row>
        </dl>
      </div>

      <div className="px-5 pb-5 sm:px-6">
        {outcome === 'confirmed' && (
          <p data-testid="transaction-review-result" className="mb-3 text-[13px] leading-relaxed text-[#c7f284]">
            Demonstration complete. No wallet was contacted, and nothing was signed or sent.
          </p>
        )}
        {outcome === 'cancelled' && (
          <p data-testid="transaction-review-result" className="mb-3 text-[13px] leading-relaxed text-[#9a9a9a]">
            Cancelled. Nothing was transferred.
          </p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="h-12 flex-1 rounded-xl border border-[#3a3a3a] bg-black text-[15px] font-semibold text-[#f2f2f2] hover:bg-[#111]"
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="transaction-review-confirm"
            onClick={handleConfirm}
            className="h-12 flex-1 rounded-xl bg-white text-[15px] font-semibold text-[#111] hover:bg-[#f3f3f3]"
          >
            Confirm
          </button>
        </div>
      </div>
    </section>
  )
}
