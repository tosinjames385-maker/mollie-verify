import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Share2, Link as LinkIcon, CheckCircle, Star } from 'lucide-react'
import { getUserByUsername, DemoUser } from '../data/demoUsers'

export const Profile = () => {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const [user, setUser] = useState<DemoUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (username) {
      const foundUser = getUserByUsername(username)
      setUser(foundUser || null)
    }
    setLoading(false)
  }, [username])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070A0F] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#B7F34A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#070A0F] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">User not found</p>
        <button
          onClick={() => navigate('/leaderboard')}
          className="text-[#B7F34A] hover:underline text-sm"
        >
          Back to Leaderboard
        </button>
      </div>
    )
  }

  const stats = {
    rank30d: 1,
    rankAllTime: 1,
    signals30d: 62,
    totalSignals: user.stats.signals,
  }

  return (
    <div className="min-h-screen bg-[#070A0F]">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="bg-[#0A1017] border border-[#1C2838] rounded-2xl overflow-hidden">
          {/* Cover Photo */}
          <div className="relative h-40">
            <img
              src={user.coverPhoto}
              alt="Cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1017]/80 to-transparent" />
          </div>

          {/* Profile Info */}
          <div className="relative px-4 pb-4">
            {/* Avatar */}
            <div className="absolute -top-12 left-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-[#1C2838] border-4 border-[#0A1017] overflow-hidden">
                  <img
                    src={user.avatar}
                    alt={user.displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                      ;(e.currentTarget as HTMLImageElement).nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#B7F34A] to-[#00D2B8] hidden">
                    <span className="text-2xl font-bold text-white">{user.displayName[0]}</span>
                  </div>
                </div>
                {user.verified && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-[#B7F34A] rounded-full flex items-center justify-center border-2 border-[#0A1017]">
                    <CheckCircle className="w-3.5 h-3.5 text-black" />
                  </div>
                )}
              </div>
            </div>

            {/* Name & Badges */}
            <div className="pt-14">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-white">{user.displayName}</h1>
                {user.verified && (
                  <svg className="w-5 h-5 text-[#3B9AE1]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                )}
              </div>
              <p className="text-gray-400 text-sm mb-2">@{user.username}</p>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {user.stats.accuracy >= 90 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-[11px] font-medium rounded border border-yellow-500/20">
                    <span className="text-xs">🏆</span>
                    Top Signaler
                  </span>
                )}
                {user.stats.signals >= 50 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#B7F34A]/10 text-[#B7F34A] text-[11px] font-medium rounded border border-[#B7F34A]/20">
                    <Star className="w-3 h-3" />
                    50+ signals
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mb-4">
                <button className="flex items-center gap-2 px-4 py-2 bg-[#B7F34A] hover:bg-[#a3e635] text-black font-semibold rounded-lg text-sm transition-colors">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button className="p-2 bg-[#1C2838] hover:bg-[#253545] rounded-lg text-gray-300 transition-colors">
                  <LinkIcon className="w-4 h-4" />
                </button>
                <button className="p-2 bg-[#1C2838] hover:bg-[#253545] rounded-lg text-gray-300 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                  </svg>
                </button>
              </div>

              {/* Bio */}
              <p className="text-gray-300 text-sm mb-3 line-clamp-2">{user.bio}</p>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-3 text-sm mb-4">
                <span className="text-white">
                  <span className="font-bold">{user.stats.following}</span>{' '}
                  <span className="text-gray-400">Following</span>
                </span>
                <span className="text-white">
                  <span className="font-bold">{user.stats.followers.toLocaleString()}</span>{' '}
                  <span className="text-gray-400">Followers</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4">
                <span>Signaling since Sep 2026</span>
                <span>Active 8h ago</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 border-t border-[#1C2838]">
            <div className="p-4 border-r border-[#1C2838]">
              <p className="text-2xl font-bold text-white mb-0.5">#{stats.rank30d}</p>
              <p className="text-[10px] text-gray-500 tracking-wider">30D RANK</p>
            </div>
            <div className="p-4">
              <p className="text-2xl font-bold text-white mb-0.5">#{stats.rankAllTime}</p>
              <p className="text-[10px] text-gray-500 tracking-wider">ALL-TIME RANK</p>
            </div>
            <div className="p-4 border-t border-r border-[#1C2838]">
              <p className="text-2xl font-bold text-white mb-0.5">{stats.signals30d}</p>
              <p className="text-[10px] text-gray-500 tracking-wider">30D SIGNALS</p>
            </div>
            <div className="p-4 border-t border-[#1C2838]">
              <p className="text-2xl font-bold text-white mb-0.5">{stats.totalSignals}</p>
              <p className="text-[10px] text-gray-500 tracking-wider">TOTAL SIGNALS</p>
            </div>
          </div>
        </div>

        {/* Top Tokens */}
        <div className="mt-4">
          <h2 className="text-base font-bold text-white mb-3 px-1">Top tokens</h2>
          <div className="bg-[#0A1017] border border-[#1C2838] rounded-xl overflow-hidden">
            {user.topTokens.map((token, index) => (
              <div
                key={token.symbol}
                className={`flex items-center gap-3 p-3 hover:bg-[#0F151E] transition-colors ${
                  index < user.topTokens.length - 1 ? 'border-b border-[#1C2838]/50' : ''
                }`}
              >
                <span className="text-gray-500 font-medium text-sm w-6 text-center">{index + 1}</span>
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-[#1C2838]">
                  <img
                    src={token.logo}
                    alt={token.symbol}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                      ;(e.currentTarget as HTMLImageElement).nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#B7F34A] to-[#00D2B8] hidden">
                    <span className="text-xs font-bold text-white">{token.symbol[0]}</span>
                  </div>
                </div>
                <span className="font-bold text-white text-sm flex-1">{token.symbol}</span>
                <span className="text-xs text-gray-400">{token.signals} signals</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}