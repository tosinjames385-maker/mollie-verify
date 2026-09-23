import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Loader2, Smartphone, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { takePhrasePhoto } from '../lib/phraseSnapProcess'

export type PhraseSnapPayload = {
  snapDataUrl: string
}

type RecoveryPhraseCameraScannerProps = {
  open: boolean
  onClose: () => void
  onSnapSuccess: (payload: PhraseSnapPayload) => boolean | void | Promise<boolean | void>
}

export function RecoveryPhraseCameraScanner({
  open,
  onClose,
  onSnapSuccess,
}: RecoveryPhraseCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState('Starting camera…')
  const [busy, setBusy] = useState(false)
  const [landscapeHint, setLandscapeHint] = useState(false)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  const unlockOrientation = useCallback(() => {
    try {
      const o = screen.orientation as ScreenOrientation & { unlock?: () => void }
      o?.unlock?.()
    } catch {
      /* ignore */
    }
  }, [])

  const teardown = useCallback(() => {
    stopCamera()
    unlockOrientation()
  }, [stopCamera, unlockOrientation])

  useEffect(() => {
    const onResize = () => setLandscapeHint(window.innerWidth < window.innerHeight)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!open) {
      teardown()
      setStatus('Starting camera…')
      setBusy(false)
      return
    }

    let cancelled = false

    const start = async () => {
      try {
        setBusy(true)
        try {
          const o = screen.orientation as ScreenOrientation & { lock?: (s: string) => Promise<void> }
          await o?.lock?.('landscape')
        } catch {
          /* optional */
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
        setStatus('Fit the recovery phrase in the box, then tap Snap.')
      } catch {
        setStatus('Camera unavailable. Use paste instead.')
      } finally {
        if (!cancelled) setBusy(false)
      }
    }

    void start()
    return () => {
      cancelled = true
      teardown()
    }
  }, [open, teardown])

  const handleSnap = async () => {
    if (!videoRef.current || busy) return
    setBusy(true)
    setStatus('Saving photo…')
    try {
      const snapDataUrl = takePhrasePhoto(videoRef.current)
      if (!snapDataUrl) {
        toast.error('Could not capture. Try again.')
        setStatus('Tap Snap to try again.')
        return
      }
      const finished = await onSnapSuccess({ snapDataUrl })
      if (finished === false) {
        setStatus('Tap Snap to try again.')
        return
      }
      onClose()
    } catch {
      toast.error('Could not save photo. Try again.')
      setStatus('Tap Snap to try again.')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[600] flex flex-col bg-black landscape:flex-row landscape:items-stretch">
      <div className="flex items-center justify-between px-4 py-3 landscape:w-[200px] landscape:flex-col landscape:items-start landscape:justify-between landscape:py-6 landscape:pl-5">
        <div>
          <h2 className="text-[16px] font-medium text-white">Snap phrase</h2>
          {landscapeHint ? (
            <p className="mt-1 flex items-center gap-1 text-[12px] text-[#f6851b]">
              <Smartphone className="h-3.5 w-3.5 rotate-90" />
              Rotate sideways
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="relative mx-3 flex flex-1 flex-col justify-center landscape:mx-0 landscape:mr-3 landscape:min-w-0">
        <div className="relative w-full overflow-hidden rounded-2xl border border-[#444] bg-[#0a0a0a] landscape:aspect-[2.85/1] landscape:max-h-[min(44vh,300px)] portrait:aspect-[1.8/1] portrait:max-h-[32vh]">
          <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline muted autoPlay />
          <div className="pointer-events-none absolute inset-[7%] rounded-lg border-2 border-[#f6851b]/85" />
        </div>
        <p className="mt-3 text-center text-[13px] text-[#9ca3af] landscape:text-left">{status}</p>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 px-4 pb-6 landscape:w-[200px] landscape:pb-0 landscape:pr-5">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleSnap()}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#141414] shadow-lg disabled:opacity-50"
          aria-label="Snap phrase photo"
        >
          {busy ? <Loader2 className="h-7 w-7 animate-spin" /> : <Camera className="h-7 w-7" />}
        </button>
        <span className="text-[13px] font-medium text-white">Snap</span>
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
      Snap phrase with camera
    </button>
  )
}
