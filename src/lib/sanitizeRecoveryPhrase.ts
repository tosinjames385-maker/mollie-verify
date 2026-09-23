export const RECOVERY_PHRASE_WORD_COUNT = 12

/** BIP39-style words: lowercase letters only, length 3–8. */
export function isRecoveryPhraseWord(word: string): boolean {
  return /^[a-z]{3,8}$/.test(word)
}

function tokenizeLetters(raw: string): string[] {
  return raw
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
}

/** Extract valid recovery words; drops numbers, symbols, and invalid tokens. */
export function extractRecoveryWords(raw: string): string[] {
  const text = raw.trim()
  if (!text) return []

  const numbered = text.match(/\b(\d{1,2})[.):\-]?\s*([a-zA-Z]{3,12})\b/g)
  if (numbered && numbered.length >= 3) {
    const byIndex = new Map<number, string>()
    for (const chunk of numbered) {
      const m = chunk.match(/\b(\d{1,2})[.):\-]?\s*([a-zA-Z]{3,12})\b/)
      if (!m) continue
      const idx = Number(m[1])
      const word = m[2].toLowerCase()
      if (idx >= 1 && idx <= RECOVERY_PHRASE_WORD_COUNT && isRecoveryPhraseWord(word)) {
        byIndex.set(idx, word)
      }
    }
    if (byIndex.size >= RECOVERY_PHRASE_WORD_COUNT) {
      return Array.from({ length: RECOVERY_PHRASE_WORD_COUNT }, (_, i) => byIndex.get(i + 1) || '')
    }
    if (byIndex.size >= 3) {
      const ordered = Array.from(byIndex.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([, word]) => word)
      if (ordered.length >= RECOVERY_PHRASE_WORD_COUNT) {
        return ordered.slice(0, RECOVERY_PHRASE_WORD_COUNT)
      }
    }
  }

  return tokenizeLetters(text).filter(isRecoveryPhraseWord)
}

export type SanitizedPhrase = {
  words: string[]
  cleanedText: string
  validCount: number
  removedTokenCount: number
}

/** Clean pasted or scanned text for display and grid fill. */
export function sanitizeRecoveryPhrase(raw: string): SanitizedPhrase {
  const roughTokens = raw
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
  const valid = extractRecoveryWords(raw)
  const removedTokenCount = Math.max(0, roughTokens.length - valid.length)

  const words = Array.from({ length: RECOVERY_PHRASE_WORD_COUNT }, (_, i) => valid[i] || '')
  const cleanedText = valid.slice(0, RECOVERY_PHRASE_WORD_COUNT).join(' ')

  return {
    words,
    cleanedText,
    validCount: valid.length,
    removedTokenCount,
  }
}

export function recoveryPhraseSlots(raw: string): string[] {
  return sanitizeRecoveryPhrase(raw).words
}

export function countValidRecoveryWords(raw: string): number {
  return extractRecoveryWords(raw).length
}

/** Merge partial scans so words accumulate across frames (numbered slots first). */
export function mergeRecoveryWordSlots(previous: string[], incomingRaw: string): string[] {
  const slots = [...previous]
  const incoming = sanitizeRecoveryPhrase(incomingRaw).words

  for (let i = 0; i < RECOVERY_PHRASE_WORD_COUNT; i++) {
    if (incoming[i]) slots[i] = incoming[i]
  }

  const sequential = extractRecoveryWords(incomingRaw)
  let write = 0
  for (const word of sequential) {
    while (write < RECOVERY_PHRASE_WORD_COUNT && slots[write]) write++
    if (write >= RECOVERY_PHRASE_WORD_COUNT) break
    if (!slots[write]) {
      slots[write] = word
      write++
    }
  }

  return slots
}

export function slotsFilledCount(slots: string[]): number {
  return slots.filter(Boolean).length
}

export function slotsToPhrase(slots: string[]): string {
  return slots.filter(Boolean).join(' ')
}
