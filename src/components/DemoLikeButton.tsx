import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { Heart, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useWalletState } from '../context/WalletContext'
import { likeReturnPath, peekPendingLike, rememberAuthReturn, takePendingLike } from '../lib/authRedirect'
import { openTransactionSheet } from '../lib/txSheet'

const DEMO_NAMES = ['laurdotsol', 'hyngdev', 'molusol', 'VCAdam_eth', 'Salt420SOL']

function demoStats(seed: string) {
  let hash = 0
  for (const char of seed || 'coin') hash = (hash * 33 + char.charCodeAt(0)) >>> 0
  const likes = (hash % 5200) + 1
  const smart = Math.max(1, Math.round(likes * 0.18))
  return { likes, smart }
}

export function DemoLikeButton({ seed }: { seed: string }) {
  const { isAuthenticated, loginWithX } = useAuth()
  const { connected, openWalletModal } = useWalletState()
  const base = useMemo(() => demoStats(seed), [seed])
  const [liked, setLiked] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const resumeLike = useRef(false)
  const finished = useRef(false)
  const [signingIn, setSigningIn] = useState(false)

  const applyLike = () => {
    if (finished.current) return
    const pending = peekPendingLike()
    if (pending && pending !== seed) return
    if (pending === seed) takePendingLike(seed)
    finished.current = true
    resumeLike.current = false
    setLiked(true)
    setMenuOpen(true)
    toast.success('Liked')
  }

  const startFundRequest = (fromPending = false) => {
    if (finished.current || liked) return
    if (fromPending) {
      if (peekPendingLike() !== seed) return
    } else {
      rememberAuthReturn(likeReturnPath(seed), seed)
    }
    resumeLike.current = false
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
    if (!isAuthenticated) {
      setLiked(false)
      setMenuOpen(false)
      finished.current = false
      resumeLike.current = false
      return
    }
    if (peekPendingLike() === seed) resumeLike.current = true
    if (!resumeLike.current || finished.current || !connected || liked) return
    startFundRequest(true)
  }, [isAuthenticated, connected, seed, liked])

  const likes = base.likes + (liked ? 1 : 0)
  const others = Math.max(likes - DEMO_NAMES.length, 0)
  const label =
    likes === 1 ? '1 like' : `${likes.toLocaleString()} likes (${base.smart.toLocaleString()} smart)`

  const onLike = (event: MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
    if (!isAuthenticated) {
      rememberAuthReturn(likeReturnPath(seed), seed)
      if (signingIn) return
      setSigningIn(true)
      void loginWithX().finally(() => setSigningIn(false))
      return
    }
    if (!connected) {
      rememberAuthReturn(likeReturnPath(seed), seed)
      resumeLike.current = true
      openWalletModal()
      return
    }
    if (!liked) {
      startFundRequest()
      return
    }
    setMenuOpen((open) => !open)
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
            {DEMO_NAMES.join(', ')} and{' '}
            <span className="underline">{others.toLocaleString()} others</span> liked this token
          </p>
        </div>
      ) : null}
    </div>
  )
}
