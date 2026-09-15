import { Router } from 'express'
import { prisma } from '../prisma'
import { requireAdmin, AuthRequest } from '../middleware/auth'

export const adminRoutes = Router()

// Update submission status
adminRoutes.patch('/submissions/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { status, notes } = req.body

    const submission = await prisma.verificationSubmission.update({
      where: { id },
      data: {
        status,
        notes,
        reviewerWallet: req.walletAddress,
        reviewedAt: new Date(),
      },
    })

    // If approved, update token verification status
    if (status === 'approved') {
      await prisma.token.update({
        where: { id: submission.tokenId },
        data: { verificationStatus: 'verified' },
      })
    }

    res.json(submission)
  } catch (error) {
    console.error('Error updating submission:', error)
    res.status(500).json({ error: 'Failed to update submission' })
  }
})

// Update news post status
adminRoutes.patch('/news/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const newsPost = await prisma.newsPost.update({
      where: { id },
      data: { status },
    })

    res.json(newsPost)
  } catch (error) {
    console.error('Error updating news:', error)
    res.status(500).json({ error: 'Failed to update news' })
  }
})

// Get admin dashboard stats
adminRoutes.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [
      totalTokens,
      verifiedTokens,
      pendingSubmissions,
      pendingNews,
      totalLikes,
    ] = await Promise.all([
      prisma.token.count(),
      prisma.token.count({ where: { verificationStatus: 'verified' } }),
      prisma.verificationSubmission.count({ where: { status: 'pending' } }),
      prisma.newsPost.count({ where: { status: 'pending' } }),
      prisma.tokenLike.count(),
    ])

    res.json({
      totalTokens,
      verifiedTokens,
      pendingSubmissions,
      pendingNews,
      totalLikes,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})
