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
  const [status, setStatus] = useState('Preparing X sign-in…')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const nextPath = useMemo(() => {
    const fromQuery = searchParams.get('next')
    if (fromQuery && fromQuery.startsWith('/') && !fromQuery.startsWith('//')) return fromQuery
    return peekAuthReturn()
  }, [searchParams])

  const fromWallet = searchParams.get('fromWallet') === '1'
  const autoStart = searchParams.get('auto') === '1'
  const restricted = isRestrictedAuthBrowser()
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

  const startOAuth = async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    setStatus('Opening X…')
    try {
      const url = await getXOAuthUrl(getAuthCallbackUrl(nextPath))
      if (!url) {
        setError('Could not start X sign-in. Please try again.')
        setBusy(false)
        return
      }
      window.location.assign(url)
    } catch {
      setError('Could not start X sign-in. Please try again.')
      setBusy(false)
    }
  }

  // On normal Safari/Chrome (and auto retry), go straight to X — one less tap.
  useEffect(() => {
    if (!canStartOAuth) return
    if (autoStart || !fromWallet) {
      void startOAuth()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canStartOAuth, autoStart, fromWallet, nextPath])

  const startUrl = useMemo(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('safari', '1')
    url.searchParams.set('fromWallet', fromWallet || restricted ? '1' : '0')
    url.searchParams.set('auto', '1')
    return url.toString()
  }, [fromWallet, restricted])

  const openSafariSignIn = () => {
    const ok = openInSystemBrowser(startUrl)
    if (!ok) toast.error('Could not open Safari. Use the menu (⋯) and choose Open in Browser.')
    else toast('Finish sign-in in Safari, then return to your wallet.', { duration: 5000 })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A1017] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#1C2838] bg-[#0B1118] p-6 text-center shadow-xl">
        <h1 className="text-lg font-semibold text-white">Sign in with X</h1>
        <p className="mt-2 text-sm text-gray-400 leading-relaxed">
          {!canStartOAuth
            ? 'Open Safari or Chrome to sign in with X. It only takes a moment, then you can return to your wallet.'
            : status}
        </p>

        {canStartOAuth && busy && !error ? (
          <div className="mt-8 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c7f284] border-t-transparent" />
          </div>
        ) : null}

        {error ? <p className="mt-6 text-sm text-red-400">{error}</p> : null}

        <div className="mt-6 flex flex-col gap-3">
          {!canStartOAuth ? (
            <>
              <button
                type="button"
                onClick={openSafariSignIn}
                className="w-full rounded-full bg-[#c7f284] py-3 text-sm font-bold text-black touch-manipulation"
              >
                Continue in Safari / Chrome
              </button>
              <button
                type="button"
                onClick={() => void openCurrentPageInPhantom()}
                className="w-full rounded-full border border-[#2a3544] py-3 text-sm font-semibold text-gray-300 touch-manipulation"
              >
                Back to wallet
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void startOAuth()}
                disabled={busy && !error}
                className="w-full rounded-full bg-white py-3 text-sm font-bold text-black touch-manipulation disabled:opacity-60"
              >
                {busy && !error ? 'Opening X…' : 'Continue with X'}
              </button>
              {fromWallet ? (
                <button
                  type="button"
                  onClick={() => void openCurrentPageInPhantom()}
                  className="w-full rounded-full border border-[#2a3544] py-3 text-sm font-semibold text-gray-300 touch-manipulation"
                >
                  Back to wallet
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
