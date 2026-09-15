import { Router } from 'express'
import { prisma } from '../prisma'

export const newsRoutes = Router()

// Get all news posts
newsRoutes.get('/', async (req, res) => {
  try {
    const { status } = req.query

    const where: any = {}

    if (status && typeof status === 'string') {
      where.status = status
    } else {
      where.status = 'approved'
    }

    const news = await prisma.newsPost.findMany({
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

    res.json(news)
  } catch (error) {
    console.error('Error fetching news:', error)
    res.status(500).json({ error: 'Failed to fetch news' })
  }
})
