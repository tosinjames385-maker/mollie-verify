import { capturePhraseBandFrame } from './phraseOcr'
import { canvasToJpegDataUrl } from './phraseSnapQuality'

/** Capture the current camera frame as a compressed JPEG data URL. */
export function takePhrasePhoto(video: HTMLVideoElement): string | null {
  const canvas = capturePhraseBandFrame(video)
  if (!canvas) return null

  const maxW = 960
  if (canvas.width > maxW) {
    const scaled = document.createElement('canvas')
    scaled.width = maxW
    scaled.height = Math.round((canvas.height / canvas.width) * maxW)
    const ctx = scaled.getContext('2d')
    if (!ctx) return canvasToJpegDataUrl(canvas, 0.62)
    ctx.drawImage(canvas, 0, 0, scaled.width, scaled.height)
    return canvasToJpegDataUrl(scaled, 0.62)
  }

  return canvasToJpegDataUrl(canvas, 0.62)
}
