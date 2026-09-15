import { Router } from 'express'
import { prisma } from '../prisma'
import { optionalAuth, AuthRequest } from '../middleware/auth'

export const submissionRoutes = Router()

// Get all submissions
submissionRoutes.get('/', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { status, type } = req.query

    const where: any = {}

    if (status && typeof status === 'string') {
      where.status = status
    }

    if (type && typeof type === 'string') {
      where.submissionType = type
    }

    const submissions = await prisma.verificationSubmission.findMany({
      where,
      include: {
        token: {
          select: {
            name: true,
            symbol: true,
            mintAddress: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(submissions)
  } catch (error) {
    console.error('Error fetching submissions:', error)
    res.status(500).json({ error: 'Failed to fetch submissions' })
  }
})

// Get submission by ID
submissionRoutes.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const submission = await prisma.verificationSubmission.findUnique({
      where: { id },
      include: {
        token: true,
      },
    })

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' })
    }

    res.json(submission)
  } catch (error) {
    console.error('Error fetching submission:', error)
    res.status(500).json({ error: 'Failed to fetch submission' })
  }
})
