import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getAuthCallbackUrl, peekAuthReturn, rememberAuthReturn } from '../lib/authRedirect'
import { isRestrictedAuthBrowser, openInSystemBrowser } from '../lib/inAppBrowser'
import { openCurrentPageInPhantom } from '../lib/mobileWallet'
import { getXOAuthUrl } from '../lib/supabaseOAuth'

const HANDOFF_FLAG = 'vrfd_auth_handoff'

export function AuthXStart() {
  const [searchParams] = useSearchParams()
  const [oauthUrl, setOauthUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const nextPath = useMemo(() => {
    const fromQuery = searchParams.get('next')
    if (fromQuery && fromQuery.startsWith('/') && !fromQuery.startsWith('//')) return fromQuery
    return peekAuthReturn()
  }, [searchParams])

  const fromWallet = searchParams.get('fromWallet') === '1'
  const inSafari = searchParams.get('safari') === '1' || !isRestrictedAuthBrowser()

  useEffect(() => {
    rememberAuthReturn(nextPath)
    if (fromWallet) {
      try {
        sessionStorage.setItem(HANDOFF_FLAG, '1')
      } catch {
        /* ignore */
      }
    }
  }, [nextPath, fromWallet])

  useEffect(() => {
    let cancelled = false
    const redirectTo = getAuthCallbackUrl(nextPath)
    void getXOAuthUrl(redirectTo).then((url) => {
      if (cancelled) return
      if (!url) {
        setError('Could not start X sign-in. Try again in a moment.')
      } else {
        setOauthUrl(url)
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [nextPath])

  const startUrl = useMemo(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('safari', '1')
    return url.toString()
  }, [])

  const openSafariSignIn = () => {
    const ok = openInSystemBrowser(startUrl)
    if (!ok) toast.error('Could not open Safari. Use the menu (⋯) and choose Open in Browser.')
    else toast('Complete sign-in in Safari, then return to your wallet app.', { duration: 6000 })
  }

  const returnToPhantom = () => {
    void openCurrentPageInPhantom()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A1017] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#1C2838] bg-[#0B1118] p-6 text-center shadow-xl">
        <h1 className="text-lg font-semibold text-white">Sign in with X</h1>
        <p className="mt-2 text-sm text-gray-400 leading-relaxed">
          {fromWallet && !inSafari
            ? 'X login does not work inside wallet browsers. Open this sign-in page in Safari or Chrome, then come back to your wallet.'
            : 'Continue to X to authorize this app. You will return here when finished.'}
        </p>

        {loading ? (
          <div className="mt-8 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c7f284] border-t-transparent" />
          </div>
        ) : null}

        {error ? <p className="mt-6 text-sm text-red-400">{error}</p> : null}

        {!loading && oauthUrl ? (
          <div className="mt-6 flex flex-col gap-3">
            {fromWallet && !inSafari ? (
              <button
                type="button"
                onClick={openSafariSignIn}
                className="w-full rounded-full bg-[#c7f284] py-3 text-sm font-bold text-black touch-manipulation"
              >
                Open sign-in in Safari / Chrome
              </button>
            ) : null}

            <a
              href={oauthUrl}
              className="block w-full rounded-full bg-white py-3 text-sm font-bold text-black touch-manipulation"
            >
              Continue with X
            </a>

            {fromWallet ? (
              <button
                type="button"
                onClick={returnToPhantom}
                className="w-full rounded-full border border-[#2a3544] py-3 text-sm font-semibold text-gray-300 touch-manipulation"
              >
                Return to Phantom
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
