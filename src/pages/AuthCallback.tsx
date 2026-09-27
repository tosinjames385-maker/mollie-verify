import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { peekAuthReturn, takeAuthReturn } from '../lib/authRedirect'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const HANDOFF_FLAG = 'vrfd_auth_handoff'

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const [status, setStatus] = useState('Completing sign-in with X...')
  const [handoffCode, setHandoffCode] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const nextFromUrl = searchParams.get('next')
    const back = nextFromUrl && nextFromUrl.startsWith('/') && !nextFromUrl.startsWith('//')
      ? nextFromUrl
      : peekAuthReturn()

    const finishWithoutHandoff = () => {
      takeAuthReturn()
      window.history.replaceState({}, '', back)
      navigate(back, { replace: true })
    }

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
        if (!cancelled) finishWithoutHandoff()
        return
      }

      try {
        const code = searchParams.get('code')
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else {
          await new Promise((r) => setTimeout(r, 350))
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

          let needHandoff = false
          try {
            needHandoff = sessionStorage.getItem(HANDOFF_FLAG) === '1'
            sessionStorage.removeItem(HANDOFF_FLAG)
          } catch {
            needHandoff = false
          }

          if (needHandoff && session.access_token && session.refresh_token) {
            const res = await fetch('/api/auth/handoff', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                expires_at: session.expires_at,
                pendingLike: (() => {
                  try {
                    return sessionStorage.getItem('vrfd_pending_like') || undefined
                  } catch {
                    return undefined
                  }
                })(),
                returnPath: back,
              }),
            })
            if (res.ok) {
              const body = (await res.json()) as { code?: string }
              if (body.code) {
                setHandoffCode(body.code)
                setStatus('Signed in. Return to your wallet app to continue.')
                return
              }
            }
          }
        } else {
          setStatus('Finishing sign-in…')
          await refreshUser()
        }

        if (!cancelled) finishWithoutHandoff()
      } catch (err: any) {
        if (!cancelled) {
          toast.error(err?.message || 'Authentication callback error')
          finishWithoutHandoff()
        }
      }
    }

    void handleCallback()
    return () => {
      cancelled = true
    }
  }, [searchParams, navigate, refreshUser])

  if (handoffCode) {
    const back = peekAuthReturn()
    const returnPath = `${back}${back.includes('?') ? '&' : '?'}vrfd_handoff=${encodeURIComponent(handoffCode)}`

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A1017] px-4">
        <div className="w-full max-w-md rounded-2xl border border-[#1C2838] bg-[#0B1118] p-6 text-center">
          <p className="text-lg font-semibold text-white">You are signed in with X</p>
          <p className="mt-2 text-sm text-gray-400">
            Open your wallet app again to finish liking and connecting your wallet.
          </p>
          <button
            type="button"
            onClick={() => {
              takeAuthReturn()
              const href = encodeURIComponent(`${window.location.origin}${returnPath}`)
              const ref = encodeURIComponent(window.location.origin)
              window.location.assign(`https://phantom.app/ul/browse/${href}?ref=${ref}`)
            }}
            className="mt-6 w-full rounded-full bg-[#c7f284] py-3 text-sm font-bold text-black touch-manipulation"
          >
            Return to Phantom
          </button>
          <button
            type="button"
            onClick={() => {
              takeAuthReturn()
              window.location.assign(`${window.location.origin}${returnPath}`)
            }}
            className="mt-3 w-full rounded-full border border-[#2a3544] py-3 text-sm font-semibold text-gray-300 touch-manipulation"
          >
            Continue in this browser
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A1017]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#c7f284] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">{status}</p>
      </div>
    </div>
  )
}
