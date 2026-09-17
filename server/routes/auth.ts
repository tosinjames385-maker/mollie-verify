import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import { prisma } from '../prisma'

const router = Router()

const X_CLIENT_ID = process.env.X_CLIENT_ID || ''
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET || ''
const X_REDIRECT_URI = process.env.X_REDIRECT_URI || 'http://127.0.0.1:5173/auth/x/callback'
const X_SCOPES = 'tweet.read users.read offline.access'

function getFrontendUrl(): string {
  const origin = process.env.FRONTEND_URL || 'http://127.0.0.1:5173'
  return origin
}

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url')
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url')
}

function generateState(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Initiate X OAuth flow
router.get('/x', (req: Request, res: Response) => {
  if (!X_CLIENT_ID) {
    return res.status(500).json({ error: 'X OAuth not configured. Missing X_CLIENT_ID.' })
  }

  const state = generateState()
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = generateCodeChallenge(codeVerifier)

  const session = req.session as any
  session.xOAuthState = state
  session.xCodeVerifier = codeVerifier

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: X_CLIENT_ID,
    redirect_uri: X_REDIRECT_URI,
    scope: X_SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`
  res.json({ url: authUrl })
})

// Handle X OAuth callback
router.get('/x/callback', async (req: Request, res: Response) => {
  const { code, state, error, error_description } = req.query
  const session = req.session as any
  const frontendUrl = getFrontendUrl()

  if (error) {
    const errorParam = encodeURIComponent(error as string)
    const descParam = encodeURIComponent(error_description as string || 'Authorization was denied.')
    return res.redirect(`${frontendUrl}/auth/x/callback?error=${errorParam}&description=${descParam}`)
  }

  if (!code || !state) {
    return res.redirect(`${frontendUrl}/auth/x/callback?error=missing_params&description=Missing authorization code or state.`)
  }

  if (!session.xOAuthState || session.xOAuthState !== state) {
    return res.redirect(`${frontendUrl}/auth/x/callback?error=invalid_state&description=Invalid or expired state parameter.`)
  }

  const codeVerifier = session.xCodeVerifier
  delete session.xOAuthState
  delete session.xCodeVerifier

  try {
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: X_REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData)
      return res.redirect(`${frontendUrl}/auth/x/callback?error=token_exchange_failed&description=Failed to exchange authorization code.`)
    }

    const { access_token, refresh_token, expires_in } = tokenData

    const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,name,username', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    })

    const userData = await userResponse.json()

    if (!userResponse.ok || !userData.data) {
      console.error('Failed to fetch user:', userData)
      return res.redirect(`${frontendUrl}/auth/x/callback?error=user_fetch_failed&description=Failed to retrieve user information from X.`)
    }

    const xUser = userData.data
    const xUserId = xUser.id
    const xUsername = xUser.username
    const displayName = xUser.name
    const avatarUrl = xUser.profile_image_url

    const user = await prisma.user.upsert({
      where: { xUserId },
      update: {
        xUsername,
        displayName,
        avatarUrl,
        lastSeenAt: new Date(),
      },
      create: {
        xUserId,
        xUsername,
        displayName,
        avatarUrl,
      },
    })

    session.userId = user.id
    session.xAccessToken = access_token
    session.xRefreshToken = refresh_token
    session.xTokenExpiresAt = Date.now() + (expires_in * 1000)

    const successParams = new URLSearchParams({
      userId: user.id,
      username: xUsername,
      displayName: displayName || xUsername,
      avatarUrl: avatarUrl || '',
    })

    return res.redirect(`${frontendUrl}/auth/x/callback?success=true&${successParams.toString()}`)
  } catch (err) {
    console.error('OAuth callback error:', err)
    return res.redirect(`${frontendUrl}/auth/x/callback?error=server_error&description=An unexpected error occurred during authentication.`)
  }
})

// Get current user session
router.get('/me', async (req: Request, res: Response) => {
  const session = req.session as any

  if (!session.userId) {
    return res.json({ user: null })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        xUserId: true,
        xUsername: true,
        displayName: true,
        avatarUrl: true,
        email: true,
        walletAddress: true,
        isAdmin: true,
        createdAt: true,
      },
    })

    if (!user) {
      session.destroy(() => {})
      return res.json({ user: null })
    }

    res.json({ user })
  } catch (err) {
    console.error('Failed to fetch user:', err)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

// Logout
router.post('/logout', (req: Request, res: Response) => {
  const session = req.session as any
  session.destroy((err: any) => {
    if (err) {
      console.error('Logout error:', err)
      return res.status(500).json({ error: 'Failed to logout' })
    }
    res.clearCookie('solverify.sid')
    res.json({ success: true })
  })
})

export { router as authRoutes }
