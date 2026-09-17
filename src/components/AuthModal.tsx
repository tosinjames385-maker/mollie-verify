import React from 'react'
import { useAuth } from '../context/AuthContext'
import { X } from 'lucide-react'

export const AuthModal: React.FC = () => {
  const { isModalOpen, closeAuthModal, loginWithX } = useAuth()
  const [isAuthorizing, setIsAuthorizing] = React.useState(false)

  if (!isModalOpen) return null

  const handleAuthorize = async () => {
    setIsAuthorizing(true)
    try {
      await loginWithX()
    } finally {
      setIsAuthorizing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#F7F9F9] rounded-2xl shadow-2xl overflow-hidden text-gray-900 border border-gray-200 font-sans">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800 text-sm">Sign in with X</span>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#c7f284] flex items-center justify-center shadow-sm">
              <svg className="w-8 h-8 text-black" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <div className="text-gray-400 font-medium text-2xl">⇄</div>
            <div className="w-14 h-14 rounded-xl bg-black flex items-center justify-center text-white shadow-md">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
              </svg>
            </div>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-gray-900">
              Continue with X
            </h2>
            <p className="text-sm text-gray-500">
              Sign in to Solverify using your X account. You'll be redirected to X to authorize the app.
            </p>
          </div>

          <button
            onClick={handleAuthorize}
            disabled={isAuthorizing}
            className="w-full px-6 py-3 bg-black hover:bg-gray-900 text-white font-bold rounded-full text-sm transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAuthorizing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Connecting to X...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                </svg>
                Continue with X
              </>
            )}
          </button>

          <button
            onClick={closeAuthModal}
            className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-full text-sm transition-colors"
          >
            Cancel
          </button>

          <div className="text-[11px] text-gray-400 text-center leading-relaxed">
            By continuing, you agree to X's{' '}
            <a href="https://twitter.com/en/tos" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Terms of Service</a> and{' '}
            <a href="https://twitter.com/en/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Privacy Policy</a>.
          </div>
        </div>
      </div>
    </div>
  )
}
