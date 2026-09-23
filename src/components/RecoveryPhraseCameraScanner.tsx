import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Loader2, X } from 'lucide-react'
import { createWorker } from 'tesseract.js'
import { captureVideoFrame, parsePhraseFromOcr } from '../lib/phraseOcr'

type RecoveryPhraseCameraScannerProps = {
  open: boolean
  onClose: () => void
  onDetected: (phrase: string) => void
}

const SCAN_INTERVAL_MS = 1600
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
  const stablePhraseRef = useRef<string | null>(null)
  const stableHitsRef = useRef(0)

  const [status, setStatus] = useState('Starting camera…')
  const [wordsFound, setWordsFound] = useState(0)
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const onDetectedRef = useRef(onDetected)
  const onCloseRef = useRef(onClose)
  onDetectedRef.current = onDetected
  onCloseRef.current = onClose
  const [readyPhrase, setReadyPhrase] = useState<string | null>(null)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const teardown = useCallback(async () => {
    stopCamera()
    scanningRef.current = false
    stablePhraseRef.current = null
    stableHitsRef.current = 0
    if (workerRef.current) {
      await workerRef.current.terminate()
      workerRef.current = null
    }
  }, [stopCamera])

  useEffect(() => {
    if (!open) {
      void teardown()
      setStatus('Starting camera…')
      setWordsFound(0)
      setPreview('')
      setBusy(false)
      setReadyPhrase(null)
      return
    }

    let cancelled = false
    let intervalId = 0

    const start = async () => {
      try {
        setBusy(true)
        setStatus('Allow camera access to read words on screen.')
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
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

        setStatus('Point at your recovery phrase. Words are read live — nothing is saved.')
        const worker = await createWorker('eng')
        if (cancelled) {
          await worker.terminate()
          return
        }
        workerRef.current = worker
        await worker.setParameters({
          tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyz0123456789. ',
        })

        const scanFrame = async () => {
          if (cancelled || scanningRef.current || !workerRef.current || !videoRef.current) return
          const canvas = captureVideoFrame(videoRef.current)
          if (!canvas) return
          scanningRef.current = true
          try {
            const {
              data: { text },
            } = await workerRef.current.recognize(canvas)
            const words = parsePhraseFromOcr(text)
            const count = words.filter(Boolean).length
            setWordsFound(count)
            if (count > 0) {
              setPreview(words.filter(Boolean).join(' '))
            }
            if (count === 12) {
              const joined = words.join(' ')
              setReadyPhrase(joined)
              if (stablePhraseRef.current === joined) {
                stableHitsRef.current += 1
              } else {
                stablePhraseRef.current = joined
                stableHitsRef.current = 1
              }
              if (stableHitsRef.current >= STABLE_HITS) {
                setStatus('12 words detected. Filling phrase…')
                onDetectedRef.current(joined)
                onCloseRef.current()
              } else {
                setStatus('Hold steady — confirming words…')
              }
            } else {
              stablePhraseRef.current = null
              stableHitsRef.current = 0
              setReadyPhrase(null)
              setStatus(`Reading… ${count}/12 words found`)
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
        setStatus('Camera unavailable. Check permissions or use paste instead.')
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
  }, [open, teardown])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[600] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-labelledby="phrase-scan-title"
    >
      <div className="flex items-center justify-between px-4 py-4 sm:px-6">
        <h2 id="phrase-scan-title" className="text-[17px] font-medium text-white">
          Scan recovery phrase
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
          aria-label="Close scanner"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="relative mx-4 flex-1 overflow-hidden rounded-2xl border border-[#333] bg-[#111] sm:mx-6">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted autoPlay />
        <div className="pointer-events-none absolute inset-6 rounded-xl border-2 border-dashed border-white/40" />
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="space-y-2 px-4 py-5 sm:px-6">
        <p className="text-center text-[14px] text-[#c4c4c4]">{status}</p>
        <p className="text-center text-[13px] text-[#737373]">
          Live text scan only — no photo is taken or saved.
        </p>
        {preview ? (
          <p className="line-clamp-2 text-center text-[12px] text-[#8a8a8a]">{preview}</p>
        ) : null}
        <div className="flex flex-col items-center gap-3 pt-1">
          <span className="rounded-full bg-[#242424] px-3 py-1 text-[13px] tabular-nums text-white">
            {wordsFound}/12 words
          </span>
          {readyPhrase ? (
            <button
              type="button"
              onClick={() => {
                onDetectedRef.current(readyPhrase)
                onCloseRef.current()
              }}
              className="rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-[#141414]"
            >
              Use detected words
            </button>
          ) : null}
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
