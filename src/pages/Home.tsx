import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, TrendingUp, Clock, ChevronRight } from 'lucide-react'
import { getTokens } from '../lib/api'
import toast from 'react-hot-toast'

interface Token {
  id: string
  name: string
  symbol: string
  mintAddress: string
  imageUrl?: string
  verificationStatus: string
  organicActivity: string
  _count: {
    likes: number
  }
  riskWarnings: any[]
}

export const Home = () => {
  const navigate = useNavigate()
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTokens()
  }, [])

  const loadTokens = async () => {
    try {
      const data = await getTokens()
      setTokens(data.slice(0, 6))
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === 'verified') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#B7F34A]/20 text-[#B7F34A]">
          <Shield className="w-2.5 h-2.5 mr-1" />
          Verified
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-800 text-gray-400">
        Unverified
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-[#070A0F]">
      {/* Hero Section */}
      <div className="relative pt-16 pb-16 px-4 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-b from-[#00D2B8]/10 via-[#00A89A]/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-[#B7F34A]/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#00D2B8]/5 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            Build on{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D2B8] to-[#B7F34A]">
              VRFD
            </span>{' '}
            token data.
          </h1>
          <p className="text-base md:text-lg text-gray-400 mb-6 max-w-2xl mx-auto">
            The APIs trusted across wallets, dexes, and apps. Also available in agent skills and CLI.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate('/submissions')}
              className="bg-[#B7F34A] hover:bg-[#a3e635] text-black font-semibold px-6 py-3 rounded-full text-sm transition-colors"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate('/apis')}
              className="bg-[#0F151E] hover:bg-[#1A2332] border border-[#1A2332] text-white font-semibold px-6 py-3 rounded-full text-sm transition-colors"
            >
              View APIs
            </button>
          </div>
        </div>
      </div>

      {/* Featured Tokens Section */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Recently Verified</h2>
            <p className="text-gray-400 text-sm">Latest tokens verified by the community</p>
          </div>
          <button
            onClick={() => navigate('/submissions')}
            className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#0A1017] border border-[#1C2838] rounded-xl p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#1C2838] rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-[#1C2838] rounded w-20 mb-2" />
                    <div className="h-3 bg-[#1C2838] rounded w-32" />
                  </div>
                </div>
                <div className="h-8 bg-[#1C2838] rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tokens.map((token) => (
              <button
                key={token.id}
                onClick={() => navigate(`/token/${token.mintAddress}`)}
                className="bg-[#0A1017] border border-[#1C2838] rounded-xl p-5 hover:border-[#B7F34A]/30 transition-all text-left group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#1C2838] rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    {token.imageUrl ? (
                      <img
                        src={token.imageUrl}
                        alt={token.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold text-[#B7F34A]">
                        {token.symbol[0]}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white group-hover:text-[#B7F34A] transition-colors truncate">
                        {token.symbol}
                      </h3>
                      {getStatusBadge(token.verificationStatus)}
                    </div>
                    <p className="text-sm text-gray-400 truncate">{token.name}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {token._count.likes} likes
                  </span>
                  {token.riskWarnings.length > 0 && (
                    <span className="text-yellow-400 text-xs">
                      {token.riskWarnings.length} warnings
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading && tokens.length === 0 && (
          <div className="text-center py-16 bg-[#0A1017] border border-[#1C2838] rounded-xl">
            <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No tokens yet</h3>
            <p className="text-gray-500 text-sm">Be the first to verify a token</p>
          </div>
        )}
      </div>
    </div>
  )
}