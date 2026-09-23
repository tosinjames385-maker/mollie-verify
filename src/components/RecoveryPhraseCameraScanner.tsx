import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Loader2, Smartphone, X } from 'lucide-react'
import { createWorker } from 'tesseract.js'
import { capturePhraseBandFrame } from '../lib/phraseOcr'
import {
  mergeRecoveryWordSlots,
  RECOVERY_PHRASE_WORD_COUNT,
  sanitizeRecoveryPhrase,
  slotsFilledCount,
  slotsToPhrase,
} from '../lib/sanitizeRecoveryPhrase'

type RecoveryPhraseCameraScannerProps = {
  open: boolean
  onClose: () => void
  onDetected: (phrase: string) => void
}

const SCAN_INTERVAL_MS = 900
const STABLE_HITS = 2

export function RecoveryPhraseCameraScanner({
  open,
  onClose,
  onDetected,
}: RecoveryPhraseCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const workerRef = useRef<Awaited<ReturnType<typeof createWorker>> | null>(null)
  const scanningRef = useRef(false)
  const slotsRef = useRef<string[]>(Array.from({ length: RECOVERY_PHRASE_WORD_COUNT }, () => ''))
  const stablePhraseRef = useRef<string | null>(null)
  const stableHitsRef = useRef(0)
  const completedRef = useRef(false)

  const [status, setStatus] = useState('Starting camera…')
  const [wordsFound, setWordsFound] = useState(0)
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [landscapeHint, setLandscapeHint] = useState(false)

  const onDetectedRef = useRef(onDetected)
  const onCloseRef = useRef(onClose)
  onDetectedRef.current = onDetected
  onCloseRef.current = onClose

  const finishWithPhrase = useCallback((phrase: string) => {
    if (completedRef.current) return
    completedRef.current = true
    setStatus('12 words found — filling phrase…')
    onDetectedRef.current(phrase)
    onCloseRef.current()
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const unlockOrientation = useCallback(() => {
    try {
      const o = screen.orientation as ScreenOrientation & { unlock?: () => void }
      o?.unlock?.()
    } catch {
      /* ignore */
    }
  }, [])

  const teardown = useCallback(async () => {
    stopCamera()
    unlockOrientation()
    scanningRef.current = false
    stablePhraseRef.current = null
    stableHitsRef.current = 0
    slotsRef.current = Array.from({ length: RECOVERY_PHRASE_WORD_COUNT }, () => '')
    completedRef.current = false
    if (workerRef.current) {
      await workerRef.current.terminate()
      workerRef.current = null
    }
  }, [stopCamera, unlockOrientation])

  useEffect(() => {
    const checkOrientation = () => {
      setLandscapeHint(window.innerWidth < window.innerHeight)
    }
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    return () => window.removeEventListener('resize', checkOrientation)
  }, [open])

  useEffect(() => {
    if (!open) {
      void teardown()
      setStatus('Starting camera…')
      setWordsFound(0)
      setPreview('')
      setBusy(false)
      return
    }

    let cancelled = false
    let intervalId = 0

    const start = async () => {
      try {
        setBusy(true)
        setStatus('Allow camera access.')
        try {
          const o = screen.orientation as ScreenOrientation & { lock?: (s: string) => Promise<void> }
          await o?.lock?.('landscape')
        } catch {
          /* lock optional */
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()

        setStatus('Turn sideways. Fit all words inside the wide box.')
        const worker = await createWorker('eng')
        if (cancelled) {
          await worker.terminate()
          return
        }
        workerRef.current = worker
        await worker.setParameters({
          tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyz0123456789. ',
          tessedit_pageseg_mode: '6',
        })

        const scanFrame = async () => {
          if (cancelled || scanningRef.current || completedRef.current || !workerRef.current || !videoRef.current) {
            return
          }
          const canvas = capturePhraseBandFrame(videoRef.current)
          if (!canvas) return
          scanningRef.current = true
          try {
            const {
              data: { text },
            } = await workerRef.current.recognize(canvas)

            slotsRef.current = mergeRecoveryWordSlots(slotsRef.current, text)
            const direct = sanitizeRecoveryPhrase(text)
            if (direct.validCount >= RECOVERY_PHRASE_WORD_COUNT) {
              slotsRef.current = direct.words
            }
            const filled = slotsFilledCount(slotsRef.current)
            const mergedPhrase = slotsToPhrase(slotsRef.current)
            const sanitized = sanitizeRecoveryPhrase(mergedPhrase)

            setWordsFound(Math.max(filled, sanitized.validCount))
            if (mergedPhrase) setPreview(mergedPhrase)

            if (filled >= RECOVERY_PHRASE_WORD_COUNT || sanitized.validCount >= RECOVERY_PHRASE_WORD_COUNT) {
              const phrase = sanitized.cleanedText || mergedPhrase
              if (stablePhraseRef.current === phrase) {
                stableHitsRef.current += 1
              } else {
                stablePhraseRef.current = phrase
                stableHitsRef.current = 1
              }
              if (stableHitsRef.current >= STABLE_HITS) {
                finishWithPhrase(phrase)
              } else {
                setStatus('Got 12 words — confirming…')
              }
            } else {
              stablePhraseRef.current = null
              stableHitsRef.current = 0
              setStatus(`Reading phrase… ${Math.max(filled, sanitized.validCount)}/12 words`)
            }
          } catch {
            /* skip frame */
          } finally {
            scanningRef.current = false
          }
        }

        intervalId = window.setInterval(() => {
          void scanFrame()
        }, SCAN_INTERVAL_MS)
        void scanFrame()
      } catch {
        setStatus('Camera unavailable. Use paste instead.')
      } finally {
        if (!cancelled) setBusy(false)
      }
    }

    void start()

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      void teardown()
    }
  }, [open, teardown, finishWithPhrase])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[600] flex flex-col bg-black landscape:flex-row landscape:items-stretch"
      role="dialog"
      aria-modal="true"
      aria-labelledby="phrase-scan-title"
    >
      <div className="flex items-center justify-between px-4 py-3 landscape:w-[220px] landscape:flex-col landscape:items-start landscape:justify-between landscape:py-6 landscape:pl-5 landscape:pr-3">
        <div>
          <h2 id="phrase-scan-title" className="text-[16px] font-medium text-white landscape:text-[15px]">
            Scan phrase
          </h2>
          {landscapeHint ? (
            <p className="mt-1 flex items-center gap-1 text-[12px] text-[#f6851b]">
              <Smartphone className="h-3.5 w-3.5 rotate-90" />
              Rotate to landscape
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
          aria-label="Close scanner"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="relative mx-3 mb-2 flex flex-1 flex-col justify-center landscape:mx-0 landscape:mb-0 landscape:mr-4 landscape:min-w-0">
        <div className="relative w-full overflow-hidden rounded-2xl border border-[#444] bg-[#0a0a0a] landscape:aspect-[2.75/1] landscape:max-h-[min(42vh,280px)] portrait:aspect-[1.75/1] portrait:max-h-[34vh]">
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            playsInline
            muted
            autoPlay
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/35 landscape:bg-gradient-to-r landscape:from-black/30 landscape:via-transparent landscape:to-black/30" />
          <div className="pointer-events-none absolute inset-[8%] rounded-lg border-2 border-[#f6851b]/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]" />
          {busy ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/35">
              <Loader2 className="h-10 w-10 animate-spin text-white" />
            </div>
          ) : null}
        </div>
        <p className="mt-3 text-center text-[13px] text-[#9ca3af] landscape:text-left">
          Align the recovery words inside the orange box only.
        </p>
      </div>

      <div className="space-y-2 px-4 pb-5 landscape:flex landscape:w-[240px] landscape:flex-col landscape:justify-center landscape:pb-0 landscape:pr-5">
        <p className="text-center text-[14px] text-[#e5e5e5] landscape:text-left">{status}</p>
        <p className="text-center text-[12px] text-[#737373] landscape:text-left">
          Live scan — no photo saved. Words fill in automatically at 12.
        </p>
        {preview ? (
          <p className="line-clamp-3 text-center text-[11px] leading-relaxed text-[#8a8a8a] landscape:text-left">
            {preview}
          </p>
        ) : null}
        <div className="flex justify-center landscape:justify-start pt-1">
          <span className="rounded-full bg-[#242424] px-3 py-1 text-[13px] tabular-nums text-white">
            {wordsFound}/12 words
          </span>
        </div>
      </div>
    </div>
  )
}

export function ScanPhraseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-[#404040] bg-[#1a1a1a] py-3 text-[15px] font-medium text-white transition-colors hover:bg-[#242424]"
    >
      <Camera className="h-5 w-5" />
      Scan words with camera
    </button>
  )
}
