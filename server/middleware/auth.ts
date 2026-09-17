import { Request, Response, NextFunction } from 'express'
import { prisma } from '../prisma'

export interface AuthRequest extends Request {
  walletAddress?: string
  userId?: string
  isAdmin?: boolean
}

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const session = req.session as any

  if (session.userId) {
    req.userId = session.userId

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    })

    if (user) {
      req.walletAddress = user.walletAddress || undefined
      req.isAdmin = user.isAdmin
    }
  }

  const walletAddress = req.headers['x-wallet-address'] as string

  if (walletAddress && !req.userId) {
    req.walletAddress = walletAddress

    const user = await prisma.user.findUnique({
      where: { walletAddress },
    })

    req.isAdmin = user?.isAdmin || false
  }

  next()
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const session = req.session as any

  if (session.userId) {
    req.userId = session.userId

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    })

    if (user) {
      req.walletAddress = user.walletAddress || undefined
      req.isAdmin = user.isAdmin
      return next()
    }
  }

  const walletAddress = req.headers['x-wallet-address'] as string

  if (walletAddress) {
    req.walletAddress = walletAddress

    const user = await prisma.user.findUnique({
      where: { walletAddress },
    })

    req.isAdmin = user?.isAdmin || false

    return next()
  }

  return res.status(401).json({ error: 'Not authenticated' })
}

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  await requireAuth(req, res, () => {})

  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' })
  }

  next()
}
