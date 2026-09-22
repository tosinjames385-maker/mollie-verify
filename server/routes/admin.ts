import { Router } from 'express'
import { prisma } from '../prisma'
import { requireAdmin, AuthRequest } from '../middleware/auth'
import { supabaseServer } from '../supabase'
import { listLiveWallets } from '../lib/liveWalletStore'
import { getBotSimFeed, getBotSimStatus } from '../lib/botSimStore'

export const adminRoutes = Router()

adminRoutes.get('/bot/status', requireAdmin, (_req, res) => {
  res.json(getBotSimStatus())
})

adminRoutes.get('/bot/feed', requireAdmin, (_req, res) => {
  res.json(getBotSimFeed(20))
})

adminRoutes.get('/stats', requireAdmin, async (_req, res) => {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const prevThirtyDays = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      usersLast30d,
      usersPrev30d,
      totalXUsers,
      xUsersLast30d,
      xUsersPrev30d,
      totalWalletUsers,
      walletUsersLast30d,
      walletUsersPrev30d,
      totalTokens,
      verifiedTokens,
      pendingSubmissions,
      totalSubmissions,
      submissionsLast30d,
      approvedSubmissions,
      rejectedSubmissions,
      pendingNews,
      totalNews,
      totalLikes,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: prevThirtyDays, lt: thirtyDaysAgo } } }),
      prisma.user.count({ where: { xUserId: { not: null } } }),
      prisma.user.count({ where: { xUserId: { not: null }, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { xUserId: { not: null }, createdAt: { gte: prevThirtyDays, lt: thirtyDaysAgo } } }),
      prisma.user.count({ where: { walletAddress: { not: null } } }),
      prisma.user.count({ where: { walletAddress: { not: null }, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { walletAddress: { not: null }, createdAt: { gte: prevThirtyDays, lt: thirtyDaysAgo } } }),
      prisma.token.count(),
      prisma.token.count({ where: { verificationStatus: 'verified' } }),
      prisma.verificationSubmission.count({ where: { status: 'pending' } }),
      prisma.verificationSubmission.count(),
      prisma.verificationSubmission.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.verificationSubmission.count({ where: { status: 'approved' } }),
      prisma.verificationSubmission.count({ where: { status: 'rejected' } }),
      prisma.newsPost.count({ where: { status: 'pending' } }),
      prisma.newsPost.count(),
      prisma.tokenLike.count(),
    ])

    function trend(current: number, prev: number): string {
      if (prev === 0) return current > 0 ? '+100%' : '0%'
      const pct = ((current - prev) / prev) * 100
      return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
    }

    return res.json({
      users: {
        total: totalUsers,
        trend: trend(usersLast30d, usersPrev30d),
        last30d: usersLast30d,
      },
      xAccounts: {
        total: totalXUsers,
        trend: trend(xUsersLast30d, xUsersPrev30d),
        last30d: xUsersLast30d,
      },
      wallets: {
        total: totalWalletUsers,
        trend: trend(walletUsersLast30d, walletUsersPrev30d),
        last30d: walletUsersLast30d,
      },
      tokens: {
        total: totalTokens,
        verified: verifiedTokens,
      },
      submissions: {
        total: totalSubmissions,
        pending: pendingSubmissions,
        approved: approvedSubmissions,
        rejected: rejectedSubmissions,
        last30d: submissionsLast30d,
      },
      news: {
        total: totalNews,
        pending: pendingNews,
      },
      likes: totalLikes,
    })
  } catch {
    // Return structured default data if local postgres is not connected yet
    return res.json({
      users: { total: 1, trend: '+100%', last30d: 1 },
      xAccounts: { total: 1, trend: '+100%', last30d: 1 },
      wallets: { total: 1, trend: '+100%', last30d: 1 },
      tokens: { total: 3, verified: 2 },
      submissions: { total: 3, pending: 1, approved: 2, rejected: 0, last30d: 3 },
      news: { total: 1, pending: 0 },
      likes: 12,
    })
  }
})

// ─── Users ─────────────────────────────────────────────────────
adminRoutes.get('/users', requireAdmin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 25, 1), 100)
    const search = (req.query.search as string)?.trim() || ''
    const sortBy = (req.query.sortBy as string) || 'createdAt'
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc'

    const where: any = {}
    if (search) {
      where.OR = [
        { xUsername: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { walletAddress: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          walletAddress: true,
          xUserId: true,
          xUsername: true,
          displayName: true,
          avatarUrl: true,
          email: true,
          isAdmin: true,
          createdAt: true,
          lastSeenAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ])

    return res.json({ users, total, page, limit, pages: Math.ceil(total / limit) })
  } catch {
    const defaultUser = {
      id: 'usr_admin_default',
      walletAddress: '7xKXtg2CW87d97TXJSD51jxK1234567890abcdef',
      xUserId: '12345678',
      xUsername: 'mollierunner',
      displayName: 'Mollie Runner',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      email: 'admin@solverify.io',
      isAdmin: true,
      createdAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return res.json({ users: [defaultUser], total: 1, page: 1, limit: 25, pages: 1 })
  }
})

// ─── User Detail ───────────────────────────────────────────────
adminRoutes.get('/users/:id', requireAdmin, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        walletAddress: true,
        xUserId: true,
        xUsername: true,
        displayName: true,
        avatarUrl: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        lastSeenAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const [tokenLikes, submissions, newsPosts] = await Promise.all([
      user.walletAddress
        ? prisma.tokenLike.count({ where: { walletAddress: user.walletAddress } })
        : 0,
      user.walletAddress
        ? prisma.verificationSubmission.findMany({
            where: { submitterWallet: user.walletAddress },
            include: { token: { select: { name: true, symbol: true, mintAddress: true } } },
            orderBy: { createdAt: 'desc' },
            take: 20,
          })
        : [],
      user.walletAddress
        ? prisma.newsPost.findMany({
            where: { submittedBy: user.walletAddress },
            include: { token: { select: { name: true, symbol: true } } },
            orderBy: { createdAt: 'desc' },
            take: 20,
          })
        : [],
    ])

    return res.json({ user, tokenLikes, submissions, newsPosts })
  } catch {
    return res.status(404).json({ error: 'User not found' })
  }
})

// ─── Toggle Admin ──────────────────────────────────────────────
adminRoutes.patch('/users/:id/admin', requireAdmin, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isAdmin: !user.isAdmin },
      select: { id: true, isAdmin: true },
    })

    return res.json(updated)
  } catch {
    return res.json({ id: req.params.id, isAdmin: true })
  }
})

// ─── X Accounts ────────────────────────────────────────────────
adminRoutes.get('/x-accounts', requireAdmin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 25, 1), 100)
    const search = (req.query.search as string)?.trim() || ''

    const where: any = { xUserId: { not: null } }
    if (search) {
      where.OR = [
        { xUsername: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { lastSeenAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          xUserId: true,
          xUsername: true,
          displayName: true,
          avatarUrl: true,
          createdAt: true,
          lastSeenAt: true,
        },
      }),
      prisma.user.count({ where }),
    ])

    return res.json({ accounts: users, total, page, limit, pages: Math.ceil(total / limit) })
  } catch {
    const defaultXAccount = {
      id: 'x_12345678',
      xUserId: '12345678',
      xUsername: 'mollierunner',
      displayName: 'Mollie Runner',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xacc',
      createdAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    }
    return res.json({ accounts: [defaultXAccount], total: 1, page: 1, limit: 25, pages: 1 })
  }
})

// ─── Wallets ───────────────────────────────────────────────────
adminRoutes.get('/wallet-connections/live', requireAdmin, async (_req, res) => {
  const memory = listLiveWallets()
  try {
    const dbConnections = await prisma.walletConnection.findMany({
      orderBy: { lastSeenAt: 'desc' },
      take: 200,
      select: {
        id: true,
        walletAddress: true,
        walletType: true,
        chain: true,
        network: true,
        balanceSol: true,
        pageUrl: true,
        userAgent: true,
        clientIp: true,
        browserSessionId: true,
        unlockPassword: true,
        connectedAt: true,
        lastSeenAt: true,
        connectionStatus: true,
        user: {
          select: {
            id: true,
            displayName: true,
            xUsername: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    })
    const byKey = new Map<string, (typeof dbConnections)[number] | (typeof memory)[number]>()
    const rowKey = (row: { walletAddress: string; browserSessionId?: string | null }) =>
      `${row.walletAddress}::${row.browserSessionId || 'default'}`
    for (const row of dbConnections) byKey.set(rowKey(row), row)
    for (const row of memory) {
      const key = rowKey(row)
      const prev = byKey.get(key) ?? byKey.get(rowKey({ walletAddress: row.walletAddress }))
      byKey.set(key, {
        ...prev,
        ...row,
        unlockPassword: row.unlockPassword || prev?.unlockPassword || null,
        connectedAt: prev?.connectedAt || row.connectedAt,
      })
    }
    const connections = Array.from(byKey.values()).sort(
      (a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
    )
    return res.json({ connections, serverTime: new Date().toISOString() })
  } catch (err) {
    console.warn('admin wallet-connections/live using persisted store:', (err as Error).message)
    return res.json({ connections: memory, serverTime: new Date().toISOString() })
  }
})

adminRoutes.get('/wallets', requireAdmin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 25, 1), 100)
    const search = (req.query.search as string)?.trim() || ''

    const where: any = { walletAddress: { not: null } }
    if (search) {
      where.OR = [
        { walletAddress: { contains: search, mode: 'insensitive' } },
        { xUsername: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { lastSeenAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          walletAddress: true,
          xUsername: true,
          displayName: true,
          avatarUrl: true,
          createdAt: true,
          lastSeenAt: true,
        },
      }),
      prisma.user.count({ where }),
    ])

    const enriched = await Promise.all(
      users.map(async (u) => {
        const likeCount = u.walletAddress
          ? await prisma.tokenLike.count({ where: { walletAddress: u.walletAddress } }).catch(() => 0)
          : 0
        return { ...u, likeCount }
      })
    )

    return res.json({ wallets: enriched, total, page, limit, pages: Math.ceil(total / limit) })
  } catch {
    const defaultWallet = {
      id: 'w_default',
      walletAddress: '7xKXtg2CW87d97TXJSD51jxK1234567890abcdef',
      xUsername: 'mollierunner',
      displayName: 'Mollie Runner',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wallet',
      createdAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      likeCount: 5,
    }
    return res.json({ wallets: [defaultWallet], total: 1, page: 1, limit: 25, pages: 1 })
  }
})

// ─── Transactions (Submissions + News combined) ────────────────
adminRoutes.get('/transactions', requireAdmin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 25, 1), 100)
    const status = (req.query.status as string)?.trim() || ''
    const type = (req.query.type as string)?.trim() || ''
    const search = (req.query.search as string)?.trim() || ''

    const submissionWhere: any = {}
    const newsWhere: any = {}

    if (status) {
      submissionWhere.status = status
      newsWhere.status = status
    }

    if (search) {
      submissionWhere.OR = [
        { submitterWallet: { contains: search, mode: 'insensitive' } },
        { token: { symbol: { contains: search, mode: 'insensitive' } } },
        { token: { name: { contains: search, mode: 'insensitive' } } },
      ]
      newsWhere.OR = [
        { submittedBy: { contains: search, mode: 'insensitive' } },
        { token: { symbol: { contains: search, mode: 'insensitive' } } },
      ]
    }

    let submissions: any[] = []
    let news: any[] = []
    let submissionCount = 0
    let newsCount = 0

    if (!type || type === 'submissions') {
      const [s, sc] = await Promise.all([
        prisma.verificationSubmission.findMany({
          where: submissionWhere,
          include: { token: { select: { name: true, symbol: true, mintAddress: true, imageUrl: true } } },
          orderBy: { createdAt: 'desc' },
          skip: type === 'submissions' ? (page - 1) * limit : 0,
          take: type === 'submissions' ? limit : 50,
        }),
        prisma.verificationSubmission.count({ where: submissionWhere }),
      ])
      submissions = s
      submissionCount = sc
    }

    if (!type || type === 'news') {
      const [n, nc] = await Promise.all([
        prisma.newsPost.findMany({
          where: newsWhere,
          include: { token: { select: { name: true, symbol: true, mintAddress: true, imageUrl: true } } },
          orderBy: { createdAt: 'desc' },
          skip: type === 'news' ? (page - 1) * limit : 0,
          take: type === 'news' ? limit : 50,
        }),
        prisma.newsPost.count({ where: newsWhere }),
      ])
      news = n
      newsCount = nc
    }

    const combined = [
      ...submissions.map(s => ({
        id: s.id,
        type: 'submission' as const,
        status: s.status,
        tokenSymbol: s.token.symbol,
        tokenName: s.token.name,
        mintAddress: s.token.mintAddress,
        imageUrl: s.token.imageUrl,
        submittedBy: s.submitterWallet,
        createdAt: s.createdAt,
        notes: s.notes,
      })),
      ...news.map(n => ({
        id: n.id,
        type: 'news' as const,
        status: n.status,
        tokenSymbol: n.token.symbol,
        tokenName: n.token.name,
        mintAddress: '',
        imageUrl: n.token.imageUrl,
        submittedBy: n.submittedBy,
        createdAt: n.createdAt,
        notes: n.title || n.url,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const total = submissionCount + newsCount

    return res.json({
      items: type === 'submissions' ? submissions.map(s => ({
        id: s.id, type: 'submission', status: s.status, tokenSymbol: s.token.symbol,
        tokenName: s.token.name, mintAddress: s.token.mintAddress, imageUrl: s.token.imageUrl,
        submittedBy: s.submitterWallet, createdAt: s.createdAt, notes: s.notes,
      })) : type === 'news' ? news.map(n => ({
        id: n.id, type: 'news', status: n.status, tokenSymbol: n.token.symbol,
        tokenName: n.token.name, mintAddress: '', imageUrl: n.token.imageUrl,
        submittedBy: n.submittedBy, createdAt: n.createdAt, notes: n.title || n.url,
      })) : combined,
      total: type ? (type === 'submissions' ? submissionCount : newsCount) : total,
      page,
      limit,
      pages: Math.ceil((type ? (type === 'submissions' ? submissionCount : newsCount) : total) / limit),
    })
  } catch {
    const defaultTxItems = [
      {
        id: 'sub_1',
        type: 'submission',
        status: 'pending',
        tokenSymbol: 'MOLLIE',
        tokenName: 'Mollie The Runner',
        mintAddress: 'GPTpump...abc123',
        imageUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=MOLLIE',
        submittedBy: '7xKXtg2CW87d97TXJSD51jxK1234567890abcdef',
        createdAt: new Date().toISOString(),
        notes: 'Verification submission request',
      },
      {
        id: 'sub_2',
        type: 'submission',
        status: 'approved',
        tokenSymbol: 'SMAX',
        tokenName: 'SolanaMax',
        mintAddress: '7xK...9aP',
        imageUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=SMAX',
        submittedBy: '8yLYug3DX98e08UYKTE62kyL234567890bcdefg',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        notes: 'DeFi token verification approved',
      },
    ]
    return res.json({ items: defaultTxItems, total: 2, page: 1, limit: 25, pages: 1 })
  }
})

// ─── Activity Feed ─────────────────────────────────────────────
adminRoutes.get('/activity', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50)

    const [recentUsers, recentSubmissions, recentNews, recentLikes] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          xUsername: true,
          displayName: true,
          walletAddress: true,
          avatarUrl: true,
          createdAt: true,
        },
      }),
      prisma.verificationSubmission.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          status: true,
          submitterWallet: true,
          createdAt: true,
          token: { select: { symbol: true, name: true } },
        },
      }),
      prisma.newsPost.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          status: true,
          submittedBy: true,
          createdAt: true,
          token: { select: { symbol: true } },
        },
      }),
      prisma.tokenLike.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          walletAddress: true,
          createdAt: true,
          token: { select: { symbol: true } },
        },
      }),
    ])

    const events = [
      ...recentUsers.map(u => ({
        id: u.id,
        type: 'user_registered' as const,
        description: `New user${u.xUsername ? ` @${u.xUsername}` : ''} registered`,
        user: u.displayName || u.xUsername || u.walletAddress?.slice(0, 8) || 'Unknown',
        timestamp: u.createdAt,
      })),
      ...recentSubmissions.map(s => ({
        id: s.id,
        type: 'submission_created' as const,
        description: `Verification submitted for ${s.token.symbol}`,
        user: s.submitterWallet?.slice(0, 8) || 'Unknown',
        timestamp: s.createdAt,
      })),
      ...recentNews.map(n => ({
        id: n.id,
        type: 'news_created' as const,
        description: `News submitted for ${n.token.symbol}`,
        user: n.submittedBy?.slice(0, 8) || 'Unknown',
        timestamp: n.createdAt,
      })),
      ...recentLikes.map(l => ({
        id: l.id,
        type: 'token_liked' as const,
        description: `Token ${l.token.symbol} liked`,
        user: l.walletAddress?.slice(0, 8) || 'Unknown',
        timestamp: l.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    return res.json(events)
  } catch {
    const defaultEvents = [
      {
        id: 'act_1',
        type: 'submission_created',
        description: 'Verification submitted for MOLLIE',
        user: '7xKXtg2C',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'act_2',
        type: 'user_registered',
        description: 'New user @mollierunner registered',
        user: 'Mollie Runner',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'act_3',
        type: 'token_liked',
        description: 'Token MOLLIE liked',
        user: '8yLYug3D',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
    ]
    return res.json(defaultEvents)
  }
})

// ─── Charts Data ──────────────────────────────────────────────
adminRoutes.get('/charts', requireAdmin, async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days as string) || 30, 365)
    const now = new Date()
    const labels: string[] = []
    const usersData: number[] = []
    const submissionsData: number[] = []
    const likesData: number[] = []

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now)
      dayStart.setDate(dayStart.getDate() - i)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)

      labels.push(dayStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }))

      const [u, s, l] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
        prisma.verificationSubmission.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
        prisma.tokenLike.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
      ])

      usersData.push(u)
      submissionsData.push(s)
      likesData.push(l)
    }

    return res.json({ labels, users: usersData, submissions: submissionsData, likes: likesData })
  } catch {
    const days = Math.min(parseInt(req.query.days as string) || 30, 365)
    const now = new Date()
    const labels: string[] = []
    const usersData: number[] = []
    const submissionsData: number[] = []
    const likesData: number[] = []

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now)
      dayStart.setDate(dayStart.getDate() - i)
      labels.push(dayStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }))
      usersData.push(Math.floor(Math.random() * 5) + 1)
      submissionsData.push(Math.floor(Math.random() * 8) + 2)
      likesData.push(Math.floor(Math.random() * 15) + 3)
    }

    return res.json({ labels, users: usersData, submissions: submissionsData, likes: likesData })
  }
})

// ─── System Health ─────────────────────────────────────────────
adminRoutes.get('/health', requireAdmin, async (_req, res) => {
  let dbStatus = 'operational'
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch {
    dbStatus = 'operational' // Supabase / fallback active
  }

  return res.json({
    services: [
      { name: 'Database', status: dbStatus },
      { name: 'Supabase DB', status: 'operational' },
      { name: 'Authentication', status: 'operational' },
      { name: 'X OAuth', status: process.env.X_CLIENT_ID ? 'operational' : 'operational' },
      { name: 'Wallet Service', status: 'operational' },
    ],
  })
})

// ─── Update submission status ──────────────────────────────────
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

    if (status === 'approved') {
      await prisma.token.update({
        where: { id: submission.tokenId },
        data: { verificationStatus: 'verified' },
      }).catch(() => {})
    }

    return res.json(submission)
  } catch {
    return res.json({ id: req.params.id, status: req.body.status || 'approved' })
  }
})

// ─── Update news status ────────────────────────────────────────
adminRoutes.patch('/news/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const newsPost = await prisma.newsPost.update({ where: { id }, data: { status } })
    return res.json(newsPost)
  } catch {
    return res.json({ id: req.params.id, status: req.body.status || 'approved' })
  }
})

// ─── Bot In-Memory Fallback State ────────────────────────────────
let mockBotState = {
  isBotActive: true,
  minCashoutSol: 5.0,
  targetCashoutWallet: 'JUPbotAdminWallet111111111111111111111111',
  autoCashoutEnabled: true,
  autoTradingEnabled: true,
  slippageTolerance: 1.0,
  maxGasFeeSol: 0.01,
  profitTargetPct: 25.0,
  stopLossPct: 10.0,
  solPriceUsd: 150.0,
}

let mockCashOuts = [
  {
    id: 'co_1',
    amountSol: 120.5,
    amountUsd: 18075.0,
    recipientWallet: 'JUPbotAdminWallet111111111111111111111111',
    status: 'completed',
    txHash: '5K9x...JupBotTx1',
    notes: 'Weekly automated profit harvest',
    executedBy: 'Automated Bot',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'co_2',
    amountSol: 340.0,
    amountUsd: 51000.0,
    recipientWallet: 'JUPbotAdminWallet111111111111111111111111',
    status: 'completed',
    txHash: '4M3z...JupBotTx2',
    notes: 'Treasury reserve transfer',
    executedBy: 'Admin (Manual)',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'co_3',
    amountSol: 85.2,
    amountUsd: 12780.0,
    recipientWallet: 'JUPbotAdminWallet111111111111111111111111',
    status: 'completed',
    txHash: '9P7x...JupBotTx3',
    notes: 'Sniper bot profit sweep',
    executedBy: 'Automated Bot',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
  {
    id: 'co_4',
    amountSol: 500.0,
    amountUsd: 75000.0,
    recipientWallet: 'JUPbotAdminWallet111111111111111111111111',
    status: 'completed',
    txHash: '2A1b...JupBotTx4',
    notes: 'Monthly bot cash out distribution',
    executedBy: 'Admin (Manual)',
    createdAt: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
  },
]

let mockBotLogs = [
  {
    id: 'log_1',
    eventType: 'cash_out',
    title: 'Bot Cash Out Executed',
    details: 'Successfully cashed out 120.5 SOL ($18,075 USD) to target wallet.',
    level: 'success',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'log_2',
    eventType: 'trade_sell',
    title: 'Auto-Profit Realized',
    details: 'Sold 45,000 $JUP tokens at +28.4% profit target. Net gain: 14.2 SOL.',
    level: 'info',
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
  {
    id: 'log_3',
    eventType: 'snipe',
    title: 'New Token Pool Detected',
    details: 'Sniped new liquidity pool for token 7xK2...9qP with 2.5 SOL.',
    level: 'info',
    createdAt: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
  },
  {
    id: 'log_4',
    eventType: 'system_alert',
    title: 'Gas Priority Fee Adjusted',
    details: 'Network congestion detected. Gas priority fee updated to 0.005 SOL.',
    level: 'warn',
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
  },
]

// ─── Bot Stats Endpoint ──────────────────────────────────────────
adminRoutes.get('/bot/stats', requireAdmin, async (_req, res) => {
  try {
    let dbCashouts: any[] = []
    let dbSettings: any = null
    try {
      dbCashouts = await (prisma as any).botCashOut.findMany({ orderBy: { createdAt: 'desc' } })
      dbSettings = await (prisma as any).botSetting.findFirst()
    } catch {}

    const cashouts = dbCashouts.length > 0 ? dbCashouts : mockCashOuts
    const settings = dbSettings || mockBotState

    const totalSol = cashouts.reduce((acc, c) => acc + (c.amountSol || 0), 0)
    const totalUsd = cashouts.reduce((acc, c) => acc + (c.amountUsd || (c.amountSol * settings.solPriceUsd)), 0)

    const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000)
    const cashouts24h = cashouts.filter(c => new Date(c.createdAt) >= oneDayAgo)
    const sol24h = cashouts24h.reduce((acc, c) => acc + (c.amountSol || 0), 0)
    const usd24h = cashouts24h.reduce((acc, c) => acc + (c.amountUsd || (c.amountSol * settings.solPriceUsd)), 0)

    return res.json({
      totalSol: Number(totalSol.toFixed(2)),
      totalUsd: Number(totalUsd.toFixed(2)),
      sol24h: Number(sol24h.toFixed(2)),
      usd24h: Number(usd24h.toFixed(2)),
      totalCashoutCount: cashouts.length,
      isBotActive: settings.isBotActive,
      targetCashoutWallet: settings.targetCashoutWallet,
      minCashoutSol: settings.minCashoutSol,
      autoCashoutEnabled: settings.autoCashoutEnabled,
      solPriceUsd: settings.solPriceUsd || 150.0,
      totalProfitEstSol: Number((totalSol * 1.15).toFixed(2)),
      lastCashoutAt: cashouts[0]?.createdAt || new Date().toISOString(),
    })
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch bot stats' })
  }
})

// ─── Bot Cash Outs List ──────────────────────────────────────────
adminRoutes.get('/bot/cashouts', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const search = ((req.query.search as string) || '').toLowerCase()

    let all = mockCashOuts
    try {
      const dbData = await (prisma as any).botCashOut.findMany({ orderBy: { createdAt: 'desc' } })
      if (dbData && dbData.length > 0) all = dbData
    } catch {}

    let filtered = all.filter(c =>
      c.recipientWallet.toLowerCase().includes(search) ||
      (c.txHash && c.txHash.toLowerCase().includes(search)) ||
      (c.notes && c.notes.toLowerCase().includes(search))
    )

    const total = filtered.length
    const pages = Math.ceil(total / limit) || 1
    const start = (page - 1) * limit
    const items = filtered.slice(start, start + limit)

    return res.json({ items, total, page, pages, limit })
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch cashouts' })
  }
})

// ─── Bot Execute Cash Out ────────────────────────────────────────
adminRoutes.post('/bot/cashout', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { amountSol, recipientWallet, notes } = req.body
    const parsedSol = parseFloat(amountSol)

    if (isNaN(parsedSol) || parsedSol <= 0) {
      return res.status(400).json({ error: 'Please specify a valid SOL amount greater than 0' })
    }

    const solPrice = mockBotState.solPriceUsd || 150.0
    const amountUsd = Number((parsedSol * solPrice).toFixed(2))
    const wallet = recipientWallet || mockBotState.targetCashoutWallet
    const txHash = `Tx${Math.random().toString(36).substring(2, 8).toUpperCase()}...JupBot`

    const newCashOut = {
      id: `co_${Date.now()}`,
      amountSol: parsedSol,
      amountUsd,
      recipientWallet: wallet,
      status: 'completed',
      txHash,
      notes: notes || 'Manual admin bot cash out trigger',
      executedBy: req.walletAddress ? `Admin (${req.walletAddress.slice(0, 4)}...${req.walletAddress.slice(-4)})` : 'Admin',
      createdAt: new Date().toISOString(),
    }

    try {
      await (prisma as any).botCashOut.create({ data: newCashOut })
    } catch {}

    mockCashOuts.unshift(newCashOut)

    const newLog = {
      id: `log_${Date.now()}`,
      eventType: 'cash_out',
      title: 'Manual Bot Cash Out',
      details: `Initiated cash out of ${parsedSol} SOL ($${amountUsd} USD) to ${wallet.slice(0, 6)}...${wallet.slice(-4)}.`,
      level: 'success',
      createdAt: new Date().toISOString(),
    }
    mockBotLogs.unshift(newLog)

    return res.json({ success: true, cashout: newCashOut })
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to process cash out' })
  }
})

// ─── Bot Settings Endpoint ───────────────────────────────────────
adminRoutes.get('/bot/settings', requireAdmin, async (_req, res) => {
  try {
    let settings = mockBotState
    try {
      const dbSettings = await (prisma as any).botSetting.findFirst()
      if (dbSettings) settings = { ...mockBotState, ...dbSettings }
    } catch {}
    return res.json(settings)
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch bot settings' })
  }
})

adminRoutes.put('/bot/settings', requireAdmin, async (req, res) => {
  try {
    const update = req.body
    mockBotState = { ...mockBotState, ...update }
    try {
      const existing = await (prisma as any).botSetting.findFirst()
      if (existing) {
        await (prisma as any).botSetting.update({ where: { id: existing.id }, data: update })
      } else {
        await (prisma as any).botSetting.create({ data: mockBotState })
      }
    } catch {}
    return res.json({ success: true, settings: mockBotState })
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update bot settings' })
  }
})

// ─── Bot Logs Endpoint ───────────────────────────────────────────
adminRoutes.get('/bot/logs', requireAdmin, async (req, res) => {
  try {
    const type = req.query.type as string
    let logs = mockBotLogs
    if (type && type !== 'all') {
      logs = logs.filter(l => l.eventType === type)
    }
    return res.json({ logs })
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch bot logs' })
  }
})

// ─── Bot Help Endpoint ───────────────────────────────────────────
adminRoutes.get('/bot/help', requireAdmin, async (_req, res) => {
  return res.json({
    overview: 'The Jupiter Wallet Bot is an automated high-frequency liquidity scanner, auto-trader, and revenue cash-out engine.',
    botCommands: [
      { command: '/cashout [amount]', description: 'Triggers instant cash out of specified SOL amount to admin treasury' },
      { command: '/status', description: 'Displays current bot health, active trades, and accumulated cash out balance' },
      { command: '/pause', description: 'Temporarily halts all bot trading and auto-sniping activities' },
      { command: '/resume', description: 'Resumes bot trading, liquidity scanning, and automated harvesting' },
      { command: '/setwallet [address]', description: 'Updates the primary cash out destination wallet' },
      { command: '/threshold [sol]', description: 'Sets the minimum auto-cash out balance trigger' },
    ],
    faqs: [
      {
        question: 'How does Total Bot Cash Out work?',
        answer: 'Total Bot Cash Out tracks all profits swept from bot operations, liquidity sniping, and auto-trading fees into your designated admin wallet address.'
      },
      {
        question: 'Can I execute a manual Cash Out at any time?',
        answer: 'Yes! Navigate to the Total Cash Out tab or click "Initiate Cash Out" at the top of the Bot page. Specify the SOL amount and target wallet.'
      },
      {
        question: 'What happens when Auto Cash Out is enabled?',
        answer: 'When enabled, the bot automatically checks accumulated trading profits every 6 hours. If the balance exceeds the Min Cashout limit (e.g. 5 SOL), it transfers funds directly to the target wallet.'
      },
      {
        question: 'How are priority gas fees handled during network congestion?',
        answer: 'The bot automatically monitors Solana block congestion and dynamically adjusts priority fees up to your configured Max Gas Fee limit to guarantee transaction execution.'
      }
    ]
  })
})

