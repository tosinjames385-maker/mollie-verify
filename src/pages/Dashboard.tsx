import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, TrendingUp, Clock } from 'lucide-react'
import { getTokens } from '../lib/api'
import { DashboardSkeleton } from '../components/Skeleton'
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

export const Dashboard = () => {
  const navigate = useNavigate()
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTokens()
  }, [])

  const loadTokens = async () => {
    try {
      const data = await getTokens()
      setTokens(data)
    } catch (error) {
      toast.error('Failed to load tokens')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === 'verified') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
          <Shield className="w-3 h-3 mr-1" />
          Verified
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
        Not Verified
      </span>
    )
  }

  const getActivityBadge = (activity: string) => {
    const colors = {
      high: 'bg-green-500/20 text-green-400',
      medium: 'bg-yellow-500/20 text-yellow-400',
      low: 'bg-red-500/20 text-red-400',
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          colors[activity as keyof typeof colors] || colors.low
        }`}
      >
        <TrendingUp className="w-3 h-3 mr-1" />
        {activity.charAt(0).toUpperCase() + activity.slice(1)} Activity
      </span>
    )
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Verified Token Dashboard
        </h1>
        <p className="text-gray-400">
          Browse and verify Solana tokens. Community-driven verification for
          better transparency.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-dark-200 rounded-lg border border-dark-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Tokens</p>
              <p className="text-2xl font-bold text-white">{tokens.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-dark-200 rounded-lg border border-dark-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Verified</p>
              <p className="text-2xl font-bold text-white">
                {tokens.filter((t) => t.verificationStatus === 'verified').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-dark-200 rounded-lg border border-dark-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Pending Review</p>
              <p className="text-2xl font-bold text-white">
                {tokens.filter((t) => t.verificationStatus === 'pending').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Token Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tokens.map((token) => (
          <button
            key={token.id}
            onClick={() => navigate(`/token/${token.mintAddress}`)}
            className="bg-dark-200 rounded-lg border border-dark-50 p-6 hover:border-primary/50 transition-all text-left group"
          >
            <div className="flex items-start space-x-4 mb-4">
              <div className="w-16 h-16 bg-dark-50 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                {token.imageUrl ? (
                  <img
                    src={token.imageUrl}
                    alt={token.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-primary">
                    {token.symbol[0]}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-white mb-1 group-hover:text-primary transition-colors truncate">
                  {token.symbol}
                </h3>
                <p className="text-sm text-gray-400 truncate">{token.name}</p>
                <p className="text-xs text-gray-500 mt-1 font-mono truncate">
                  {token.mintAddress.slice(0, 8)}...
                  {token.mintAddress.slice(-6)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {getStatusBadge(token.verificationStatus)}
              {getActivityBadge(token.organicActivity)}
            </div>

            {token.riskWarnings.length > 0 && (
              <div className="flex items-center space-x-2 text-xs text-yellow-400">
                <Shield className="w-3 h-3" />
                <span>{token.riskWarnings.length} Risk Warning(s)</span>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-dark-50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Community Likes</span>
                <span className="text-white font-medium">
                  {token._count.likes}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {tokens.length === 0 && !loading && (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-400 mb-2">
            No tokens found
          </h3>
          <p className="text-gray-500">Be the first to submit a token!</p>
        </div>
      )}
    </div>
  )
}
