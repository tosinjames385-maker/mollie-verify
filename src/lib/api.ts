const API_URL = '/api'

const MOCK_TOKENS = [
  {
    id: '1',
    name: 'Jupiter',
    symbol: 'JUP',
    mintAddress: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    imageUrl: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN/logo.png',
    verificationStatus: 'verified',
    organicActivity: 'high',
    _count: { likes: 248 },
    riskWarnings: [],
  },
  {
    id: '2',
    name: 'Bonk',
    symbol: 'BONK',
    mintAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    imageUrl: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
    verificationStatus: 'verified',
    organicActivity: 'high',
    _count: { likes: 512 },
    riskWarnings: [],
  },
  {
    id: '3',
    name: 'Raydium',
    symbol: 'RAY',
    mintAddress: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    imageUrl: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png',
    verificationStatus: 'pending',
    organicActivity: 'medium',
    _count: { likes: 89 },
    riskWarnings: [],
  },
  {
    id: '4',
    name: 'Samoyedcoin',
    symbol: 'SAMO',
    mintAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    imageUrl: null,
    verificationStatus: 'verified',
    organicActivity: 'medium',
    _count: { likes: 134 },
    riskWarnings: [{ id: '1', type: 'low_liquidity' }],
  },
  {
    id: '5',
    name: 'Orca',
    symbol: 'ORCA',
    mintAddress: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
    imageUrl: null,
    verificationStatus: 'pending',
    organicActivity: 'low',
    _count: { likes: 42 },
    riskWarnings: [],
  },
  {
    id: '6',
    name: 'Marinade Staked SOL',
    symbol: 'mSOL',
    mintAddress: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    imageUrl: null,
    verificationStatus: 'verified',
    organicActivity: 'high',
    _count: { likes: 307 },
    riskWarnings: [],
  },
]

interface FetchOptions extends RequestInit {
  walletAddress?: string
}

async function fetchAPI(endpoint: string, options: FetchOptions = {}) {
  const { walletAddress, ...fetchOptions } = options

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (walletAddress) {
    headers['x-wallet-address'] = walletAddress
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

// Token APIs
export const getTokens = () =>
  fetchAPI('/tokens').catch(() => MOCK_TOKENS)


export const searchTokens = (query: string) =>
  fetchAPI(`/tokens/search?q=${encodeURIComponent(query)}`)

export const getToken = (mintAddress: string, walletAddress?: string) =>
  fetchAPI(`/tokens/${mintAddress}`, { walletAddress })

export const createToken = (data: any, walletAddress: string) =>
  fetchAPI('/tokens', {
    method: 'POST',
    body: JSON.stringify(data),
    walletAddress,
  })

export const likeToken = (mintAddress: string, walletAddress: string) =>
  fetchAPI(`/tokens/${mintAddress}/like`, {
    method: 'POST',
    walletAddress,
  })

export const unlikeToken = (mintAddress: string, walletAddress: string) =>
  fetchAPI(`/tokens/${mintAddress}/like`, {
    method: 'DELETE',
    walletAddress,
  })

export const submitVerification = (
  mintAddress: string,
  notes: string,
  walletAddress: string
) =>
  fetchAPI(`/tokens/${mintAddress}/verify`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
    walletAddress,
  })

export const addNewsPost = (
  mintAddress: string,
  data: {
    url: string
    title?: string
    description?: string
    reason?: string
  },
  walletAddress: string
) =>
  fetchAPI(`/tokens/${mintAddress}/news`, {
    method: 'POST',
    body: JSON.stringify(data),
    walletAddress,
  })

export const updateToken = (
  mintAddress: string,
  data: any,
  walletAddress: string
) =>
  fetchAPI(`/tokens/${mintAddress}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    walletAddress,
  })

// Submission APIs
export const getSubmissions = (params?: { status?: string; type?: string }) => {
  const query = new URLSearchParams(params as any).toString()
  return fetchAPI(`/submissions${query ? `?${query}` : ''}`)
}

export const getSubmission = (id: string) => fetchAPI(`/submissions/${id}`)

// News APIs
export const getNews = (status?: string) => {
  const query = status ? `?status=${status}` : ''
  return fetchAPI(`/news${query}`)
}

// Admin APIs
export const updateSubmissionStatus = (
  id: string,
  data: { status: string; notes?: string },
  walletAddress: string
) =>
  fetchAPI(`/admin/submissions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    walletAddress,
  })

export const updateNewsStatus = (
  id: string,
  status: string,
  walletAddress: string
) =>
  fetchAPI(`/admin/news/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
    walletAddress,
  })

export const getAdminStats = (walletAddress: string) =>
  fetchAPI('/admin/stats', { walletAddress })
