import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Share2, Link as LinkIcon, Trophy } from 'lucide-react'
import { getUserByUsername, DemoUser } from '../data/demoUsers'
import { useAuth } from '../context/AuthContext'

export const Profile = () => {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const [user, setUser] = useState<DemoUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (username) {
      if (authUser && (username === authUser.username || username === 'me')) {
        setUser({
          id: 'me',
          username: authUser.username,
          displayName: authUser.displayName,
          bio: 'Solana verification enthusiast. Keeping token metadata transparent.',
          wallet: 'SunrisexKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
          avatar: authUser.avatar,
          coverPhoto: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop',
          verified: true,
          joinedDate: 'Sep 2026',
          stats: {
            signals: 0,
            accuracy: 0,
            followers: 0,
            following: 19,
          },
          topTokens: [],
          latestSignals: [],
        })
      } else {
        const foundUser = getUserByUsername(username)
        setUser(foundUser || null)
      }
    }
    setLoading(false)
  }, [username, authUser])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060B11] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#B7F34A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#060B11] flex flex-col items-center justify-center gap-4 text-white">
        <p className="text-gray-400">User profile not found</p>
        <button
          onClick={() => navigate('/leaderboard')}
          className="text-[#B7F34A] hover:underline text-sm font-semibold"
        >
          View Leaderboard
        </button>
      </div>
    )
  }

  const isCurrentUser = authUser && user.username === authUser.username

  return (
    <div className="min-h-screen bg-[#060B11] text-white pt-16 pb-20 px-4 font-sans">
      <div className="max-w-xl mx-auto space-y-4">
        
        {/* Profile Card Container (Matching Screenshot Exactly) */}
        <div className="bg-[#090F17] border border-[#141E2C] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          
          {/* Avatar and Main Info Header */}
          <div className="flex items-center gap-5 mb-5">
            {/* Avatar Circle */}
            <div className="relative w-24 h-24 rounded-full bg-[#0099FF] flex items-center justify-center text-white text-4xl font-extrabold shadow-lg overflow-hidden border-2 border-[#1E2D40]">
              {user.avatar ? (
                <img src={user.avatar} alt={user.displayName} className="w-full h-full object-cover" />
              ) : (
                user.displayName.charAt(0).toLowerCase()
              )}
            </div>

            {/* Display Name & Handle */}
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight leading-tight">
                {user.displayName.toLowerCase()}
              </h1>
              <p className="text-gray-400 text-sm font-medium mt-0.5">
                @{user.username}
              </p>
            </div>
          </div>

          {/* Action Buttons Row (Share, Copy, X) */}
          <div className="flex items-center gap-2.5 mb-5">
            <button className="flex items-center gap-2 px-5 py-2 bg-[#B7F34A] hover:bg-[#a3e635] text-black font-bold rounded-2xl text-xs transition-colors shadow-sm">
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
            <button className="p-2.5 bg-[#121B27] hover:bg-[#1A2636] border border-[#1C2A3A] rounded-2xl text-gray-300 transition-colors">
              <LinkIcon className="w-4 h-4" />
            </button>
            <button className="p-2.5 bg-[#121B27] hover:bg-[#1A2636] border border-[#1C2A3A] rounded-2xl text-gray-300 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
              </svg>
            </button>
          </div>

          {/* Following & Followers Stats */}
          <div className="flex items-center gap-4 text-xs mb-6 pb-6 border-b border-[#141E2C]">
            <span>
              <strong className="text-white font-black text-sm">{user.stats.following}</strong>{' '}
              <span className="text-gray-400">Following</span>
            </span>
            <span>
              <strong className="text-white font-black text-sm">{user.stats.followers}</strong>{' '}
              <span className="text-gray-400">Followers</span>
            </span>
          </div>

          {/* 2x2 Stats Grid (Cloning Screenshot Layout) */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* 30D Rank */}
            <div className="bg-[#05090F]/60 border border-[#141E2C] rounded-2xl p-4">
              <span className="text-2xl font-black text-white block">
                {isCurrentUser ? 'Unranked' : `#${user.rank}`}
              </span>
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mt-1 block">
                30D RANK
              </span>
            </div>

            {/* All-Time Rank */}
            <div className="bg-[#05090F]/60 border border-[#141E2C] rounded-2xl p-4">
              <span className="text-2xl font-black text-white block">
                {isCurrentUser ? 'Unranked' : `#${user.rank}`}
              </span>
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mt-1 block">
                ALL-TIME RANK
              </span>
            </div>

            {/* 30D Signals */}
            <div className="bg-[#05090F]/60 border border-[#141E2C] rounded-2xl p-4">
              <span className="text-2xl font-black text-white block">
                {user.stats.signals}
              </span>
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mt-1 block">
                30D SIGNALS
              </span>
            </div>

            {/* Total Signals */}
            <div className="bg-[#05090F]/60 border border-[#141E2C] rounded-2xl p-4">
              <span className="text-2xl font-black text-white block">
                {user.stats.signals}
              </span>
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mt-1 block">
                TOTAL SIGNALS
              </span>
            </div>

          </div>
        </div>

        {/* Contribute Signals Banner Container */}
        <div className="bg-[#090F17] border border-[#141E2C] rounded-3xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Contribute signals</h3>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              Submit token verifications, metadata, or flags to contribute, climb the leaderboard, and grow your profile.
            </p>
          </div>

          <button
            onClick={() => navigate('/leaderboard')}
            className="w-full py-3 bg-[#0D1520] hover:bg-[#152232] border border-[#1E2D40] rounded-2xl text-xs font-bold text-white transition-all text-center"
          >
            View leaderboard
          </button>
        </div>

        {/* Latest Signals */}
        <div className="pt-2">
          <h3 className="text-sm font-bold text-white px-1 mb-3">Latest signals</h3>
          <div className="bg-[#090F17] border border-[#141E2C] rounded-3xl p-8 text-center text-xs text-gray-500 min-h-[120px] flex flex-col items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-gray-600 opacity-40" />
            <span>No signals contributed yet</span>
          </div>
        </div>

      </div>
    </div>
  )
}