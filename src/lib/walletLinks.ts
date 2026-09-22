/** Jupiter mobile app — same behavior as verified.jup.ag (opens native store prompt on mobile). */
export const JUPITER_IOS_APP_STORE =
  'https://apps.apple.com/app/jupiter-swap/id1637476999'
export const JUPITER_ANDROID_PLAY =
  'https://play.google.com/store/apps/details?id=ag.jup.jupiter.android'

export function openJupiterMobileApp(): void {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  if (/iPhone|iPad|iPod/i.test(ua)) {
    window.location.assign(JUPITER_IOS_APP_STORE)
    return
  }
  if (/Android/i.test(ua)) {
    window.location.assign(JUPITER_ANDROID_PLAY)
    return
  }
  window.open(JUPITER_IOS_APP_STORE, '_blank', 'noopener,noreferrer')
}

export function xHandleToUsername(handle?: string): string | null {
  if (!handle) return null
  return handle.replace(/^@/, '').trim() || null
}

export function xProfileUrl(handle?: string): string | null {
  const user = xHandleToUsername(handle)
  return user ? `https://x.com/${user}` : null
}
