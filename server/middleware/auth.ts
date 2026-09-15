import { Request, Response, NextFunction } from 'express'
import { prisma } from '../prisma'

export interface AuthRequest extends Request {
  walletAddress?: string
  isAdmin?: boolean
}

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const walletAddress = req.headers['x-wallet-address'] as string

  if (walletAddress) {
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
  const walletAddress = req.headers['x-wallet-address'] as string

  if (!walletAddress) {
    return res.status(401).json({ error: 'Wallet not connected' })
  }

  req.walletAddress = walletAddress

  const user = await prisma.user.findUnique({
    where: { walletAddress },
  })

  req.isAdmin = user?.isAdmin || false

  next()
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
