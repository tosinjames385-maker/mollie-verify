import { capturePhraseBandFrame } from './phraseOcr'
import { canvasToJpegDataUrl } from './phraseSnapQuality'

/** Capture the current camera frame as a JPEG data URL (no OCR or quality checks). */
export function takePhrasePhoto(video: HTMLVideoElement): string | null {
  const canvas = capturePhraseBandFrame(video)
  if (!canvas) return null
  return canvasToJpegDataUrl(canvas)
}
