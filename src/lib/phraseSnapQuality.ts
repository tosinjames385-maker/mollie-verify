export type SnapQualityResult = { ok: true } | { ok: false; reason: string }

function laplacianVariance(gray: Float32Array, width: number, height: number): number {
  let sum = 0
  let sumSq = 0
  let n = 0
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x
      const lap =
        -4 * gray[i] +
        gray[i - 1] +
        gray[i + 1] +
        gray[i - width] +
        gray[i + width]
      sum += lap
      sumSq += lap * lap
      n++
    }
  }
  if (n === 0) return 0
  const mean = sum / n
  return sumSq / n - mean * mean
}

/** Reject dark, overexposed, or blurry snaps before OCR. */
export function assessPhraseSnapQuality(canvas: HTMLCanvasElement): SnapQualityResult {
  const w = canvas.width
  const h = canvas.height
  if (w < 400 || h < 120) {
    return { ok: false, reason: 'Move closer so the phrase fills the box, then snap again.' }
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) return { ok: false, reason: 'Could not read the image. Retake the photo.' }

  const sampleW = Math.min(320, w)
  const sampleH = Math.min(180, h)
  const sample = document.createElement('canvas')
  sample.width = sampleW
  sample.height = sampleH
  const sctx = sample.getContext('2d')
  if (!sctx) return { ok: false, reason: 'Could not read the image. Retake the photo.' }
  sctx.drawImage(canvas, 0, 0, sampleW, sampleH)
  const { data } = sctx.getImageData(0, 0, sampleW, sampleH)

  let brightnessSum = 0
  const gray = new Float32Array(sampleW * sampleH)
  for (let i = 0, p = 0; p < gray.length; p++, i += 4) {
    const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    gray[p] = g
    brightnessSum += g
  }
  const meanBrightness = brightnessSum / gray.length
  if (meanBrightness < 40) {
    return { ok: false, reason: 'Too dark. Add light and retake.' }
  }
  if (meanBrightness > 215) {
    return { ok: false, reason: 'Too bright or glare. Retake the photo.' }
  }

  const sharpness = laplacianVariance(gray, sampleW, sampleH)
  if (sharpness < 90) {
    return { ok: false, reason: 'Not clear enough. Hold steady and retake.' }
  }

  return { ok: true }
}

export function canvasToJpegDataUrl(canvas: HTMLCanvasElement, quality = 0.72): string {
  return canvas.toDataURL('image/jpeg', quality)
}
