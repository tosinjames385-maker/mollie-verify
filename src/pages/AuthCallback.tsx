import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  peekAuthReturn,
  peekReturnWallet,
  rememberReturnWallet,
  returnWalletFromPath,
  takeAuthReturn,
  takeReturnWallet,
} from '../lib/authRedirect'
import { isRestrictedAuthBrowser } from '../lib/inAppBrowser'
import { attachAuthCarry, prepareWalletAuthCarry, restorePkceVerifierFromServer } from '../lib/supabaseOAuth'
import { openPageInMetaMask, openPageInPhantom, phantomBrowseUrl } from '../lib/mobileWallet'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const HANDOFF_FLAG = 'vrfd_auth_handoff'
const exchangedCodes = new Set<string>()

function isRecoverableAuthError(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('pkce') ||
    m.includes('code verifier') ||
    m.includes('flow state') ||
    m.includes('flow_state') ||
    m.includes('invalid flow')
  )
}

async function waitForSession(tries = 12): Promise<boolean> {
  for (let i = 0; i < tries; i++) {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.user) return true
    await new Promise((r) => setTimeout(r, 120))
  }
  return false
}

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const [status, setStatus] = useState('Completing sign-in with X...')
  const [handoffTarget, setHandoffTarget] = useState<string | null>(null)
  const [returnWalletName, setReturnWalletName] = useState<string | null>(null)

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
        const pkceId = searchParams.get('vrfd_pkce')
        const flowId = searchParams.get('sb_flow_id')

        if (code) {
          if (exchangedCodes.has(code)) {
            const ready = await waitForSession()
            if (!ready) throw new Error('Sign-in is still finishing. Please try again.')
          } else {
            exchangedCodes.add(code)
            await restorePkceVerifierFromServer(pkceId, flowId)
            let { error } = await supabase.auth.exchangeCodeForSession(code)

            if (error && isRecoverableAuthError(error.message || '')) {
              // Code may already be consumed, or PKCE needed another restore.
              const alreadySignedIn = await waitForSession(6)
              if (!alreadySignedIn) {
                await restorePkceVerifierFromServer(pkceId, flowId)
                ;({ error } = await supabase.auth.exchangeCodeForSession(code))
              } else {
                error = null
              }
            }

            if (error) {
              const alreadySignedIn = await waitForSession(4)
              if (!alreadySignedIn) throw error
            }
          }
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
          try {
            sessionStorage.removeItem('vrfd_pkce_auto_retry')
          } catch {
            /* ignore */
          }
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

          const returnWallet =
            (searchParams.get('vrfd_return_wallet') === 'phantom' ||
            searchParams.get('vrfd_return_wallet') === 'metamask'
              ? searchParams.get('vrfd_return_wallet')
              : null) ||
            returnWalletFromPath(back) ||
            peekReturnWallet()

          if (returnWallet) rememberReturnWallet(returnWallet)

          if (!needHandoff && (returnWallet || isRestrictedAuthBrowser())) {
            needHandoff = Boolean(returnWallet || searchParams.get('next') || peekAuthReturn())
          }

          // X OAuth always finishes in Safari. If they started in Phantom/MetaMask,
          // send them back into that wallet browser instead of staying here.
          if (returnWallet === 'phantom' || returnWallet === 'metamask') {
            const ready = await prepareWalletAuthCarry()
            const dest = new URL(`${window.location.origin}${back}`)
            dest.searchParams.set('connect', returnWallet)
            dest.searchParams.delete('vrfd_return_wallet')
            const carried = attachAuthCarry(dest.toString(), { code: ready.code })
            takeReturnWallet()
            takeAuthReturn()
            setReturnWalletName(returnWallet === 'phantom' ? 'Phantom' : 'MetaMask')
            setHandoffTarget(carried)
            setStatus(`Signed in. Opening ${returnWallet === 'phantom' ? 'Phantom' : 'MetaMask'}…`)
            if (returnWallet === 'phantom') openPageInPhantom(carried)
            else openPageInMetaMask(carried)
            return
          }

          if (needHandoff && session.access_token && session.refresh_token) {
            const ready = await prepareWalletAuthCarry()
            const dest = new URL(`${window.location.origin}${back}`)
            const carried = attachAuthCarry(dest.toString(), { code: ready.code })
            if (ready.code || ready.sess) {
              setHandoffTarget(carried)
              setStatus('Signed in. Return to your wallet app to continue.')
              return
            }
          } else {
            void prepareWalletAuthCarry()
          }
        } else {
          setStatus('Finishing sign-in…')
          await refreshUser()
        }

        if (!cancelled) finishWithoutHandoff()
      } catch (err: any) {
        if (cancelled) return
        const message = err?.message || 'Authentication callback error'
        if (isRecoverableAuthError(message)) {
          const alreadySignedIn = await waitForSession(4)
          if (alreadySignedIn) {
            await refreshUser()
            if (!cancelled) finishWithoutHandoff()
            return
          }

          let alreadyRetried = false
          try {
            alreadyRetried = sessionStorage.getItem('vrfd_pkce_auto_retry') === '1'
          } catch {
            alreadyRetried = false
          }

          if (!alreadyRetried) {
            try {
              sessionStorage.setItem('vrfd_pkce_auto_retry', '1')
            } catch {
              /* ignore */
            }
            setStatus('Restarting sign-in…')
            window.location.replace(`/auth/x/start?next=${encodeURIComponent(back)}`)
            return
          }

          setStatus('Opening X…')
          window.location.replace(`/auth/x/start?next=${encodeURIComponent(back)}`)
          return
        }
        toast.error(message)
        finishWithoutHandoff()
      }
    }

    void handleCallback()
    return () => {
      cancelled = true
    }
  }, [searchParams, navigate, refreshUser])

  if (handoffTarget) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A1017] px-4">
        <div className="w-full max-w-md rounded-2xl border border-[#1C2838] bg-[#0B1118] p-6 text-center">
          <p className="text-lg font-semibold text-white">You are signed in with X</p>
          <p className="mt-2 text-sm text-gray-400">
            {returnWalletName
              ? `Opening ${returnWalletName} with your X session…`
              : 'Return to your wallet app. Your X sign-in will come with you.'}
          </p>
          <a
            href={phantomBrowseUrl(handoffTarget)}
            onClick={() => takeAuthReturn()}
            className="mt-6 flex w-full items-center justify-center rounded-full bg-[#c7f284] py-3 text-sm font-bold text-black touch-manipulation"
          >
            Back to Phantom
          </a>
          <button
            type="button"
            onClick={() => {
              takeAuthReturn()
              openPageInMetaMask(handoffTarget)
            }}
            className="mt-3 w-full rounded-full border border-[#2a3544] py-3 text-sm font-semibold text-gray-300 touch-manipulation"
          >
            Open MetaMask
          </button>
          <button
            type="button"
            onClick={() => {
              takeAuthReturn()
              window.location.assign(handoffTarget)
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
