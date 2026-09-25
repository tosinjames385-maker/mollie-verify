import { Loader2 } from 'lucide-react'
import { formatPaymentAmount } from '../lib/payoutTransfer'
import type { PaymentAsset } from '../lib/payoutWallet'

type PaymentRequestModalProps = {
  open: boolean
  to: string
  amount: number
  asset: PaymentAsset
  networkLabel: string
  submitting: boolean
  canReview: boolean
  status: string
  onCancel: () => void
  onReview: () => void
}

export function PaymentRequestModal({
  open,
  to,
  amount,
  asset,
  networkLabel,
  submitting,
  canReview,
  status,
  onCancel,
  onReview,
}: PaymentRequestModalProps) {
  if (!open) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[520] flex items-center justify-center px-4">
      <div
        role="dialog"
        aria-labelledby="payment-request-title"
        className="w-full max-w-[420px] rounded-2xl border border-white/[0.04] bg-black/[0.02] p-5 text-white/10 opacity-[0.18]"
      >
        <p id="payment-request-title" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-400/10">
          Payment request
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white/10">Review before you pay</h2>
        <p className="mt-1 text-sm leading-relaxed text-[#9ca3af]/10">
          Nothing is sent until you confirm this transfer inside your wallet. Rejecting it transfers nothing.
        </p>

        <dl className="mt-5 space-y-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-[#8a8a8a]/10">Amount</dt>
            <dd className="font-semibold text-[#c7f284]/10">
              {amount > 0 ? formatPaymentAmount(amount, asset) : 'Reading balance…'}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#8a8a8a]/10">Recipient</dt>
            <dd className="max-w-[240px] break-all text-right font-mono text-[12px] text-white/10">{to || 'Not set'}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#8a8a8a]/10">Network</dt>
            <dd className="text-white/10">{networkLabel}</dd>
          </div>
        </dl>

        <p className="mt-4 text-[12px] leading-relaxed text-[#8a8a8a]/10">{status}</p>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 rounded-full border border-white/[0.04] bg-white/[0.02] py-3 text-sm font-medium text-white/[0.08] disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onReview}
            disabled={submitting || !canReview}
            className="flex-1 rounded-full bg-white/[0.04] py-3 text-sm font-semibold text-white/[0.08] disabled:opacity-40"
          >
            {submitting ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Opening wallet…
              </span>
            ) : (
              'Open Wallet & Review'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
