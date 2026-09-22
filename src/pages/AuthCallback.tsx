import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const [status, setStatus] = useState('Completing sign-in with X...')

  useEffect(() => {
    let cancelled = false

    const handleCallback = async () => {
      const queryError = searchParams.get('error')
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const hashError = hashParams.get('error')
      const errorParam = queryError || hashError
      const errorDescParam =
        searchParams.get('error_description') ||
        searchParams.get('description') ||
        hashParams.get('error_description')

      if (errorParam) {
        if (errorParam === 'access_denied') {
          toast.error('X sign-in was cancelled.')
        } else {
          toast.error(errorDescParam || 'Authentication failed. Please try again.')
        }
        navigate('/submissions', { replace: true })
        return
      }

      try {
        const code = searchParams.get('code')
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else {
          // Implicit / hash tokens (#access_token=...) — give the client a moment to parse.
          await new Promise((r) => setTimeout(r, 80))
        }

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()
        if (error) throw error

        if (cancelled) return

        if (session?.user) {
          await refreshUser()
          const meta = session.user.user_metadata || {}
          const name = meta.user_name || meta.preferred_username || meta.name || 'user'
          toast.success(`Welcome, @${name}!`)
        } else {
          setStatus('Finishing sign-in…')
          await refreshUser()
        }
      } catch (err: any) {
        if (!cancelled) toast.error(err?.message || 'Authentication callback error')
      } finally {
        if (!cancelled) {
          window.history.replaceState({}, '', '/submissions')
          navigate('/submissions', { replace: true })
        }
      }
    }

    handleCallback()
    return () => {
      cancelled = true
    }
  }, [searchParams, navigate, refreshUser])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A1017]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#c7f284] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">{status}</p>
      </div>
    </div>
  )
}
