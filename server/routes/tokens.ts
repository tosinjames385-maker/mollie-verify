import { Router } from 'express'
import { prisma } from '../prisma'
import { optionalAuth, requireAuth, AuthRequest } from '../middleware/auth'

export const tokenRoutes = Router()

// Get all tokens
tokenRoutes.get('/', async (req, res) => {
  try {
    const tokens = await prisma.token.findMany({
      include: {
        _count: {
          select: { likes: true },
        },
        riskWarnings: {
          where: { isActive: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(tokens)
  } catch (error) {
    console.error('Error fetching tokens:', error)
    res.status(500).json({ error: 'Failed to fetch tokens' })
  }
})

// Search tokens
tokenRoutes.get('/search', async (req, res) => {
  try {
    const { q } = req.query

    if (!q || typeof q !== 'string') {
      return res.json([])
    }

    const searchTerm = q.toLowerCase()

    const tokens = await prisma.token.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { symbol: { contains: searchTerm, mode: 'insensitive' } },
          { mintAddress: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      include: {
        _count: {
          select: { likes: true },
        },
      },
      take: 10,
    })

    res.json(tokens)
  } catch (error) {
    console.error('Error searching tokens:', error)
    res.status(500).json({ error: 'Failed to search tokens' })
  }
})

// Get token by mint address
tokenRoutes.get('/:mintAddress', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { mintAddress } = req.params

    const token = await prisma.token.findUnique({
      where: { mintAddress },
      include: {
        _count: {
          select: { likes: true },
        },
        riskWarnings: {
          where: { isActive: true },
        },
        verifications: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        news: {
          where: { status: 'approved' },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!token) {
      return res.status(404).json({ error: 'Token not found' })
    }

    let userLiked = false
    if (req.walletAddress) {
      const like = await prisma.tokenLike.findUnique({
        where: {
          tokenId_walletAddress: {
            tokenId: token.id,
            walletAddress: req.walletAddress,
          },
        },
      })
      userLiked = !!like
    }

    res.json({ ...token, userLiked })
  } catch (error) {
    console.error('Error fetching token:', error)
    res.status(500).json({ error: 'Failed to fetch token' })
  }
})

// Create token
tokenRoutes.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const {
      name,
      symbol,
      mintAddress,
      imageUrl,
      description,
      website,
      twitter,
      telegram,
      discord,
      circulatingSupply,
    } = req.body

    if (!name || !symbol || !mintAddress) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const existing = await prisma.token.findUnique({
      where: { mintAddress },
    })

    if (existing) {
      return res.status(409).json({ error: 'Token already exists' })
    }

    const token = await prisma.token.create({
      data: {
        name,
        symbol,
        mintAddress,
        imageUrl,
        description,
        website,
        twitter,
        telegram,
        discord,
        circulatingSupply,
      },
    })

    res.status(201).json(token)
  } catch (error) {
    console.error('Error creating token:', error)
    res.status(500).json({ error: 'Failed to create token' })
  }
})

// Like token
tokenRoutes.post('/:mintAddress/like', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { mintAddress } = req.params

    const token = await prisma.token.findUnique({
      where: { mintAddress },
    })

    if (!token) {
      return res.status(404).json({ error: 'Token not found' })
    }

    const existing = await prisma.tokenLike.findUnique({
      where: {
        tokenId_walletAddress: {
          tokenId: token.id,
          walletAddress: req.walletAddress!,
        },
      },
    })

    if (existing) {
      return res.status(409).json({ error: 'Already liked' })
    }

    await prisma.tokenLike.create({
      data: {
        tokenId: token.id,
        walletAddress: req.walletAddress!,
      },
    })

    const likeCount = await prisma.tokenLike.count({
      where: { tokenId: token.id },
    })

    res.json({ liked: true, likeCount })
  } catch (error) {
    console.error('Error liking token:', error)
    res.status(500).json({ error: 'Failed to like token' })
  }
})

// Unlike token
tokenRoutes.delete('/:mintAddress/like', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { mintAddress } = req.params

    const token = await prisma.token.findUnique({
      where: { mintAddress },
    })

    if (!token) {
      return res.status(404).json({ error: 'Token not found' })
    }

    await prisma.tokenLike.delete({
      where: {
        tokenId_walletAddress: {
          tokenId: token.id,
          walletAddress: req.walletAddress!,
        },
      },
    })

    const likeCount = await prisma.tokenLike.count({
      where: { tokenId: token.id },
    })

    res.json({ liked: false, likeCount })
  } catch (error) {
    console.error('Error unliking token:', error)
    res.status(500).json({ error: 'Failed to unlike token' })
  }
})

// Submit verification
tokenRoutes.post('/:mintAddress/verify', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { mintAddress } = req.params
    const { notes } = req.body

    const token = await prisma.token.findUnique({
      where: { mintAddress },
    })

    if (!token) {
      return res.status(404).json({ error: 'Token not found' })
    }

    const submission = await prisma.verificationSubmission.create({
      data: {
        tokenId: token.id,
        submitterWallet: req.walletAddress!,
        submissionType: 'verification',
        notes,
      },
    })

    res.status(201).json(submission)
  } catch (error) {
    console.error('Error submitting verification:', error)
    res.status(500).json({ error: 'Failed to submit verification' })
  }
})

// Add news post
tokenRoutes.post('/:mintAddress/news', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { mintAddress } = req.params
    const { url, title, description, reason } = req.body

    if (!url) {
      return res.status(400).json({ error: 'URL is required' })
    }

    const token = await prisma.token.findUnique({
      where: { mintAddress },
    })

    if (!token) {
      return res.status(404).json({ error: 'Token not found' })
    }

    const newsPost = await prisma.newsPost.create({
      data: {
        tokenId: token.id,
        url,
        title,
        description,
        reason,
        submittedBy: req.walletAddress!,
      },
    })

    res.status(201).json(newsPost)
  } catch (error) {
    console.error('Error adding news:', error)
    res.status(500).json({ error: 'Failed to add news' })
  }
})

// Update token metadata
tokenRoutes.patch('/:mintAddress', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { mintAddress } = req.params
    const updates = req.body

    const token = await prisma.token.update({
      where: { mintAddress },
      data: updates,
    })

    res.json(token)
  } catch (error) {
    console.error('Error updating token:', error)
    res.status(500).json({ error: 'Failed to update token' })
  }
})
