export interface Submission {
  id: string
  submissionType: string
  status: string
  isExpress: boolean
  submitterWallet: string
  submitterX?: string
  tokenX?: string
  createdAt: string
  token: {
    name: string
    symbol: string
    mintAddress: string
    imageUrl?: string
    marketCap?: string
    netVolume?: string
    timeAgo?: string
  }
  metrics?: {
    mcFdv?: string
    vol24h?: string
    netVolume?: string
    liquidity?: string
    organicScore?: number
    likesSmartLikes?: string
    smartFollowers?: number
  }
  jupShield?: string[]
  auditLog?: {
    date: string
    action: string
    details: string
  }[]
}

export const demoSubmissions: Submission[] = [
  {
    id: '1',
    submissionType: 'verification',
    status: 'pending',
    isExpress: false,
    submitterWallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    submitterX: '@AMDx',
    tokenX: '@AMDx',
    createdAt: '2026-09-16T15:00:00Z',
    token: {
      name: 'AMD',
      symbol: 'AMD',
      mintAddress: 'AMD8Qw3nHjeESkKXmg4rRp5z9t7g6hN6vZ4c8dYmXxES',
      imageUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=AMD',
      marketCap: '—',
      netVolume: 'S:$26.0K',
      timeAgo: '1h',
    },
  },
  {
    id: '2',
    submissionType: 'verification',
    status: 'pending',
    isExpress: true,
    submitterWallet: '8xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    submitterX: '@SHWEPAYx',
    tokenX: '@SHWEPAYx',
    createdAt: '2026-08-15T10:30:00Z',
    token: {
      name: 'SHWE PAY',
      symbol: 'SHWEPAY',
      mintAddress: 'F7j3kLmNpQrS9tUvWxYz4dBc6eGhAaBbOoIiCcDdAboo',
      imageUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=SHWEPAY',
      marketCap: '—',
      netVolume: '—',
      timeAgo: '32d',
    },
  },
  {
    id: '3',
    submissionType: 'verification',
    status: 'pending',
    isExpress: false,
    submitterWallet: '9xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    submitterX: '@STEALFxyz',
    tokenX: '@STEALFxyz',
    createdAt: '2026-09-15T14:51:00Z',
    token: {
      name: 'Stealf',
      symbol: 'STEALF',
      mintAddress: 'G5W6LwkLeoj6rZqBP1y3KT8k6Cz6rXGJmMNU3TArXtXw',
      imageUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=STEALF',
      marketCap: '$236K',
      netVolume: 'B:$40.5K',
      timeAgo: '22h',
    },
    metrics: {
      mcFdv: '$221K / $221K',
      vol24h: '$2.31M',
      netVolume: 'B:$39.1K',
      liquidity: '$39.4K',
      organicScore: 75,
      likesSmartLikes: '0 / 0',
      smartFollowers: 62,
    },
    jupShield: ['Not Verified', 'New Listing'],
    auditLog: [
      { date: '15 Sep 2026, 14:51', action: 'SUBMITTED', details: '@STEALFxyz · standard lane' },
      { date: '15 Sep 2026, 14:51', action: 'AUTO', details: 'Jup shield found 2 warnings' },
    ],
  },
  {
    id: '4',
    submissionType: 'verification',
    status: 'pending',
    isExpress: false,
    submitterWallet: '6xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    submitterX: '@RTOx',
    tokenX: '@RTOx',
    createdAt: '2026-08-14T10:30:00Z',
    token: {
      name: 'RTOx',
      symbol: 'RTOx',
      mintAddress: 'XswGwNY1Yy33dGt5f5f5f5f5f5f5f5f5f5f5f5f5f',
      imageUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=RTOx',
      marketCap: '—',
      netVolume: '—',
      timeAgo: '33d',
    },
  },
  {
    id: '5',
    submissionType: 'verification',
    status: 'pending',
    isExpress: false,
    submitterWallet: '5xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    submitterX: '@AAFx',
    tokenX: '@AAFx',
    createdAt: '2026-08-14T09:15:00Z',
    token: {
      name: 'AAFx',
      symbol: 'AAFx',
      mintAddress: 'XskX7gT3kL9mN4pQ2sD5fH8jB1vC6xZ3aW9eR4tY6WX',
      imageUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=AAFx',
      marketCap: '—',
      netVolume: '—',
      timeAgo: '33d',
    },
  },
  {
    id: '6',
    submissionType: 'verification',
    status: 'pending',
    isExpress: false,
    submitterWallet: '4xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    submitterX: '@BBY.GBx',
    tokenX: '@BBY.GBx',
    createdAt: '2026-08-14T08:00:00Z',
    token: {
      name: 'BBY.GBx',
      symbol: 'BBY.GBx',
      mintAddress: 'Xs6aVfPk9mN4pQ2sD5fH8jB1vC6xZ3aW9eR4tY7uIo',
      imageUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=BBYGBx',
      marketCap: '—',
      netVolume: '—',
      timeAgo: '33d',
    },
  },
  {
    id: '7',
    submissionType: 'verification',
    status: 'pending',
    isExpress: false,
    submitterWallet: '3xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    submitterX: '@PSN.GBx',
    tokenX: '@PSN.GBx',
    createdAt: '2026-08-14T07:45:00Z',
    token: {
      name: 'PSN.GBx',
      symbol: 'PSN.GBx',
      mintAddress: 'XsJJ5x4Z9mN4pQ2sD5fH8jB1vC6xZ3aW9eR4tY7uIp',
      imageUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=PSNGBx',
      marketCap: '—',
      netVolume: '—',
      timeAgo: '33d',
    },
  },
  {
    id: '8',
    submissionType: 'verification',
    status: 'pending',
    isExpress: false,
    submitterWallet: '2xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    submitterX: '@4Stonk',
    tokenX: '@4Stonk',
    createdAt: '2026-09-16T13:09:00Z',
    token: {
      name: '4STONK',
      symbol: '4STONK',
      mintAddress: '7Gh4Qj3S9mN4pQ2sD5fH8jB1vC6xZ3aW9eR4tY7uIs',
      imageUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=4STONK',
      marketCap: '$38.1K',
      netVolume: 'B:$7.38K',
      timeAgo: '1d',
    },
    metrics: {
      mcFdv: '$38.1K / $38.1K',
      vol24h: '$95.8K',
      netVolume: 'B:$7.38K',
      liquidity: '$12.5K',
      organicScore: 45,
      likesSmartLikes: '1 / 0',
      smartFollowers: 15,
    },
    jupShield: ['Not Verified', 'Low Liquidity'],
    auditLog: [
      { date: '16 Sep 2026, 13:09', action: 'SUBMITTED', details: '@4Stonk · standard lane' },
      { date: '16 Sep 2026, 13:09', action: 'AUTO', details: 'Jup shield found 2 warnings' },
    ],
  },
  {
    id: '9',
    submissionType: 'verification',
    status: 'pending',
    isExpress: true,
    submitterWallet: '1xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    submitterX: '@NEXUS',
    tokenX: '@NEXUS',
    createdAt: '2026-09-16T12:00:00Z',
    token: {
      name: 'NEXUS',
      symbol: 'NXS',
      mintAddress: 'Nxs7kLm9pQrS4tUv2wYz8dC6eGhAaBbOoIiCcDd9nx',
      imageUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=NEXUS',
      marketCap: '$1.2M',
      netVolume: 'B:$156K',
      timeAgo: '6h',
    },
    metrics: {
      mcFdv: '$1.2M / $1.2M',
      vol24h: '$890K',
      netVolume: 'B:$156K',
      liquidity: '$245K',
      organicScore: 82,
      likesSmartLikes: '12 / 5',
      smartFollowers: 89,
    },
    jupShield: ['Verified'],
    auditLog: [
      { date: '16 Sep 2026, 12:00', action: 'SUBMITTED', details: '@NEXUS · express lane' },
      { date: '16 Sep 2026, 12:05', action: 'AUTO', details: 'Shield passed - no warnings' },
    ],
  },
  {
    id: '10',
    submissionType: 'verification',
    status: 'pending',
    isExpress: false,
    submitterWallet: '0xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    submitterX: '@COSMIC',
    tokenX: '@COSMIC',
    createdAt: '2026-09-16T11:30:00Z',
    token: {
      name: 'COSMIC',
      symbol: 'COSMIC',
      mintAddress: 'Cos9kLm3pQrS8tUv5wYz2dC6eGhAaBbOoIiCcDd1cos',
      imageUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=COSMIC',
      marketCap: '$567K',
      netVolume: 'B:$89K',
      timeAgo: '8h',
    },
    metrics: {
      mcFdv: '$567K / $567K',
      vol24h: '$445K',
      netVolume: 'B:$89K',
      liquidity: '$112K',
      organicScore: 68,
      likesSmartLikes: '8 / 3',
      smartFollowers: 45,
    },
    jupShield: ['Not Verified'],
    auditLog: [
      { date: '16 Sep 2026, 11:30', action: 'SUBMITTED', details: '@COSMIC · standard lane' },
    ],
  },
  {
    id: '11',
    submissionType: 'verification',
    status: 'pending',
    isExpress: false,
    submitterWallet: 'AxKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    submitterX: '@PULSE',
    tokenX: '@PULSE',
    createdAt: '2026-09-16T10:15:00Z',
    token: {
      name: 'PULSE',
      symbol: 'PULSE',
      mintAddress: 'Pul4kLm7pQrS2tUv8wYz5dC6eGhAaBbOoIiCcDd2pul',
      imageUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=PULSE',
      marketCap: '$89K',
      netVolume: 'B:$12K',
      timeAgo: '10h',
    },
    metrics: {
      mcFdv: '$89K / $89K',
      vol24h: '$67K',
      netVolume: 'B:$12K',
      liquidity: '$23K',
      organicScore: 54,
      likesSmartLikes: '3 / 1',
      smartFollowers: 28,
    },
    jupShield: ['Not Verified', 'Low Liquidity'],
    auditLog: [
      { date: '16 Sep 2026, 10:15', action: 'SUBMITTED', details: '@PULSE · standard lane' },
      { date: '16 Sep 2026, 10:15', action: 'AUTO', details: 'Jup shield found 1 warning' },
    ],
  },
  {
    id: '12',
    submissionType: 'verification',
    status: 'pending',
    isExpress: false,
    submitterWallet: 'BxKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    submitterX: '@VORTEX',
    tokenX: '@VORTEX',
    createdAt: '2026-09-16T09:45:00Z',
    token: {
      name: 'VORTEX',
      symbol: 'VTX',
      mintAddress: 'Vtx5kLm8pQrS3tUv9wYz6dC6eGhAaBbOoIiCcDd3vtx',
      imageUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=VORTEX',
      marketCap: '$234K',
      netVolume: 'B:$45K',
      timeAgo: '11h',
    },
    metrics: {
      mcFdv: '$234K / $234K',
      vol24h: '$189K',
      netVolume: 'B:$45K',
      liquidity: '$67K',
      organicScore: 71,
      likesSmartLikes: '6 / 2',
      smartFollowers: 52,
    },
    jupShield: ['Not Verified'],
    auditLog: [
      { date: '16 Sep 2026, 09:45', action: 'SUBMITTED', details: '@VORTEX · standard lane' },
    ],
  },
  {
    id: '13',
    submissionType: 'verification',
    status: 'pending',
    isExpress: true,
    submitterWallet: 'CxKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    submitterX: '@NOVA',
    tokenX: '@NOVA',
    createdAt: '2026-09-16T08:30:00Z',
    token: {
      name: 'NOVA',
      symbol: 'NOVA',
      mintAddress: 'Nva6kLm1pQrS4tUv0wYz7dC6eGhAaBbOoIiCcDd4nva',
      imageUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=NOVA',
      marketCap: '$1.8M',
      netVolume: 'B:$234K',
      timeAgo: '12h',
    },
    metrics: {
      mcFdv: '$1.8M / $1.8M',
      vol24h: '$1.2M',
      netVolume: 'B:$234K',
      liquidity: '$345K',
      organicScore: 88,
      likesSmartLikes: '15 / 8',
      smartFollowers: 112,
    },
    jupShield: ['Verified'],
    auditLog: [
      { date: '16 Sep 2026, 08:30', action: 'SUBMITTED', details: '@NOVA · express lane' },
      { date: '16 Sep 2026, 08:35', action: 'AUTO', details: 'Shield passed - no warnings' },
    ],
  },
  {
    id: '14',
    submissionType: 'verification',
    status: 'pending',
    isExpress: false,
    submitterWallet: 'DxKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    submitterX: '@ZENITH',
    tokenX: '@ZENITH',
    createdAt: '2026-09-16T07:15:00Z',
    token: {
      name: 'ZENITH',
      symbol: 'ZEN',
      mintAddress: 'Zen7kLm2pQrS5tUv1wYz8dC6eGhAaBbOoIiCcDd5zen',
      imageUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=ZENITH',
      marketCap: '$456K',
      netVolume: 'B:$78K',
      timeAgo: '13h',
    },
    metrics: {
      mcFdv: '$456K / $456K',
      vol24h: '$345K',
      netVolume: 'B:$78K',
      liquidity: '$89K',
      organicScore: 76,
      likesSmartLikes: '9 / 4',
      smartFollowers: 67,
    },
    jupShield: ['Not Verified'],
    auditLog: [
      { date: '16 Sep 2026, 07:15', action: 'SUBMITTED', details: '@ZENITH · standard lane' },
    ],
  },
  {
    id: '15',
    submissionType: 'verification',
    status: 'pending',
    isExpress: false,
    submitterWallet: 'ExKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    submitterX: '@FLUX',
    tokenX: '@FLUX',
    createdAt: '2026-09-16T06:00:00Z',
    token: {
      name: 'FLUX',
      symbol: 'FLUX',
      mintAddress: 'Flx8kLm3pQrS6tUv2wYz9dC6eGhAaBbOoIiCcDd6flx',
      imageUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=FLUX',
      marketCap: '$123K',
      netVolume: 'B:$34K',
      timeAgo: '14h',
    },
    metrics: {
      mcFdv: '$123K / $123K',
      vol24h: '$98K',
      netVolume: 'B:$34K',
      liquidity: '$45K',
      organicScore: 62,
      likesSmartLikes: '4 / 2',
      smartFollowers: 34,
    },
    jupShield: ['Not Verified', 'Low Liquidity'],
    auditLog: [
      { date: '16 Sep 2026, 06:00', action: 'SUBMITTED', details: '@FLUX · standard lane' },
    ],
  },
]

export const getSubmissionById = (id: string): Submission | undefined => {
  return demoSubmissions.find(s => s.id === id)
}