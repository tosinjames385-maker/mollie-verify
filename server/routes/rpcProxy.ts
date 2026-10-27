import { Router } from 'express'

const RPC_ENDPOINTS = [
  'https://solana-rpc.publicnode.com',
  'https://api.mainnet-beta.solana.com',
  'https://rpc.ping.solana.com',
]

const ALLOWED_METHODS = new Set([
  'getBalance',
  'getAccountInfo',
  'getMultipleAccounts',
  'getLatestBlockhash',
  'getFeeForMessage',
  'getMinimumBalanceForRentExemption',
  'getTokenAccountsByOwner',
  'getParsedTokenAccountsByOwner',
  'getSignatureStatuses',
  'simulateTransaction',
  'sendTransaction',
])

export const rpcProxyRoutes = Router()

rpcProxyRoutes.post('/', async (req, res) => {
  const payload = req.body?.jsonrpc ? req.body : req.body?.body
  const method = typeof payload?.method === 'string' ? payload.method : ''
  if (!payload?.jsonrpc || !method) {
    return res.status(400).json({ error: 'Invalid RPC request' })
  }
  if (!ALLOWED_METHODS.has(method)) {
    return res.status(403).json({ error: 'RPC method not allowed' })
  }

  for (const rpcUrl of RPC_ENDPOINTS) {
    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) continue
      const data = await response.json()
      if (data?.error) continue
      return res.status(200).json(data)
    } catch {
      continue
    }
  }

  return res.status(502).json({ error: 'All RPC endpoints failed' })
})
