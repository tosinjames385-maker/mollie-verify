import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LEADERBOARD_AVATARS, getProfileImage } from '../lib/images'
import { ProfileImage } from '../components/TokenImage'

interface LeaderboardUser {
  id: string
  username: string
  handle: string
  avatar: string
  verified: boolean
  signals: number
  accuracy: number
  rank: number
}

const leaderboardData: LeaderboardUser[] = [
  {
    id: '1',
    username: 'sunrise',
    handle: '@sunrise',
    avatar: LEADERBOARD_AVATARS.sunrise,
    verified: true,
    signals: 76,
    accuracy: 96.8,
    rank: 1,
  },
  {
    id: '2',
    username: 'bidgridwin',
    handle: '@bidgridwin',
    avatar: LEADERBOARD_AVATARS.bidgridwin,
    verified: true,
    signals: 16,
    accuracy: 92.4,
    rank: 2,
  },
  {
    id: '3',
    username: 'dcjanio',
    handle: '@dcjanio',
    avatar: LEADERBOARD_AVATARS.dcjanio,
    verified: true,
    signals: 14,
    accuracy: 89.1,
    rank: 3,
  },
  {
    id: '4',
    username: 'playrelic',
    handle: '@playrelic',
    avatar: LEADERBOARD_AVATARS.playrelic,
    verified: true,
    signals: 10,
    accuracy: 87.4,
    rank: 4,
  },
  {
    id: '5',
    username: 'trystable',
    handle: '@trystable',
    avatar: LEADERBOARD_AVATARS.trystable,
    verified: true,
    signals: 8,
    accuracy: 85.0,
    rank: 5,
  },
  {
    id: '6',
    username: 'FireChicken007',
    handle: '@FireChicken007',
    avatar: LEADERBOARD_AVATARS.FireChicken007,
    verified: true,
    signals: 7,
    accuracy: 82.5,
    rank: 6,
  },
  {
    id: '7',
    username: 'CryptoWhale',
    handle: '@CryptoWhale',
    avatar: getProfileImage('CryptoWhale', 12),
    verified: true,
    signals: 6,
    accuracy: 78.4,
    rank: 7,
  },
]

export const Leaderboard = () => {
  const navigate = useNavigate()
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | 'all'>('30d')
  const [animatePodium, setAnimatePodium] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setAnimatePodium(true), 80)
    return () => clearTimeout(timer)
  }, [])

  const top1 = leaderboardData[0]
  const top2 = leaderboardData[1]
  const top3 = leaderboardData[2]
  const rest = leaderboardData.slice(3)

  return (
    <div className="min-h-screen bg-[#060B11] text-white font-sans pt-8 pb-20 px-5">
      <div className="max-w-xl mx-auto">

        <div className="mb-8">
          <h1 className="text-[34px] leading-none font-extrabold text-white tracking-tight">Most Verified</h1>
          <p className="text-gray-400 text-[15px] mt-2.5">Who's been keeping token data honest.</p>

          <div className="flex items-center gap-2 mt-5">
            {(['7d', '30d', 'all'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeFilter(period)}
                className={`px-3 py-1.5 rounded-xl text-[13px] font-medium transition-all ${
                  timeFilter === period
                    ? 'bg-[#1C2838] text-[#B7F34A] border border-[#2A3B50]'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                {period === 'all' ? 'All time' : period}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end justify-center gap-2 my-8 pt-6">

          {/* 2nd Place */}
          <button
            onClick={() => navigate(`/profile/${top2.username}`)}
            className="flex flex-col items-center flex-1 max-w-[118px]"
          >
            <div className="relative mb-1.5 flex flex-col items-center">
              <div className="w-[68px] h-[68px] rounded-full p-[2px] bg-gradient-to-br from-[#9EAAB8] to-[#3B4654] shadow-[0_0_18px_rgba(120,140,160,0.25)] relative">
                <div className="w-full h-full rounded-full overflow-hidden bg-[#0F151E]">
                  <ProfileImage src={top2.avatar} seed={top2.username} alt={top2.username} />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-[1px] bg-[#2B3542] text-[8px] font-black text-gray-200 rounded-full border border-gray-500/80 tracking-wide">
                  2ND
                </div>
              </div>
              <span className="text-[12px] font-semibold text-gray-200 mt-2.5 truncate w-full text-center">
                {top2.handle}
              </span>
            </div>
            <div
              className={`w-full bg-gradient-to-b from-[#2A3644] to-[#121A24] border border-[#3B4C60]/50 rounded-t-2xl flex flex-col items-center justify-center transition-all duration-1000 ease-out ${
                animatePodium ? 'h-[118px] opacity-100' : 'h-0 opacity-0'
              }`}
            >
              <span className="text-[28px] font-black text-gray-100 leading-none">{top2.signals}</span>
              <span className="text-[11px] text-gray-400 font-medium mt-1">signals</span>
            </div>
          </button>

          {/* 1st Place */}
          <button
            onClick={() => navigate(`/profile/${top1.username}`)}
            className="flex flex-col items-center flex-1 max-w-[132px] z-10 -mt-4"
          >
            <div className="relative mb-1.5 flex flex-col items-center">
              <div className="w-[84px] h-[84px] rounded-full p-[3px] bg-gradient-to-br from-[#F5C752] via-[#E89B3C] to-[#8C550D] shadow-[0_0_32px_rgba(245,199,82,0.45)] relative">
                <div className="w-full h-full rounded-full overflow-hidden bg-[#0F151E]">
                  <ProfileImage src={top1.avatar} seed={top1.username} alt={top1.username} />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-[2px] bg-[#D48924] text-[9px] font-black text-white rounded-full border border-yellow-200/70 tracking-wide">
                  1ST
                </div>
              </div>
              <span className="text-[12px] font-semibold text-white mt-2.5 truncate w-full text-center">
                {top1.handle}
              </span>
            </div>
            <div
              className={`w-full bg-gradient-to-b from-[#8B6914] via-[#5A4210] to-[#1A1303] border border-[#C9A227]/70 rounded-t-2xl flex flex-col items-center justify-center transition-all duration-1000 ease-out shadow-[0_12px_36px_rgba(212,137,36,0.28)] ${
                animatePodium ? 'h-[168px] opacity-100' : 'h-0 opacity-0'
              }`}
            >
              <span className="text-[36px] font-black text-[#F5C752] leading-none">{top1.signals}</span>
              <span className="text-[11px] text-amber-200/70 font-medium mt-1">signals</span>
            </div>
          </button>

          {/* 3rd Place */}
          <button
            onClick={() => navigate(`/profile/${top3.username}`)}
            className="flex flex-col items-center flex-1 max-w-[110px]"
          >
            <div className="relative mb-1.5 flex flex-col items-center">
              <div className="w-[62px] h-[62px] rounded-full p-[2px] bg-gradient-to-br from-[#E08A4F] to-[#612A0D] shadow-[0_0_18px_rgba(224,138,79,0.3)] relative">
                <div className="w-full h-full rounded-full overflow-hidden bg-[#0F151E]">
                  <ProfileImage src={top3.avatar} seed={top3.username} alt={top3.username} />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-[1px] bg-[#823A16] text-[8px] font-black text-orange-100 rounded-full border border-orange-400/70 tracking-wide">
                  3RD
                </div>
              </div>
              <span className="text-[12px] font-semibold text-gray-200 mt-2.5 truncate w-full text-center">
                {top3.handle}
              </span>
            </div>
            <div
              className={`w-full bg-gradient-to-b from-[#5A2E16] to-[#170B06] border border-[#8B4A24]/50 rounded-t-2xl flex flex-col items-center justify-center transition-all duration-1000 ease-out ${
                animatePodium ? 'h-[96px] opacity-100' : 'h-0 opacity-0'
              }`}
            >
              <span className="text-[26px] font-black text-orange-300 leading-none">{top3.signals}</span>
              <span className="text-[11px] text-orange-200/60 font-medium mt-1">signals</span>
            </div>
          </button>
        </div>

        <div className="space-y-1 mt-4">
          {rest.map((user) => (
            <button
              key={user.id}
              onClick={() => navigate(`/profile/${user.username}`)}
              className="w-full flex items-center justify-between py-3.5 px-1 hover:bg-white/[0.02] rounded-xl transition-all group"
            >
              <div className="flex items-center gap-4">
                <span className="text-[15px] font-medium text-gray-500 w-4 text-center">{user.rank}</span>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#15202E] flex-shrink-0">
                  <ProfileImage src={user.avatar} seed={user.username} alt={user.username} />
                </div>
                <span className="font-semibold text-white text-[15px] group-hover:text-[#B7F34A] transition-colors">
                  {user.handle}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-semibold text-gray-200">{user.signals}</span>
                <span className="text-[13px] text-gray-500">signals</span>
              </div>
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}
