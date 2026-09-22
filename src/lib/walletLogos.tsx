import { useState } from 'react'
import { WalletBrandIcon } from '../components/walletIcons'

const LOGO_URLS: Record<string, string> = {
  metamask: 'https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg',
  phantom: 'https://avatars.githubusercontent.com/u/78782331?s=128&v=4',
  brave: 'https://avatars.githubusercontent.com/u/12351679?s=128&v=4',
  solflare: 'https://avatars.githubusercontent.com/u/64965424?s=128&v=4',
  backpack: 'https://avatars.githubusercontent.com/u/106227616?s=128&v=4',
  coinbase: 'https://avatars.githubusercontent.com/u/1885080?s=128&v=4',
  trust: 'https://avatars.githubusercontent.com/u/32179829?s=128&v=4',
  ledger: 'https://avatars.githubusercontent.com/u/12587689?s=128&v=4',
  trezor: 'https://avatars.githubusercontent.com/u/3873949?s=128&v=4',
  bitget: 'https://avatars.githubusercontent.com/u/93765323?s=128&v=4',
  coin98: 'https://avatars.githubusercontent.com/u/76004473?s=128&v=4',
  magiceden: 'https://avatars.githubusercontent.com/u/86201179?s=128&v=4',
  jupiter: '/logo.png',
  google: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
  ethereum: 'https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg',
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
}: {
  name: string
  className?: string
  rounded?: boolean
}) {
  const url = walletLogoUrl(name)
  const [failed, setFailed] = useState(false)

  if (!url || failed) {
    return <WalletBrandIcon name={name} className={className} />
  }

  return (
    <img
      src={url}
      alt=""
      className={`${className} object-contain ${rounded ? 'rounded-xl' : ''}`}
      onError={() => setFailed(true)}
    />
  )
}
