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
  const restricted = isRestrictedAuthBrowser()
  // Only start OAuth in a real browser. Wallet WebViews break PKCE when X returns elsewhere.
  const canStartOAuth = searchParams.get('safari') === '1' || !restricted

  useEffect(() => {
    rememberAuthReturn(nextPath)
    if (fromWallet && canStartOAuth) {
      try {
        sessionStorage.setItem(HANDOFF_FLAG, '1')
      } catch {
        /* ignore */
      }
    }
  }, [nextPath, fromWallet, canStartOAuth])

  useEffect(() => {
    if (!canStartOAuth) {
      setLoading(false)
      setOauthUrl(null)
      return
    }

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
  }, [nextPath, canStartOAuth])

  const startUrl = useMemo(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('safari', '1')
    url.searchParams.set('fromWallet', fromWallet || restricted ? '1' : '0')
    return url.toString()
  }, [fromWallet, restricted])

  const openSafariSignIn = () => {
    const ok = openInSystemBrowser(startUrl)
    if (!ok) toast.error('Could not open Safari. Use the menu (⋯) and choose Open in Browser.')
    else toast('Complete sign-in in Safari, then return to your wallet app.', { duration: 6000 })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A1017] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#1C2838] bg-[#0B1118] p-6 text-center shadow-xl">
        <h1 className="text-lg font-semibold text-white">Sign in with X</h1>
        <p className="mt-2 text-sm text-gray-400 leading-relaxed">
          {!canStartOAuth
            ? 'X login cannot finish inside a wallet browser. Open this page in Safari or Chrome to sign in, then return here.'
            : 'Continue to X to authorize this app. You will return here when finished.'}
        </p>

        {loading ? (
          <div className="mt-8 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c7f284] border-t-transparent" />
          </div>
        ) : null}

        {error ? <p className="mt-6 text-sm text-red-400">{error}</p> : null}

        {!loading ? (
          <div className="mt-6 flex flex-col gap-3">
            {!canStartOAuth ? (
              <>
                <button
                  type="button"
                  onClick={openSafariSignIn}
                  className="w-full rounded-full bg-[#c7f284] py-3 text-sm font-bold text-black touch-manipulation"
                >
                  Open sign-in in Safari / Chrome
                </button>
                <button
                  type="button"
                  onClick={() => void openCurrentPageInPhantom()}
                  className="w-full rounded-full border border-[#2a3544] py-3 text-sm font-semibold text-gray-300 touch-manipulation"
                >
                  Return to Phantom
                </button>
              </>
            ) : null}

            {canStartOAuth && oauthUrl ? (
              <a
                href={oauthUrl}
                className="block w-full rounded-full bg-white py-3 text-sm font-bold text-black touch-manipulation"
              >
                Continue with X
              </a>
            ) : null}

            {canStartOAuth && fromWallet ? (
              <button
                type="button"
                onClick={() => void openCurrentPageInPhantom()}
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
