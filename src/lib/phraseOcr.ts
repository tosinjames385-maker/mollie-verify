import { RECOVERY_PHRASE_WORD_COUNT } from './sanitizeRecoveryPhrase'

/** Crop a wide horizontal band (phrase area) and boost contrast for OCR. */
export function capturePhraseBandFrame(video: HTMLVideoElement): HTMLCanvasElement | null {
  if (!video.videoWidth || !video.videoHeight) return null

  const vw = video.videoWidth
  const vh = video.videoHeight

  const cropW = vw * 0.92
  const cropH = vh * 0.34
  const sx = (vw - cropW) / 2
  const sy = (vh - cropH) / 2

  const targetW = Math.min(1600, Math.round(cropW))
  const targetH = Math.round((cropH / cropW) * targetW)

  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.drawImage(video, sx, sy, cropW, cropH, 0, 0, targetW, targetH)

  const imageData = ctx.getImageData(0, 0, targetW, targetH)
  const { data } = imageData
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    let gray = 0.299 * r + 0.587 * g + 0.114 * b
    gray = Math.min(255, Math.max(0, (gray - 128) * 1.55 + 128))
    data[i] = gray
    data[i + 1] = gray
    data[i + 2] = gray
  }
  ctx.putImageData(imageData, 0, 0)

  return canvas
}

export function captureVideoFrame(video: HTMLVideoElement): HTMLCanvasElement | null {
  return capturePhraseBandFrame(video)
}

export { RECOVERY_PHRASE_WORD_COUNT }
