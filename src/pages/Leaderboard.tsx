import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, TrendingUp, ChevronRight } from 'lucide-react'

interface LeaderboardUser {
  id: string
  username: string
  wallet: string
  avatar: string
  verified: boolean
  signals: number
  accuracy: number
  rank: number
  isTop3?: boolean
  medal?: 'gold' | 'silver' | 'bronze'
}

const leaderboardData: LeaderboardUser[] = [
  {
    id: '1',
    username: 'CryptoWhale',
    wallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CryptoWhale&backgroundColor=b6e3f4',
    verified: true,
    signals: 1247,
    accuracy: 94.2,
    rank: 1,
    isTop3: true,
    medal: 'gold',
  },
  {
    id: '2',
    username: 'SolanaDev',
    wallet: '8xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SolanaDev&backgroundColor=c0aede',
    verified: true,
    signals: 1156,
    accuracy: 92.8,
    rank: 2,
    isTop3: true,
    medal: 'silver',
  },
  {
    id: '3',
    username: 'TokenScout',
    wallet: '9xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TokenScout&backgroundColor=ffd5dc',
    verified: true,
    signals: 1089,
    accuracy: 91.5,
    rank: 3,
    isTop3: true,
    medal: 'bronze',
  },
  {
    id: '4',
    username: 'DeFiHunter',
    wallet: 'AxKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DeFiHunter&backgroundColor=ff9ff3',
    verified: true,
    signals: 987,
    accuracy: 89.3,
    rank: 4,
  },
  {
    id: '5',
    username: 'BlockchainBrain',
    wallet: 'BxKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BlockchainBrain&backgroundColor=feca57',
    verified: true,
    signals: 923,
    accuracy: 88.7,
    rank: 5,
  },
  {
    id: '6',
    username: 'Web3Wizard',
    wallet: 'CxKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Web3Wizard&backgroundColor=48dbfb',
    verified: true,
    signals: 876,
    accuracy: 87.2,
    rank: 6,
  },
  {
    id: '7',
    username: 'CryptoNinja',
    wallet: 'DxKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CryptoNinja&backgroundColor=ff6b6b',
    verified: true,
    signals: 812,
    accuracy: 86.5,
    rank: 7,
  },
  {
    id: '8',
    username: 'TokenHunter',
    wallet: 'ExKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TokenHunter&backgroundColor=a29bfe',
    verified: true,
    signals: 789,
    accuracy: 85.9,
    rank: 8,
  },
  {
    id: '9',
    username: 'SolanaFan',
    wallet: 'FxKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SolanaFan&backgroundColor=55efc4',
    verified: true,
    signals: 756,
    accuracy: 84.3,
    rank: 9,
  },
  {
    id: '10',
    username: 'DeFiMaster',
    wallet: 'GxKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DeFiMaster&backgroundColor=fd79a8',
    verified: true,
    signals: 723,
    accuracy: 83.8,
    rank: 10,
  },
]

export const Leaderboard = () => {
  const navigate = useNavigate()
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | 'all'>('all')

  const top3 = leaderboardData.filter(u => u.isTop3)
  const rest = leaderboardData.filter(u => !u.isTop3)

  const getMedalColor = (medal: string) => {
    switch (medal) {
      case 'gold': return 'from-yellow-400 to-yellow-600'
      case 'silver': return 'from-gray-300 to-gray-500'
      case 'bronze': return 'from-orange-400 to-orange-600'
      default: return 'from-gray-400 to-gray-600'
    }
  }

  const getMedalBg = (medal: string) => {
    switch (medal) {
      case 'gold': return 'bg-yellow-500/10 border-yellow-500/30'
      case 'silver': return 'bg-gray-400/10 border-gray-400/30'
      case 'bronze': return 'bg-orange-500/10 border-orange-500/30'
      default: return 'bg-gray-500/10 border-gray-500/30'
    }
  }

  return (
    <div className="min-h-screen bg-[#070A0F]">
      {/* Header */}
      <div className="px-4 pt-8 pb-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Trophy className="w-8 h-8 text-[#B7F34A]" />
          <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
        </div>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          See the top signal generators on VRFD. Earn points by verifying tokens and providing accurate signals.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-20">
        {/* Time Filter */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[
            { key: '7d' as const, label: '7d' },
            { key: '30d' as const, label: '30d' },
            { key: 'all' as const, label: 'All time' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setTimeFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeFilter === f.key
                  ? 'bg-[#1C2838] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#1C2838]/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        <div className="flex items-end justify-center gap-4 mb-8">
          {/* 2nd Place */}
          <div className="flex flex-col items-center">
            <div className={`w-20 h-20 rounded-full border-2 ${getMedalBg(top3[1]?.medal || 'silver')} flex items-center justify-center mb-2`}>
              <img
                src={top3[1]?.avatar}
                alt={top3[1]?.username}
                className="w-16 h-16 rounded-full"
              />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-sm">{top3[1]?.username}</p>
              <p className="text-gray-500 text-xs">{top3[1]?.signals} signals</p>
            </div>
            <div className="w-16 h-24 bg-gradient-to-t from-gray-400 to-gray-500 rounded-t-lg flex items-center justify-center mt-2">
              <span className="text-2xl font-bold text-white">2</span>
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center">
            <div className={`w-24 h-24 rounded-full border-2 ${getMedalBg(top3[0]?.medal || 'gold')} flex items-center justify-center mb-2`}>
              <img
                src={top3[0]?.avatar}
                alt={top3[0]?.username}
                className="w-20 h-20 rounded-full"
              />
            </div>
            <div className="text-center">
              <p className="text-white font-bold">{top3[0]?.username}</p>
              <p className="text-gray-500 text-sm">{top3[0]?.signals} signals</p>
            </div>
            <div className="w-20 h-32 bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t-lg flex items-center justify-center mt-2">
              <span className="text-3xl font-bold text-white">1</span>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center">
            <div className={`w-16 h-16 rounded-full border-2 ${getMedalBg(top3[2]?.medal || 'bronze')} flex items-center justify-center mb-2`}>
              <img
                src={top3[2]?.avatar}
                alt={top3[2]?.username}
                className="w-12 h-12 rounded-full"
              />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-sm">{top3[2]?.username}</p>
              <p className="text-gray-500 text-xs">{top3[2]?.signals} signals</p>
            </div>
            <div className="w-14 h-20 bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg flex items-center justify-center mt-2">
              <span className="text-xl font-bold text-white">3</span>
            </div>
          </div>
        </div>

        {/* Rest of Leaderboard */}
        <div className="bg-[#0A1017] border border-[#1C2838] rounded-xl overflow-hidden">
          {rest.map((user, index) => (
            <button
              key={user.id}
              onClick={() => navigate(`/profile/${user.username}`)}
              className={`w-full p-4 text-left hover:bg-[#0F151E] transition-colors flex items-center gap-4 ${
                index < rest.length - 1 ? 'border-b border-[#1C2838]/50' : ''
              }`}
            >
              <span className="text-gray-500 font-medium w-8 text-center">{user.rank}</span>
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#1C2838]">
                <img src={user.avatar} alt={user.username} className="w-full h-full" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{user.username}</span>
                  {user.verified && (
                    <svg className="w-4 h-4 text-[#B7F34A]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  )}
                </div>
                <p className="text-gray-500 text-sm">{user.signals} signals</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Accuracy</p>
                  <p className="text-white font-medium">{user.accuracy}%</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}