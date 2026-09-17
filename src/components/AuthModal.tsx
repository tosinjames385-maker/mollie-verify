import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { X, Check } from 'lucide-react'

export const AuthModal: React.FC = () => {
  const { isModalOpen, closeAuthModal, loginWithX } = useAuth()
  const [handle, setHandle] = useState('danielolam74317')
  const [isAuthorizing, setIsAuthorizing] = useState(false)

  if (!isModalOpen) return null

  const handleAuthorize = () => {
    setIsAuthorizing(true)
    setTimeout(() => {
      loginWithX(handle.replace('@', ''))
      setIsAuthorizing(false)
    }, 1000)
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      {/* Container simulating X OAuth Popup modal */}
      <div className="relative w-full max-w-2xl bg-[#F7F9F9] rounded-2xl shadow-2xl overflow-hidden text-gray-900 border border-gray-200 font-sans">
        
        {/* Header bar */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800 text-sm">OAuth 2.0 Authorization</span>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body matching screenshot */}
        <div className="p-8">
          <div className="flex flex-col md:flex-row gap-8 items-stretch">
            
            {/* Left Panel */}
            <div className="flex-1 space-y-6">
              {/* App logo connection diagram */}
              <div className="flex items-center gap-3">
                {/* Jupiter VRFD Logo */}
                <div className="w-12 h-12 rounded-full bg-[#00D2B8] flex items-center justify-center p-2 shadow-sm">
                  <svg className="w-full h-full text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                  </svg>
                </div>

                <div className="text-gray-400 font-medium text-lg">⇄</div>

                {/* X Logo */}
                <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center text-white">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                  </svg>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 leading-tight">
                  Jupiter Exchange wants to access permissions on your account
                </h2>
              </div>

              {/* Editable user pill */}
              <div className="inline-flex items-center gap-2 bg-gray-200/80 px-3 py-1.5 rounded-full text-sm font-medium text-gray-800">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="bg-transparent font-medium outline-none text-gray-800 w-44"
                  placeholder="@handle"
                />
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                By authorizing this app you agree to X's{' '}
                <a href="#" className="text-blue-500 underline">Terms of Service</a> and{' '}
                <a href="#" className="text-blue-500 underline">Privacy Policy</a>.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={closeAuthModal}
                  className="flex-1 px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-full text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAuthorize}
                  disabled={isAuthorizing}
                  className="flex-1 px-5 py-2.5 bg-black hover:bg-gray-900 text-white font-bold rounded-full text-sm transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  {isAuthorizing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Authorizing...
                    </>
                  ) : (
                    'Authorize app'
                  )}
                </button>
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="hidden md:block w-px bg-gray-200 my-2" />

            {/* Right Panel - Permissions */}
            <div className="flex-1 space-y-4">
              <h3 className="font-bold text-gray-900 text-base">Jupiter Exchange</h3>
              <p className="text-xs font-semibold text-gray-500">This app will be able to:</p>

              <div className="space-y-3.5 text-xs text-gray-700">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </div>
                  <span>Stay connected to your account until you revoke access.</span>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <span>All the posts you can view, including posts from protected accounts.</span>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <span>Your email address.</span>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <span>Any account you can view, including protected accounts.</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 text-[11px] text-gray-400">
                Made by Jupiter App. Read Jupiter App's <a href="#" className="text-blue-500">privacy policy</a> and <a href="#" className="text-blue-500">terms</a>.
              </div>
            </div>

          </div>
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-2.5 bg-gray-100 border-t border-gray-200 text-center text-xs text-gray-500">
          Learn more about 3rd party app access in the <a href="#" className="text-blue-500 underline">help center</a>.
        </div>
      </div>
    </div>
  )
}
