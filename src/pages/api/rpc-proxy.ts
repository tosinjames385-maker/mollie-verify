import type { VercelRequest, VercelResponse } from '@vercel/node'

const RPC_ENDPOINTS = [
  'https://solana-rpc.publicnode.com',
  'https://api.mainnet-beta.solana.com',
  'https://rpc.ping.solana.com',
]

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept-Encoding, Accept')
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  const body = req.body?.jsonrpc ? req.body : req.body?.body

  if (!body || !body.jsonrpc) {
    return res.status(400).json({ error: 'Invalid request' })
  }
  
  // Try each RPC endpoint
  for (const rpcUrl of RPC_ENDPOINTS) {
    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      })
      
      if (!response.ok) {
        console.warn(`RPC ${rpcUrl} returned ${response.status}`)
        continue
      }
      
      const data = await response.json()
      return res.status(200).json(data)
    } catch (err) {
      console.warn(`RPC ${rpcUrl} failed:`, err)
    }
  }
  
  // All RPCs failed, return error
  return res.status(502).json({ error: 'All RPC endpoints failed' })
}
