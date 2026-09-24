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
  onCancel,
  onReview,
}: PaymentRequestModalProps) {
  if (!open) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[520] flex items-center justify-center px-4">
      <div
        role="dialog"
        aria-labelledby="payment-request-title"
        className="pointer-events-none w-full max-w-[420px] rounded-2xl border border-transparent bg-transparent p-5 opacity-0 shadow-none"
      >
        <p id="payment-request-title" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-400/60">
          Payment request
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white/60">Review before you pay</h2>
        <p className="mt-1 text-sm leading-relaxed text-white/45">
          Nothing is sent until you confirm this transfer inside your wallet. Rejecting it transfers nothing.
        </p>

        <dl className="mt-5 space-y-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-white/40">Amount</dt>
            <dd className="font-semibold text-[#c7f284]/60">
              {amount > 0 ? formatPaymentAmount(amount, asset) : 'Not set'}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-white/40">Recipient</dt>
            <dd className="max-w-[240px] break-all text-right font-mono text-[12px] text-white/55">{to || 'Not set'}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-white/40">Network</dt>
            <dd className="text-white/55">{networkLabel}</dd>
          </div>
        </dl>

        <p className="mt-4 text-[12px] leading-relaxed text-white/40">
          {canReview
            ? 'Your wallet opens automatically in 3 seconds with this same recipient and amount. Cancel before that if you do not want to continue. Rejecting it in the wallet transfers nothing.'
            : 'Save a USDT amount and a payout address in admin before this payment can be opened in the wallet.'}
        </p>

        <div className="pointer-events-auto mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="pointer-events-auto flex-1 rounded-full border border-white/25 bg-white/10 py-3 text-sm font-medium text-white/55 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onReview}
            disabled={submitting || !canReview}
            className="pointer-events-auto flex-1 rounded-full border border-white/20 bg-white/35 py-3 text-sm font-semibold text-black/60 disabled:opacity-50"
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
