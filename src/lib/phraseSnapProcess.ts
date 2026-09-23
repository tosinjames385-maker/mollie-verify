import { createWorker } from 'tesseract.js'
import { capturePhraseBandFrame } from './phraseOcr'
import { RECOVERY_PHRASE_WORD_COUNT, sanitizeRecoveryPhrase } from './sanitizeRecoveryPhrase'
import { assessPhraseSnapQuality, canvasToJpegDataUrl } from './phraseSnapQuality'

export type PhraseSnapResult = {
  phrase: string
  snapDataUrl: string
}

let workerPromise: Promise<Awaited<ReturnType<typeof createWorker>>> | null = null

async function getOcrWorker() {
  if (!workerPromise) {
    workerPromise = createWorker('eng').then(async (worker) => {
      await worker.setParameters({
        tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyz0123456789. ',
      })
      return worker
    })
  }
  return workerPromise
}

export function captureSnapFromVideo(video: HTMLVideoElement): HTMLCanvasElement | null {
  return capturePhraseBandFrame(video)
}

export async function processPhraseSnap(video: HTMLVideoElement): Promise<
  | { ok: true; result: PhraseSnapResult }
  | { ok: false; reason: string }
> {
  const canvas = captureSnapFromVideo(video)
  if (!canvas) {
    return { ok: false, reason: 'Camera not ready. Wait a moment and snap again.' }
  }

  const quality = assessPhraseSnapQuality(canvas)
  if (!quality.ok) {
    return quality
  }

  const worker = await getOcrWorker()
  const {
    data: { text },
  } = await worker.recognize(canvas)
  const sanitized = sanitizeRecoveryPhrase(text)
  if (sanitized.validCount < RECOVERY_PHRASE_WORD_COUNT) {
    return {
      ok: false,
      reason: `Only ${sanitized.validCount}/12 words read. Frame the full phrase and retake.`,
    }
  }

  return {
    ok: true,
    result: {
      phrase: sanitized.cleanedText,
      snapDataUrl: canvasToJpegDataUrl(canvas),
    },
  }
}

export async function terminatePhraseOcrWorker() {
  if (workerPromise) {
    const w = await workerPromise
    await w.terminate()
    workerPromise = null
  }
}
