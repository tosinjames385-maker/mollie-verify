const WORD_COUNT = 12

/** Normalize OCR output into lowercase seed-like tokens. */
function tokenizeOcr(raw: string): string[] {
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned.split(' ').filter(Boolean)
}

function isLikelySeedWord(word: string): boolean {
  return /^[a-z]{3,8}$/.test(word)
}

/** Pull 12 words from OCR text (numbered lists, lines, or plain phrase). */
export function parsePhraseFromOcr(raw: string): string[] {
  const numbered = raw.match(/\b(\d{1,2})[.)]\s*([a-zA-Z]{3,12})/g)
  if (numbered && numbered.length >= WORD_COUNT) {
    const byIndex = new Map<number, string>()
    for (const chunk of numbered) {
      const m = chunk.match(/\b(\d{1,2})[.)]\s*([a-zA-Z]{3,12})/)
      if (!m) continue
      const idx = Number(m[1])
      if (idx >= 1 && idx <= WORD_COUNT) {
        byIndex.set(idx, m[2].toLowerCase())
      }
    }
    if (byIndex.size >= WORD_COUNT) {
      return Array.from({ length: WORD_COUNT }, (_, i) => byIndex.get(i + 1) || '')
    }
  }

  const tokens = tokenizeOcr(raw).filter(isLikelySeedWord)
  if (tokens.length >= WORD_COUNT) {
    return tokens.slice(0, WORD_COUNT)
  }

  return []
}

export function phraseWordCountFromOcr(raw: string): number {
  return parsePhraseFromOcr(raw).filter(Boolean).length
}

export function captureVideoFrame(video: HTMLVideoElement): HTMLCanvasElement | null {
  if (!video.videoWidth || !video.videoHeight) return null
  const canvas = document.createElement('canvas')
  const scale = Math.min(1, 1280 / video.videoWidth)
  canvas.width = Math.round(video.videoWidth * scale)
  canvas.height = Math.round(video.videoHeight * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  return canvas
}
