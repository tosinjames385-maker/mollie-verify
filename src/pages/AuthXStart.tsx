import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAuthCallbackUrl, peekAuthReturn, rememberAuthReturn, rememberReturnWallet } from '../lib/authRedirect'
import { getXOAuthUrl } from '../lib/supabaseOAuth'

/** Silent hop to X authorize — same path as verified.jup.ag. */
export function AuthXStart() {
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  const nextPath = useMemo(() => {
    const fromQuery = searchParams.get('next')
    if (fromQuery && fromQuery.startsWith('/') && !fromQuery.startsWith('//')) return fromQuery
    return peekAuthReturn()
  }, [searchParams])

  const returnWallet = searchParams.get('vrfd_return_wallet')

  useEffect(() => {
    rememberAuthReturn(nextPath)
    if (returnWallet) rememberReturnWallet(returnWallet)
  }, [nextPath, returnWallet])

  useEffect(() => {
    if (started.current) return
    started.current = true

    void (async () => {
      const url = await getXOAuthUrl(getAuthCallbackUrl(nextPath, returnWallet))
      if (!url) {
        setError('Could not start X sign-in. Please try again.')
        started.current = false
        return
      }
      window.location.assign(url)
    })()
  }, [nextPath, returnWallet])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A1017] px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c7f284] border-t-transparent" />
        <p className="text-sm text-gray-400">{error || 'Opening X…'}</p>
        {error ? (
          <button
            type="button"
            onClick={() => {
              started.current = false
              setError(null)
              window.location.reload()
            }}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black"
          >
            Try again
          </button>
        ) : null}
      </div>
    </div>
  )
}
