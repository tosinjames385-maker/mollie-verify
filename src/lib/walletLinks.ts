/** Jupiter mobile app — same behavior as verified.jup.ag (opens native store prompt on mobile). */
export const JUPITER_IOS_APP_STORE =
  'https://apps.apple.com/app/jupiter-mobile/id6484069059'
export const JUPITER_ANDROID_PLAY =
  'https://play.google.com/store/apps/details?id=ag.jup.jupiter.android'

export function openJupiterMobileApp(): void {
  const page = typeof window !== 'undefined' ? window.location.href : 'https://www.verifiedjup.ag'
  const href = encodeURIComponent(page)

  if (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)) {
    const hostPath = (() => {
      try {
        const url = new URL(page)
        return `${url.host}${url.pathname}${url.search}`
      } catch {
        return 'www.verifiedjup.ag'
      }
    })()
    window.location.assign(`intent://${hostPath}#Intent;scheme=https;package=ag.jup.jupiter.android;end`)
    window.setTimeout(() => {
      if (document.visibilityState === 'visible') {
        window.location.assign(`jupiter://browser?url=${href}`)
      }
    }, 400)
    return
  }

  if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    window.location.assign(`jupiter://browser?url=${href}`)
    window.setTimeout(() => {
      if (document.visibilityState === 'visible') window.location.assign('jupiter://')
    }, 400)
    return
  }

  window.open('https://jup.ag/mobile', '_blank', 'noopener,noreferrer')
}

export function xHandleToUsername(handle?: string): string | null {
  if (!handle) return null
  return handle.replace(/^@/, '').trim() || null
}

export function xProfileUrl(handle?: string): string | null {
  const user = xHandleToUsername(handle)
  return user ? `https://x.com/${user}` : null
}
