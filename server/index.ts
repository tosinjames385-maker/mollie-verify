import express from 'express'
import cors from 'cors'
import session from 'express-session'
import dotenv from 'dotenv'
import { tokenRoutes } from './routes/tokens'
import { submissionRoutes } from './routes/submissions'
import { newsRoutes } from './routes/news'
import { adminRoutes } from './routes/admin'
import { liveTokensRouter } from './routes/liveTokens'
import { authRoutes } from './routes/auth'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomUUID()

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://127.0.0.1:5173',
  credentials: true,
}))

app.use(express.json())

app.use(session({
  name: 'solverify.sid',
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain: process.env.COOKIE_DOMAIN || undefined,
  },
}))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/tokens', tokenRoutes)
app.use('/api/live-tokens', liveTokensRouter)
app.use('/api/submissions', submissionRoutes)
app.use('/api/news', newsRoutes)
app.use('/api/admin', adminRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
