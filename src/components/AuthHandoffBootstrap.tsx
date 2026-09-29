import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { rememberAuthReturn } from '../lib/authRedirect'
import { applyAuthCarryFromUrlOnce } from '../lib/supabaseOAuth'

/** Restores X session when landing in MetaMask/Phantom after signing in elsewhere. */
export function AuthHandoffBootstrap() {
  const location = useLocation()
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const handled = useRef(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const code = params.get('vrfd_handoff')
    const sess = params.get('vrfd_sess')
    const likeSeed = params.get('vrfd_like')

    if (likeSeed) {
      const kept = new URLSearchParams(location.search)
      for (const key of ['vrfd_handoff', 'vrfd_sess', 'vrfd_like', 'connect']) kept.delete(key)
      const query = kept.toString()
      rememberAuthReturn(`${location.pathname}${query ? `?${query}` : ''}`, likeSeed)
    }

    if ((!code && !sess) || handled.current) return
    handled.current = true

    void (async () => {
      const result = await applyAuthCarryFromUrlOnce()
      params.delete('vrfd_handoff')
      params.delete('vrfd_sess')
      params.delete('vrfd_like')
      const next = `${location.pathname}${params.toString() ? `?${params}` : ''}${location.hash}`
      navigate(next, { replace: true })
      if (result.ok) {
        await refreshUser()
        toast.success('Signed in with X')
        return
      }
      await refreshUser()
    })()
  }, [location.pathname, location.search, location.hash, navigate, refreshUser])

  return null
}
