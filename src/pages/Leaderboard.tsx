import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

interface LeaderboardUser {
  id: string
  username: string
  handle: string
  avatar: string
  verified: boolean
  signals: number
  accuracy: number
  rank: number
  badgeText?: string
  gradient: string
  height: string
  bgColor: string
}

const leaderboardData: LeaderboardUser[] = [
  {
    id: '1',
    username: 'sunrise',
    handle: '@sunrise',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=sunrise',
    verified: true,
    signals: 63,
    accuracy: 96.8,
    rank: 1,
    badgeText: '1ST',
    gradient: 'from-[#E6A633] via-[#D48924] to-[#8C550D]',
    bgColor: 'from-[#4D3610]/40 to-[#261A05]/80',
    height: 'h-[160px]',
  },
  {
    id: '2',
    username: 'bidgridwin',
    handle: '@bidgridwin',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=bidgridwin',
    verified: true,
    signals: 18,
    accuracy: 92.4,
    rank: 2,
    badgeText: '2ND',
    gradient: 'from-[#9EAAB8] via-[#677788] to-[#3B4654]',
    bgColor: 'from-[#222B36]/50 to-[#12171F]/80',
    height: 'h-[120px]',
  },
  {
    id: '3',
    username: 'playrelic',
    handle: '@playrelic',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=playrelic',
    verified: true,
    signals: 15,
    accuracy: 89.1,
    rank: 3,
    badgeText: '3RD',
    gradient: 'from-[#D47038] via-[#9E491A] to-[#612A0D]',
    bgColor: 'from-[#3D2012]/40 to-[#1A0C06]/80',
    height: 'h-[100px]',
  },
  {
    id: '4',
    username: 'dcjanio',
    handle: '@dcjanio',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=dcjanio',
    verified: false,
    signals: 14,
    accuracy: 85.0,
    rank: 4,
  },
  {
    id: '5',
    username: 'FireChicken007',
    handle: '@FireChicken007',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=FireChicken007',
    verified: true,
    signals: 10,
    accuracy: 82.5,
    rank: 5,
  },
  {
    id: '6',
    username: 'trvstable',
    handle: '@trvstable',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=trvstable',
    verified: true,
    signals: 8,
    accuracy: 80.1,
    rank: 6,
  },
  {
    id: '7',
    username: 'CryptoWhale',
    handle: '@CryptoWhale',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=CryptoWhale',
    verified: true,
    signals: 7,
    accuracy: 78.4,
    rank: 7,
  },
]

export const Leaderboard = () => {
  const navigate = useNavigate()
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | 'all'>('30d')
  const [animatePodium, setAnimatePodium] = useState(false)

  // Trigger smooth upward growth animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimatePodium(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const top1 = leaderboardData[0]
  const top2 = leaderboardData[1]
  const top3 = leaderboardData[2]
  const rest = leaderboardData.slice(3)

  return (
    <div className="min-h-screen bg-[#060B11] text-white font-sans pt-16 pb-20 px-4">
      <div className="max-w-xl mx-auto">
        
        {/* Title Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Most Verified</h1>
          <p className="text-gray-400 text-sm mt-1">Who's been keeping token data honest.</p>
          
          {/* Time Filter Pills */}
          <div className="flex items-center gap-2 mt-4">
            {(['7d', '30d', 'all'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeFilter(period)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  timeFilter === period
                    ? 'bg-[#1C2838] text-[#B7F34A] border border-[#2A3B50]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {period === 'all' ? 'All time' : period}
              </button>
            ))}
          </div>
        </div>

        {/* Animated Top 3 Podium (Cloning Screenshot Exactly) */}
        <div className="flex items-end justify-center gap-3 my-10 pt-4">
          
          {/* 2nd Place - Left */}
          <div className="flex flex-col items-center flex-1 max-w-[120px]">
            <div className="relative mb-2 flex flex-col items-center">
              {/* Avatar circle with glow border */}
              <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-br from-[#9EAAB8] to-[#3B4654] shadow-lg relative">
                <img
                  src={top2.avatar}
                  alt={top2.username}
                  className="w-full h-full rounded-full object-cover bg-[#0F151E]"
                />
                {/* Badge 2ND */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-[#2B3542] text-[9px] font-black text-gray-200 rounded-full border border-gray-400 shadow-md">
                  2ND
                </div>
              </div>
              <span className="text-xs font-bold text-gray-200 mt-2 truncate w-full text-center">
                {top2.handle}
              </span>
            </div>

            {/* Podium Bar with smooth height transition */}
            <div
              className={`w-full bg-gradient-to-b from-[#253242] to-[#121A24] border border-[#3B4C60]/60 rounded-t-2xl flex flex-col items-center justify-center transition-all duration-1000 ease-out shadow-2xl ${
                animatePodium ? 'h-[120px] opacity-100' : 'h-0 opacity-0'
              }`}
            >
              <span className="text-2xl font-black text-gray-100">{top2.signals}</span>
              <span className="text-[10px] text-gray-400 font-medium mt-0.5">signals</span>
            </div>
          </div>

          {/* 1st Place - Center (Tallest) */}
          <div className="flex flex-col items-center flex-1 max-w-[130px] z-10">
            <div className="relative mb-2 flex flex-col items-center">
              {/* Avatar circle with glowing gold ring */}
              <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-br from-[#F5C752] via-[#D48924] to-[#8C550D] shadow-[0_0_20px_rgba(245,199,82,0.3)] relative">
                <img
                  src={top1.avatar}
                  alt={top1.username}
                  className="w-full h-full rounded-full object-cover bg-[#0F151E]"
                />
                {/* Badge 1ST */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#D48924] text-[10px] font-black text-white rounded-full border border-yellow-300 shadow-md">
                  1ST
                </div>
              </div>
              <span className="text-xs font-bold text-white mt-2 truncate w-full text-center">
                {top1.handle}
              </span>
            </div>

            {/* Podium Bar with smooth height transition */}
            <div
              className={`w-full bg-gradient-to-b from-[#694E15] via-[#45320A] to-[#1A1303] border border-[#A37B24]/80 rounded-t-2xl flex flex-col items-center justify-center transition-all duration-1000 ease-out shadow-[0_10px_30px_rgba(212,137,36,0.2)] ${
                animatePodium ? 'h-[160px] opacity-100' : 'h-0 opacity-0'
              }`}
            >
              <span className="text-3xl font-black text-[#F5C752]">{top1.signals}</span>
              <span className="text-[10px] text-amber-200/70 font-medium mt-0.5">signals</span>
            </div>
          </div>

          {/* 3rd Place - Right */}
          <div className="flex flex-col items-center flex-1 max-w-[110px]">
            <div className="relative mb-2 flex flex-col items-center">
              {/* Avatar circle with bronze ring */}
              <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-br from-[#D47038] to-[#612A0D] shadow-lg relative">
                <img
                  src={top3.avatar}
                  alt={top3.username}
                  className="w-full h-full rounded-full object-cover bg-[#0F151E]"
                />
                {/* Badge 3RD */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-[#823A16] text-[9px] font-black text-orange-200 rounded-full border border-orange-400 shadow-md">
                  3RD
                </div>
              </div>
              <span className="text-xs font-bold text-gray-200 mt-2 truncate w-full text-center">
                {top3.handle}
              </span>
            </div>

            {/* Podium Bar with smooth height transition */}
            <div
              className={`w-full bg-gradient-to-b from-[#3D2316] to-[#170B06] border border-[#6B3B24]/60 rounded-t-2xl flex flex-col items-center justify-center transition-all duration-1000 ease-out shadow-2xl ${
                animatePodium ? 'h-[100px] opacity-100' : 'h-0 opacity-0'
              }`}
            >
              <span className="text-2xl font-black text-orange-300">{top3.signals}</span>
              <span className="text-[10px] text-orange-200/60 font-medium mt-0.5">signals</span>
            </div>
          </div>

        </div>

        {/* Rest of Leaderboard List */}
        <div className="space-y-3 mt-6">
          {rest.map((user) => (
            <button
              key={user.id}
              onClick={() => navigate(`/profile/${user.username}`)}
              className="w-full flex items-center justify-between p-3.5 bg-[#090F17] hover:bg-[#101824] border border-[#141E2C] rounded-2xl transition-all group"
            >
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-gray-500 w-5 text-center">{user.rank}</span>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#15202E] border border-[#1C2838]">
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                </div>
                <span className="font-bold text-white text-sm group-hover:text-[#B7F34A] transition-colors">
                  {user.handle}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-200">{user.signals}</span>
                <span className="text-xs text-gray-500">signals</span>
              </div>
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}