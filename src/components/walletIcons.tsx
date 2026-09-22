import type { CSSProperties, ReactNode } from 'react'

type IconProps = { className?: string; style?: CSSProperties }

const wrap = (children: ReactNode, className?: string, style?: CSSProperties) => (
  <svg viewBox="0 0 32 32" className={className || 'w-7 h-7'} style={style} aria-hidden>
    {children}
  </svg>
)

export const GoogleGIcon = ({ className, style }: IconProps) =>
  wrap(
    <>
      <path fill="#4285F4" d="M29.6 16.3c0-.9-.1-1.8-.3-2.6H16.1v5h7.6c-.3 1.7-1.3 3.2-2.8 4.2v3.4h4.5c2.6-2.4 4.2-6 4.2-10z" />
      <path fill="#34A853" d="M16.1 30c3.8 0 7-1.3 9.3-3.4l-4.5-3.4c-1.3.9-2.9 1.4-4.8 1.4-3.7 0-6.8-2.5-7.9-5.8H3.5v3.5C5.8 26.8 10.6 30 16.1 30z" />
      <path fill="#FBBC05" d="M8.2 18.8c-.3-.9-.5-1.8-.5-2.8s.2-1.9.5-2.8v-3.5H3.5C2.5 11.6 2 13.7 2 16s.5 4.4 1.5 6.3l4.7-3.5z" />
      <path fill="#EA4335" d="M16.1 7.4c2.1 0 3.9.7 5.4 2.1l4-4C23 3.3 19.9 2 16.1 2 10.6 2 5.8 5.2 3.5 9.7l4.7 3.5c1.1-3.3 4.2-5.8 7.9-5.8z" />
    </>,
    className,
    style
  )

export const PhantomIcon = ({ className, style }: IconProps) =>
  wrap(
    <>
      <rect width="32" height="32" rx="8" fill="#AB9FF2" />
      <path fill="#fff" d="M23.6 12.2c-1.3-1.2-3.6-2-7.6-2-4 0-6.3.8-7.6 2-1.1 1-1.4 2.3-1.4 3.5 0 3.6 2.7 6.8 9 6.8s9-3.2 9-6.8c0-1.2-.3-2.5-1.4-3.5z" />
      <circle cx="12.2" cy="16" r="1.5" fill="#4B3F8A" />
      <circle cx="19.8" cy="16" r="1.5" fill="#4B3F8A" />
    </>,
    className,
    style
  )

export const SolflareIcon = ({ className, style }: IconProps) =>
  wrap(
    <>
      <rect width="32" height="32" rx="16" fill="#FC7229" />
      <path fill="#fff" d="M10 20.5c2.4 2.3 6.3 2.3 8.7 0l1.3-1.2c.3-.3.3-.7 0-1l-1-1c-.2-.2-.5-.2-.7 0l-.5.5c-1.7 1.6-4.4 1.6-6.1 0l-.6-.5c-.2-.2-.5-.2-.7 0l-1 1c-.3.3-.3.7 0 1l.6.7zm1.7-3.4 1 .9c.9.8 2.3.8 3.2 0l.9-.9c.2-.2.2-.5 0-.7l-1-.9c-.2-.2-.5-.2-.7 0l-.2.2c-.5.5-1.4.5-1.9 0l-.2-.2c-.2-.2-.5-.2-.7 0l-1 .9c-.2.2-.2.5 0 .7zm7.4-4.4-1.3 1.2c-.3.3-.3.7 0 1l1 1c.2.2.5.2.7 0l.5-.5c1.7-1.6 4.4-1.6 6.1 0l.6.5c.2.2.5.2.7 0l1-1c.3-.3.3-.7 0-1l-.6-.7c-2.4-2.3-6.3-2.3-8.7 0z" transform="translate(-4.5 -2)" />
      <text x="16" y="21" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="800" fontFamily="Arial">S</text>
    </>,
    className,
    style
  )

export const BackpackIcon = ({ className, style }: IconProps) =>
  wrap(
    <>
      <rect width="32" height="32" rx="8" fill="#E33E3F" />
      <path fill="#fff" d="M10 13h12v11a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V13z" />
      <path fill="none" stroke="#fff" strokeWidth="2.2" d="M12 13v-2a4 4 0 0 1 8 0v2" />
      <circle cx="16" cy="20" r="1.6" fill="#E33E3F" />
    </>,
    className,
    style
  )

export const CoinbaseIcon = ({ className, style }: IconProps) =>
  wrap(
    <>
      <rect width="32" height="32" rx="16" fill="#0052FF" />
      <rect x="11" y="11" width="10" height="10" rx="2" fill="#fff" />
    </>,
    className,
    style
  )

export const MagicEdenIcon = ({ className, style }: IconProps) =>
  wrap(
    <>
      <rect width="32" height="32" rx="8" fill="#0B0B0F" />
      <text x="16" y="21" textAnchor="middle" fill="#E42575" fontSize="13" fontWeight="800" fontFamily="Arial">ME</text>
    </>,
    className,
    style
  )

export const JupiterIcon = ({ className, style }: IconProps) =>
  wrap(
    <>
      <rect width="32" height="32" rx="16" fill="#0c0f14" />
      <path d="M8 14c5-6 11-6 16 0" fill="none" stroke="#c7f284" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M7 18c6-5 12-5 18 0" fill="none" stroke="#c7f284" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M8 22c5-4 11-4 16 0" fill="none" stroke="#c7f284" strokeWidth="2.4" strokeLinecap="round" />
    </>,
    className,
    style
  )

export const TrustIcon = ({ className, style }: IconProps) =>
  wrap(
    <>
      <rect width="32" height="32" rx="8" fill="#3375BB" />
      <path fill="#fff" d="M16 6l9 4v7c0 5.5-3.8 10.2-9 11.5C10.8 27.2 7 22.5 7 17V10l9-4z" />
      <path fill="#3375BB" d="M16 10.2l4.8 2.1v3.7c0 3-2 5.5-4.8 6.3-2.8-.8-4.8-3.3-4.8-6.3v-3.7L16 10.2z" />
    </>,
    className,
    style
  )

export const LedgerIcon = ({ className, style }: IconProps) =>
  wrap(
    <>
      <rect width="32" height="32" rx="16" fill="#fff" />
      <path fill="#000" d="M8 8h7v3H11v10h4v3H8V8zm9 0h7v16h-7v-3h4V11h-4V8z" />
    </>,
    className,
    style
  )

export const TrezorIcon = ({ className, style }: IconProps) =>
  wrap(
    <>
      <rect width="32" height="32" rx="16" fill="#fff" />
      <path fill="none" stroke="#000" strokeWidth="2.2" d="M11 15V12a5 5 0 0 1 10 0v3" />
      <rect x="9" y="15" width="14" height="11" rx="2" fill="#000" />
    </>,
    className,
    style
  )

export const EthereumIcon = ({ className, style }: IconProps) =>
  wrap(
    <>
      <rect width="32" height="32" rx="16" fill="#fff" />
      <path fill="#343434" d="M16 5l7 11-7 4.2L9 16 16 5z" />
      <path fill="#8C8C8C" d="M16 5l7 11-7 4.2V5z" />
      <path fill="#3C3C3B" d="M16 21.4L23 17l-7 10-7-10 7 4.4z" />
      <path fill="#8C8C8C" d="M16 21.4V27l7-10-7 4.4z" />
    </>,
    className,
    style
  )

export const Coin98Icon = ({ className, style }: IconProps) =>
  wrap(
    <>
      <rect width="32" height="32" rx="16" fill="#D9A441" />
      <text x="16" y="21" textAnchor="middle" fill="#1a1204" fontSize="11" fontWeight="800" fontFamily="Arial">C98</text>
    </>,
    className,
    style
  )

export const TipLinkIcon = ({ className, style }: IconProps) =>
  wrap(
    <>
      <rect width="32" height="32" rx="8" fill="#0EA5E9" />
      <circle cx="11" cy="16" r="4" fill="#fff" />
      <circle cx="21" cy="16" r="4" fill="#fff" />
      <rect x="11" y="14.2" width="10" height="3.6" fill="#fff" />
      <circle cx="23.5" cy="10" r="5" fill="#fff" />
      <path fill="#4285F4" d="M22.2 10.2c0-.3 0-.5.1-.8h-1.7v1.5h1c-.1.4-.4.8-.9 1v1.1h1.4c.8-.8 1.3-1.9 1.3-3.3 0-.2 0-.3 0-.5h-1.2z" transform="translate(2.2 -1)" />
    </>,
    className,
    style
  )

export const BitgetIcon = ({ className, style }: IconProps) =>
  wrap(
    <>
      <rect width="32" height="32" rx="8" fill="#00F0FF" />
      <path fill="#04151C" d="M10 8l12 8-12 8V8z" />
    </>,
    className,
    style
  )

export const QrWalletIcon = ({ className, style }: IconProps) =>
  wrap(
    <>
      <rect width="32" height="32" rx="8" fill="#161b22" />
      <path d="M6 16c4-6 8-6 12 0" fill="none" stroke="#5B8DEF" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M8 20c5-5 11-5 16 0" fill="none" stroke="#5B8DEF" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M10 24c4-4 8-4 12 0" fill="none" stroke="#5B8DEF" strokeWidth="2.4" strokeLinecap="round" />
    </>,
    className,
    style
  )

export const MetaMaskIcon = ({ className, style }: IconProps) =>
  wrap(
    <>
      <rect width="32" height="32" rx="8" fill="#1a1a1a" />
      <path fill="#E2761B" d="M27 8l-5.2 4.1 1 2.4L27 8zM5 8l5.1 4.2-1 2.3L5 8zm18.2 13.4l-1.6 2.6 4.3 1.2.1-3.7-2.8-.1zM8.9 21.5l.1 3.7 4.3-1.2-1.6-2.6-2.8.1z" />
      <path fill="#E2761B" d="M12.4 14.2l-1 3.7 4.1.2-.1-4.8-3 1zM19.6 14.2l-3-1-.1 4.9 4.1-.2-1-3.7z" />
      <path fill="#D7C1B3" d="M16.9 23.2l1.6-2.6-3.7-.2h-.6l-3.7.2 1.6 2.6 2.1-1 .5-.1.5.1 2.1 1z" />
      <path fill="#233447" d="M18.5 20.6l-1.6 2.6.5.4 3.7-1.2.1-3.7-2.7 1.9zM10.8 18.7l.1 3.7 3.7 1.2.5-.4-1.6-2.6-2.7-1.9z" />
      <path fill="#CD6116" d="M10.4 14.2l2.7 5.5 2.8-1.9.1-2.6-5.6-1zM21.6 14.2l-5.6 1 .1 2.6 2.8 1.9 2.7-5.5z" />
      <path fill="#E4751F" d="M10.4 14.2l-2.4 7.3 2.8.1 2.3-6.5-2.7-.9zM21.6 14.2l-2.7.9 2.3 6.5 2.8-.1-2.4-7.3zM18.5 20.6l-2.8-1.9h-.4l-2.8 1.9.4 2.2.5-.4.5-.4h2.2l.5.4.5.4.4-2.2z" />
      <path fill="#F5841F" d="M18.5 20.6l.4 2.2-1.6-.8v-1.1l1.2-.3zM13.2 20.9v1.1l-1.6.8.4-2.2 1.2.3z" />
      <path fill="#C0AD9E" d="M16.4 22.1l-.5.4-.5-.1v.8l.5.4h1.2l.5-.4v-.8l-.5.1-.7-.4z" />
      <path fill="#161616" d="M16.9 23.2l-.5-.4h-1.2l-.5.4.5.4h1.2l.5-.4z" />
      <path fill="#763D16" d="M27.2 13.1l-1.4-3.4-4.4 3.2 1.8 5.3.6-.3 3.1-2.6c.3-.3.3-.7.3-1.1v-.4c0-.3 0-.5 0-.7zM5 13.1c0 .2 0 .4 0 .7v.4c0 .4 0 .8.3 1.1l3.1 2.6.6.3 1.8-5.3-4.4-3.2L5 13.1z" />
    </>,
    className,
    style
  )

export const BraveIcon = ({ className, style }: IconProps) =>
  wrap(
    <>
      <rect width="32" height="32" rx="8" fill="#FB542B" />
      <path fill="#fff" d="M16 7l3.2 2.2 3.6-.6.8 3.2 2.4 1.4-1.2 2.4.8 3.4-3.2 1.2L16 26l-6.4-6.8-3.2-1.2.8-3.4L6 12.2l2.4-1.4.8-3.2 3.6.6L16 7z" />
      <path fill="#FB542B" d="M16 11.2c1.8 0 3.2.4 3.8 1.6.4.8.2 1.6-.4 2.2 1 .6 1.6 1.4 1.4 2.4-.2 1.4-1.8 2.2-4.8 2.6-3-.4-4.6-1.2-4.8-2.6-.2-1 .4-1.8 1.4-2.4-.6-.6-.8-1.4-.4-2.2.6-1.2 2-1.6 3.8-1.6z" />
    </>,
    className,
    style
  )

export const SolanaBadgeIcon = ({ className, style }: IconProps) =>
  wrap(
    <>
      <rect width="32" height="32" rx="8" fill="#1a1a1a" />
      <path fill="#9945FF" d="M9 19.5h12l-2.2 3.2H7l2-3.2z" />
      <path fill="#14F195" d="M9 14.6h12l-2.2 3.2H7l2-3.2z" />
      <path fill="#00D1FF" d="M9 9.7h12l-2.2 3.2H7l2-3.2z" />
    </>,
    className,
    style
  )

const ICONS: Record<string, (p: IconProps) => JSX.Element> = {
  google: GoogleGIcon,
  phantom: PhantomIcon,
  solflare: SolflareIcon,
  backpack: BackpackIcon,
  coinbase: CoinbaseIcon,
  magiceden: MagicEdenIcon,
  jupiter: JupiterIcon,
  trust: TrustIcon,
  ledger: LedgerIcon,
  trezor: TrezorIcon,
  ethereum: EthereumIcon,
  coin98: Coin98Icon,
  tiplink: TipLinkIcon,
  bitget: BitgetIcon,
  qr: QrWalletIcon,
  metamask: MetaMaskIcon,
  brave: BraveIcon,
  solana: SolanaBadgeIcon,
}

export function WalletBrandIcon({ name, className }: { name: string; className?: string }) {
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, '')
  const aliases: Record<string, string> = {
    sociallogin: 'google',
    googleviatiplink: 'tiplink',
    coinbasewallet: 'coinbase',
    ethereumwallet: 'ethereum',
    bitgetwallet: 'bitget',
    magiceden: 'magiceden',
    metamask: 'metamask',
    bravewallet: 'brave',
    phantom: 'phantom',
  }
  const Icon = ICONS[aliases[key] || key] || PhantomIcon
  return <Icon className={className} />
}
