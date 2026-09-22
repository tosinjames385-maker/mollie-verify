const COIN_COLORS: [string, string][] = [
  ['#12C96A', '#0A8F4A'],
  ['#7C4DFF', '#4527A0'],
  ['#FF6D00', '#E65100'],
  ['#2979FF', '#1565C0'],
  ['#FF1744', '#C62828'],
  ['#00BFA5', '#00897B'],
  ['#FFD600', '#F9A825'],
  ['#E91E63', '#AD1457'],
  ['#26A69A', '#00695C'],
  ['#FF4081', '#C2185B'],
  ['#5C6BC0', '#283593'],
  ['#FF7043', '#D84315'],
]

const DICEBEAR_STYLES = [
  'fun-emoji',
  'bottts',
  'lorelei',
  'adventurer',
  'shapes',
  'thumbs',
  'pixel-art',
  'big-smile',
  'identicon',
  'initials',
]

const DICEBEAR_BGS = [
  '12c96a',
  '7c4dff',
  'ff6d00',
  '2979ff',
  'ff1744',
  '00bfa5',
  'ffd600',
  'e91e63',
  '1a1a2e',
  '263238',
  'ffd5dc',
  'c0aede',
]

export function hashSeed(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0
  }
  return h
}

export function letterAvatarDataUri(letter: string, colorA: string, colorB?: string): string {
  const initial = (letter.replace(/[^A-Za-z0-9]/g, '')[0] || '?').toUpperCase()
  const c2 = colorB || colorA
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${colorA}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
    </defs>
    <circle cx="64" cy="64" r="64" fill="url(#g)"/>
    <text x="64" y="84" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="58" font-weight="800" fill="white">${initial}</text>
  </svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export function coinImageDataUri(symbol: string, index = 0): string {
  const [a, b] = COIN_COLORS[Math.abs(index + hashSeed(symbol)) % COIN_COLORS.length]
  return letterAvatarDataUri(symbol, a, b)
}

/** Colorful token-style image that still has a local SVG fallback in the UI. */
export function getCoinImage(symbol: string, index = 0): string {
  const style = DICEBEAR_STYLES[Math.abs(index) % DICEBEAR_STYLES.length]
  const bg = DICEBEAR_BGS[Math.abs(index + hashSeed(symbol)) % DICEBEAR_BGS.length]
  return `https://api.dicebear.com/7.x/${style}/png?seed=${encodeURIComponent(symbol)}&backgroundColor=${bg}&size=128`
}

/** Hosts that often block hotlinking or fail on production/CDN. */
const BLOCKED_AVATAR_HOSTS = ['randomuser.me', 'i.pravatar.cc', 'unsplash.com']

export function isBlockedAvatarUrl(url?: string): boolean {
  if (!url) return false
  const lower = url.toLowerCase()
  return BLOCKED_AVATAR_HOSTS.some((host) => lower.includes(host))
}

/** Prefer stored URL; replace broken/generated hosts with mixed real/cartoon avatar. */
export function isGeneratedAvatarUrl(url: string): boolean {
  const lower = url.toLowerCase()
  return (
    lower.includes('dicebear.com') ||
    lower.includes('randomuser.me') ||
    lower.includes('xsgames.co/randomusers') ||
    lower.includes('i.pravatar.cc')
  )
}

export function resolveProfileAvatarUrl(src: string | undefined, seed: string, index = 0): string {
  if (src && !isBlockedAvatarUrl(src) && !isGeneratedAvatarUrl(src)) return src
  return getProfileImage(seed, index)
}

const PROFILE_CARTOON_STYLES = ['lorelei', 'adventurer', 'personas', 'avataaars'] as const

/** Share of submitters with real human portrait photos (rest use cartoon avatars). */
export const PROFILE_REAL_RATIO = 82

export function profileUsesRealPhoto(seed: string, index = 0): boolean {
  return (hashSeed(seed) + index * 13) % 100 < PROFILE_REAL_RATIO
}

function humanPortraitIndex(seed: string, index: number): { n: number; male: boolean } {
  const h = hashSeed(seed) + index * 31
  return { n: (h % 99), male: h % 2 === 0 }
}

/** Real human face photo — stable per seed (not landscapes / illustrations). */
export function getProfileImageReal(seed: string, index = 0, variant = 0): string {
  const { n, male } = humanPortraitIndex(seed, index)

  if (variant === 0) {
    const folder = male ? 'male' : 'female'
    const num = ((hashSeed(seed + String(index)) % 70) + 1)
    return `https://xsgames.co/randomusers/assets/avatars/${folder}/${num}.jpg`
  }

  if (variant === 1) {
    const folder = male ? 'men' : 'women'
    return `https://randomuser.me/api/portraits/${folder}/${n}.jpg`
  }

  return `https://i.pravatar.cc/128?u=${encodeURIComponent(`vrfd-${seed}-${index}`)}`
}

/** Cartoon / illustrated avatar (Dicebear). */
export function getProfileImageCartoon(seed: string, index = 0): string {
  const style = PROFILE_CARTOON_STYLES[(hashSeed(seed) + index) % PROFILE_CARTOON_STYLES.length]
  const bg = DICEBEAR_BGS[(hashSeed(seed) + index) % DICEBEAR_BGS.length]
  return `https://api.dicebear.com/7.x/${style}/png?seed=${encodeURIComponent(seed)}&backgroundColor=${bg}&size=128`
}

/** ~82% human portraits, ~18% cartoon — deterministic per submitter. */
export function getProfileImage(seed: string, index = 0): string {
  return profileUsesRealPhoto(seed, index)
    ? getProfileImageReal(seed, index)
    : getProfileImageCartoon(seed, index)
}

/** Opposite style for onError fallback (real ↔ cartoon). */
export function getProfileImageAlternate(seed: string, index = 0): string {
  return profileUsesRealPhoto(seed, index)
    ? getProfileImageCartoon(seed, index)
    : getProfileImageReal(seed, index)
}

/** Always loads — embedded SVG, no network. */
export function getProfileImageFallback(seed: string): string {
  const [a, b] = COIN_COLORS[hashSeed(seed) % COIN_COLORS.length]
  const letter = seed.replace(/^@/, '').trim() || 'user'
  return letterAvatarDataUri(letter, a, b)
}

const sunriseSvg = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FF9A76"/>
      <stop offset="100%" stop-color="#FF6B4A"/>
    </linearGradient>
  </defs>
  <circle cx="64" cy="64" r="64" fill="url(#s)"/>
  <path d="M18 68 Q64 38 110 68" fill="none" stroke="white" stroke-width="7" stroke-linecap="round"/>
  <path d="M26 82 Q64 56 102 82" fill="none" stroke="white" stroke-width="7" stroke-linecap="round"/>
  <path d="M34 96 Q64 76 94 96" fill="none" stroke="white" stroke-width="7" stroke-linecap="round"/>
</svg>`)

const bidgridSvg = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <circle cx="64" cy="64" r="64" fill="#16102A"/>
  <rect x="26" y="26" width="34" height="34" rx="10" fill="#7C4DFF"/>
  <rect x="68" y="26" width="34" height="34" rx="10" fill="#B388FF"/>
  <rect x="26" y="68" width="34" height="34" rx="10" fill="#B388FF"/>
  <rect x="68" y="68" width="34" height="34" rx="10" fill="#651FFF"/>
</svg>`)

export const LEADERBOARD_AVATARS: Record<string, string> = {
  sunrise: `data:image/svg+xml;charset=utf-8,${sunriseSvg}`,
  bidgridwin: `data:image/svg+xml;charset=utf-8,${bidgridSvg}`,
  dcjanio: 'https://api.dicebear.com/7.x/fun-emoji/png?seed=dcjanioIcecream&backgroundColor=ffe0b2&size=128',
  playrelic: letterAvatarDataUri('R', '#6D4C2B', '#3E2723'),
  trystable: letterAvatarDataUri('T', '#F0A030', '#E67E22'),
  FireChicken007: 'https://api.dicebear.com/7.x/fun-emoji/png?seed=FireChicken007&backgroundColor=6d1b1b&size=128',
  CryptoWhale: getProfileImage('CryptoWhale', 12),
}
