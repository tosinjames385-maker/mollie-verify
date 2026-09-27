import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { rememberAuthReturn } from '../lib/authRedirect'
import { applyAuthHandoffCode } from '../lib/supabaseOAuth'

/** Restores X session when landing in MetaMask/Phantom after signing in elsewhere. */
export function AuthHandoffBootstrap() {
  const location = useLocation()
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const handled = useRef<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const code = params.get('vrfd_handoff')
    const likeSeed = params.get('vrfd_like')

    if (likeSeed) {
      rememberAuthReturn(location.pathname, likeSeed)
    }

    if (!code || handled.current === code) return
    handled.current = code

    void (async () => {
      const result = await applyAuthHandoffCode(code)
      params.delete('vrfd_handoff')
      params.delete('vrfd_like')
      const next = `${location.pathname}${params.toString() ? `?${params}` : ''}${location.hash}`
      navigate(next, { replace: true })
      if (result.ok) {
        await refreshUser()
        toast.success('Signed in with X')
      } else {
        toast.error('Could not restore your X sign-in. Please sign in again.')
      }
    })()
  }, [location.pathname, location.search, location.hash, navigate, refreshUser])

  return null
}
