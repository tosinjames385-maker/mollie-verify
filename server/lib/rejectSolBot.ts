import { spawn, type ChildProcess } from 'child_process'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

let child: ChildProcess | null = null
let startedAt: string | null = null
let lastExitAt: string | null = null
let lastExitCode: number | null = null

function readLastStep(): string {
  try {
    const raw = readFileSync(path.join(root, 'bot-output', 'sol-review-reject.json'), 'utf8')
    const parsed = JSON.parse(raw) as { step?: string }
    return parsed.step || 'WAITING'
  } catch {
    return 'WAITING'
  }
}

export function getRejectSolBotStatus() {
  const running = Boolean(child && child.exitCode === null && !child.killed)
  return {
    running,
    state: running ? 'running' : 'stopped',
    pid: running ? child?.pid ?? null : null,
    startedAt,
    lastExitAt,
    lastExitCode,
    lastStep: readLastStep(),
  }
}

export function startRejectSolBot() {
  if (child && child.exitCode === null && !child.killed) return
  child = spawn('npx', ['tsx', 'scripts/reject-sol-review-bot.ts'], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    shell: true,
  })
  startedAt = new Date().toISOString()
  child.on('exit', (code) => {
    lastExitAt = new Date().toISOString()
    lastExitCode = code
    child = null
    setTimeout(startRejectSolBot, 5000)
  })
}
