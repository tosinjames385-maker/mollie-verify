import { LEADERBOARD_AVATARS, getProfileImage, getCoinImage } from '../lib/images'

export interface DemoUser {
  id: string
  username: string
  displayName: string
  bio: string
  wallet: string
  avatar: string
  coverPhoto: string
  verified: boolean
  rank?: number
  joinedDate: string
  stats: {
    signals: number
    accuracy: number
    followers: number
    following: number
  }
  topTokens: {
    symbol: string
    name: string
    logo: string
    accuracy: number
    signals: number
  }[]
  latestSignals: {
    tokenSymbol: string
    tokenLogo: string
    action: string
    accuracy: number
    date: string
  }[]
}

export const demoUsers: DemoUser[] = [
  {
    id: '0',
    username: 'sunrise',
    displayName: 'Sunrise',
    bio: 'Every asset has a sunrise. New stocks, commodities, and more, tradable across Solana.',
    wallet: 'SunrisexKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    avatar: LEADERBOARD_AVATARS.sunrise,
    coverPhoto: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop',
    verified: true,
    rank: 1,
    joinedDate: 'Sep 2026',
    stats: {
      signals: 76,
      accuracy: 95.2,
      followers: 26324,
      following: 50,
    },
    topTokens: [
      { symbol: 'BABA', name: 'Alibaba', logo: getCoinImage('BABA', 1), accuracy: 94.5, signals: 2 },
      { symbol: 'BA', name: 'Boeing', logo: getCoinImage('BA', 2), accuracy: 93.2, signals: 2 },
    ],
    latestSignals: [
      { tokenSymbol: 'BABA', tokenLogo: getCoinImage('BABA', 1), action: 'Verified', accuracy: 96.8, date: '2h ago' },
      { tokenSymbol: 'BA', tokenLogo: getCoinImage('BA', 2), action: 'Verified', accuracy: 94.5, date: '5h ago' },
    ],
  },
  {
    id: 'b1',
    username: 'bidgridwin',
    displayName: 'bidgridwin',
    bio: 'Grid trading and token verification. Keeping listings honest.',
    wallet: 'BidgXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    avatar: LEADERBOARD_AVATARS.bidgridwin,
    coverPhoto: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=400&fit=crop',
    verified: true,
    rank: 2,
    joinedDate: 'Mar 2026',
    stats: {
      signals: 16,
      accuracy: 92.4,
      followers: 1840,
      following: 88,
    },
    topTokens: [
      { symbol: 'SOL', name: 'Solana', logo: getCoinImage('SOL', 3), accuracy: 95.1, signals: 6 },
    ],
    latestSignals: [
      { tokenSymbol: 'SOL', tokenLogo: getCoinImage('SOL', 3), action: 'Verified', accuracy: 97.2, date: '4h ago' },
    ],
  },
  {
    id: 'b2',
    username: 'dcjanio',
    displayName: 'dcjanio',
    bio: 'Privacy maxi. Reviewing Solana token metadata.',
    wallet: 'DcjaXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    avatar: LEADERBOARD_AVATARS.dcjanio,
    coverPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=400&fit=crop',
    verified: true,
    rank: 3,
    joinedDate: 'Jan 2026',
    stats: {
      signals: 14,
      accuracy: 89.1,
      followers: 960,
      following: 41,
    },
    topTokens: [
      { symbol: 'JUP', name: 'Jupiter', logo: getCoinImage('JUP', 4), accuracy: 91.0, signals: 5 },
    ],
    latestSignals: [
      { tokenSymbol: 'JUP', tokenLogo: getCoinImage('JUP', 4), action: 'Verified', accuracy: 93.4, date: '8h ago' },
    ],
  },
  {
    id: 'b3',
    username: 'playrelic',
    displayName: 'playrelic',
    bio: 'Onchain games and verified token data.',
    wallet: 'PlayXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    avatar: LEADERBOARD_AVATARS.playrelic,
    coverPhoto: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&h=400&fit=crop',
    verified: true,
    rank: 4,
    joinedDate: 'Feb 2026',
    stats: {
      signals: 10,
      accuracy: 87.4,
      followers: 720,
      following: 33,
    },
    topTokens: [],
    latestSignals: [],
  },
  {
    id: 'b4',
    username: 'trystable',
    displayName: 'trystable',
    bio: 'Stablecoin researcher. Token verification contributor.',
    wallet: 'TryXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    avatar: LEADERBOARD_AVATARS.trystable,
    coverPhoto: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=400&fit=crop',
    verified: true,
    rank: 5,
    joinedDate: 'Apr 2026',
    stats: {
      signals: 8,
      accuracy: 85.0,
      followers: 540,
      following: 29,
    },
    topTokens: [],
    latestSignals: [],
  },
  {
    id: 'b5',
    username: 'FireChicken007',
    displayName: 'FireChicken007',
    bio: 'Spicy takes, careful reviews.',
    wallet: 'FireXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    avatar: LEADERBOARD_AVATARS.FireChicken007,
    coverPhoto: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop',
    verified: true,
    rank: 6,
    joinedDate: 'May 2026',
    stats: {
      signals: 7,
      accuracy: 82.5,
      followers: 410,
      following: 19,
    },
    topTokens: [],
    latestSignals: [],
  },
  {
    id: '1',
    username: 'CryptoWhale',
    displayName: 'Crypto Whale',
    bio: 'Full-time crypto researcher and signal provider. Verified tokens enthusiast.',
    wallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    avatar: getProfileImage('CryptoWhale', 12),
    coverPhoto: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=400&fit=crop',
    verified: true,
    joinedDate: 'Jan 2024',
    stats: {
      signals: 1247,
      accuracy: 94.2,
      followers: 3420,
      following: 156,
    },
    topTokens: [
      { symbol: 'SOL', name: 'Solana', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png', accuracy: 96.5, signals: 234 },
      { symbol: 'JUP', name: 'Jupiter', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN/logo.png', accuracy: 94.2, signals: 189 },
      { symbol: 'BONK', name: 'Bonk', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/logo.png', accuracy: 92.8, signals: 167 },
    ],
    latestSignals: [
      { tokenSymbol: 'SOL', tokenLogo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png', action: 'Verified', accuracy: 98.5, date: '2h ago' },
      { tokenSymbol: 'JUP', tokenLogo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN/logo.png', action: 'Verified', accuracy: 95.2, date: '5h ago' },
      { tokenSymbol: 'BONK', tokenLogo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/logo.png', action: 'Flagged', accuracy: 89.3, date: '1d ago' },
    ],
  },
  {
    id: '2',
    username: 'SolanaDev',
    displayName: 'Solana Developer',
    bio: 'Building on Solana since 2021. Token verification expert.',
    wallet: '8xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    avatar: getProfileImage('SolanaDev', 21),
    coverPhoto: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=400&fit=crop',
    verified: true,
    joinedDate: 'Mar 2024',
    stats: {
      signals: 1156,
      accuracy: 92.8,
      followers: 2890,
      following: 203,
    },
    topTokens: [
      { symbol: 'WIF', name: 'dogwifhat', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm/logo.png', accuracy: 95.1, signals: 198 },
      { symbol: 'POPCAT', name: 'Popcat', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr/logo.png', accuracy: 93.4, signals: 176 },
      { symbol: 'RENDER', name: 'Render', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof/logo.png', accuracy: 91.2, signals: 145 },
    ],
    latestSignals: [
      { tokenSymbol: 'WIF', tokenLogo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm/logo.png', action: 'Verified', accuracy: 97.8, date: '1h ago' },
      { tokenSymbol: 'POPCAT', tokenLogo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr/logo.png', action: 'Verified', accuracy: 94.5, date: '3h ago' },
      { tokenSymbol: 'RENDER', tokenLogo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof/logo.png', action: 'Flagged', accuracy: 88.7, date: '6h ago' },
    ],
  },
  {
    id: '3',
    username: 'TokenScout',
    displayName: 'Token Scout',
    bio: 'Finding the next gem before anyone else. 91.5% accuracy rate.',
    wallet: '9xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    avatar: getProfileImage('TokenScout', 33),
    coverPhoto: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&h=400&fit=crop',
    verified: true,
    joinedDate: 'Feb 2024',
    stats: {
      signals: 1089,
      accuracy: 91.5,
      followers: 2340,
      following: 178,
    },
    topTokens: [
      { symbol: 'ORCA', name: 'Orca', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE/logo.png', accuracy: 94.8, signals: 167 },
      { symbol: 'PYTH', name: 'Pyth Network', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3/logo.png', accuracy: 92.3, signals: 145 },
      { symbol: 'W', name: 'Wormhole', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ/logo.png', accuracy: 90.1, signals: 132 },
    ],
    latestSignals: [
      { tokenSymbol: 'ORCA', tokenLogo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE/logo.png', action: 'Verified', accuracy: 96.2, date: '4h ago' },
      { tokenSymbol: 'PYTH', tokenLogo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3/logo.png', action: 'Verified', accuracy: 93.8, date: '8h ago' },
      { tokenSymbol: 'W', tokenLogo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ/logo.png', action: 'Flagged', accuracy: 87.5, date: '1d ago' },
    ],
  },
]

export const getUserByUsername = (username: string): DemoUser | undefined => {
  return demoUsers.find(u => u.username === username)
}