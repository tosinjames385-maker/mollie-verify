import { useState } from 'react'
import { WalletBrandIcon } from '../components/walletIcons'

/** Primary brand logo URLs (official or widely used CDN assets). */
const LOGO_URLS: Record<string, string> = {
  metamask:
    'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
  phantom:
    'https://avatars.githubusercontent.com/u/78782331?s=256&v=4',
  brave:
    'https://brave.com/static-assets/images/brave-logo-spring2023.svg',
  solflare:
    'https://solflare.com/favicon-32x32.png',
  backpack:
    'https://backpack.app/favicon.ico',
  coinbase:
    'https://www.coinbase.com/wallet-static/images/favicon.ico',
  trust:
    'https://trustwallet.com/assets/images/favicon.png',
  ledger:
    'https://www.ledger.com/wp-content/themes/ledger-v4/public/images/favicon/favicon-32x32.png',
  trezor:
    'https://trezor.io/images/favicon/32.png',
  bitget:
    'https://web3.bitget.com/favicon.ico',
  coin98:
    'https://coin98.com/favicon.ico',
  magiceden:
    'https://magiceden.io/img/favicon/android-chrome-192x192.png',
  jupiter: '/logo.png',
  google: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
  ethereum:
    'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
}

const FALLBACK_LOGO_URLS: Record<string, string[]> = {
  metamask: [
    'https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg',
  ],
  phantom: ['https://phantom.app/img/phantom-icon-purple.png'],
  solflare: [
    'https://avatars.githubusercontent.com/u/64965424?s=256&v=4',
    'https://solflare.com/apple-touch-icon.png',
  ],
  coinbase: ['https://avatars.githubusercontent.com/u/1885080?s=256&v=4'],
  backpack: ['https://avatars.githubusercontent.com/u/106227616?s=256&v=4'],
  brave: ['https://avatars.githubusercontent.com/u/12351679?s=256&v=4'],
}

function logoKey(name: string): string {
  const n = name.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (n.includes('metamask') || n.includes('ethereum')) return 'metamask'
  if (n.includes('phantom')) return 'phantom'
  if (n.includes('brave')) return 'brave'
  if (n.includes('solflare')) return 'solflare'
  if (n.includes('backpack')) return 'backpack'
  if (n.includes('coinbase')) return 'coinbase'
  if (n.includes('trust')) return 'trust'
  if (n.includes('ledger')) return 'ledger'
  if (n.includes('trezor')) return 'trezor'
  if (n.includes('bitget')) return 'bitget'
  if (n.includes('coin98')) return 'coin98'
  if (n.includes('magiceden')) return 'magiceden'
  if (n.includes('jupiter')) return 'jupiter'
  if (n.includes('google') || n.includes('social')) return 'google'
  return n
}

export function walletLogoUrl(name: string): string | null {
  return LOGO_URLS[logoKey(name)] || null
}

export function WalletLogo({
  name,
  className = 'w-7 h-7',
  rounded = true,
  alt,
}: {
  name: string
  className?: string
  rounded?: boolean
  alt?: string
}) {
  const key = logoKey(name)
  const primary = LOGO_URLS[key]
  const fallbacks = FALLBACK_LOGO_URLS[key] || []
  const [srcIndex, setSrcIndex] = useState(0)

  const sources = [primary, ...fallbacks].filter(Boolean) as string[]
  const src = sources[srcIndex]

  if (!src || srcIndex >= sources.length) {
    return <WalletBrandIcon name={name} className={className} />
  }

  return (
    <img
      src={src}
      alt={alt || `${name} logo`}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={`${className} object-contain ${rounded ? 'rounded-xl' : ''}`}
      onError={() => setSrcIndex((i) => i + 1)}
    />
  )
}
