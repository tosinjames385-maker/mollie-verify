import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { tokenRoutes } from './routes/tokens'
import { submissionRoutes } from './routes/submissions'
import { newsRoutes } from './routes/news'
import { adminRoutes } from './routes/admin'
import { liveTokensRouter } from './routes/liveTokens'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Routes
app.use('/api/tokens', tokenRoutes)
app.use('/api/live-tokens', liveTokensRouter)
app.use('/api/submissions', submissionRoutes)
app.use('/api/news', newsRoutes)
app.use('/api/admin', adminRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
