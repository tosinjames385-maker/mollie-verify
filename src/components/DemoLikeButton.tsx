import { useMemo, useState, type MouseEvent } from 'react'
import { Heart, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useWalletState } from '../context/WalletContext'
import { likeReturnPath, rememberAuthReturn } from '../lib/authRedirect'

const DEMO_NAMES = ['laurdotsol', 'hyngdev', 'molusol', 'VCAdam_eth', 'Salt420SOL']

function demoStats(seed: string) {
  let hash = 0
  for (const char of seed || 'coin') hash = (hash * 33 + char.charCodeAt(0)) >>> 0
  const likes = (hash % 5200) + 1
  const smart = Math.max(1, Math.round(likes * 0.18))
  return { likes, smart }
}

export function DemoLikeButton({ seed }: { seed: string }) {
  const { isAuthenticated, openAuthModal } = useAuth()
  const { connected, openWalletModal } = useWalletState()
  const base = useMemo(() => demoStats(seed), [seed])
  const [liked, setLiked] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const likes = base.likes + (liked ? 1 : 0)
  const others = Math.max(likes - DEMO_NAMES.length, 0)
  const label =
    likes === 1 ? '1 like' : `${likes.toLocaleString()} likes (${base.smart.toLocaleString()} smart)`

  const onLike = (event: MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
    if (!isAuthenticated) {
      rememberAuthReturn(likeReturnPath(seed), seed)
      openAuthModal()
      return
    }
    if (!connected) {
      openWalletModal()
      return
    }
    if (!liked) {
      setLiked(true)
      setMenuOpen(true)
      toast.success('Liked')
      return
    }
    setMenuOpen((open) => !open)
  }

  return (
    <div className="relative inline-flex" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={onLike}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold ${
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
