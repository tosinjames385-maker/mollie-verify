import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { applyAuthHandoffCode } from '../lib/supabaseOAuth'

/** Restores Supabase session in wallet browsers after Safari X sign-in. */
export function AuthHandoffBootstrap() {
  const location = useLocation()
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const handled = useRef<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const code = params.get('vrfd_handoff')
    if (!code || handled.current === code) return
    handled.current = code

    void (async () => {
      const ok = await applyAuthHandoffCode(code)
      params.delete('vrfd_handoff')
      const next = `${location.pathname}${params.toString() ? `?${params}` : ''}${location.hash}`
      navigate(next, { replace: true })
      if (ok) {
        await refreshUser()
        toast.success('Signed in with X')
      } else {
        toast.error('Sign-in link expired. Please try again.')
      }
    })()
  }, [location.pathname, location.search, location.hash, navigate, refreshUser])

  return null
}
