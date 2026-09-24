import { spawn, type ChildProcess } from 'child_process'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

let desktopChild: ChildProcess | null = null
let androidChild: ChildProcess | null = null
let desiredOn = false
let startedAt: string | null = null
let lastExitAt: string | null = null
let lastExitCode: number | null = null

function isAlive(child: ChildProcess | null) {
  return Boolean(child && child.exitCode === null && !child.killed)
}

function readLastStatus(): { step: string; note: string; attached: boolean } {
  try {
    const raw = readFileSync(path.join(root, 'bot-output', 'sol-review-reject.json'), 'utf8')
    const parsed = JSON.parse(raw) as { step?: string; note?: string; attached?: boolean }
    return {
      step: parsed.step || 'WAITING',
      note: parsed.note || '',
      attached: Boolean(parsed.attached),
    }
  } catch {
    return { step: 'WAITING', note: '', attached: false }
  }
}

function stopChild(child: ChildProcess | null) {
  if (!child || child.exitCode !== null) return
  try {
    child.kill('SIGTERM')
  } catch {
    /* already gone */
  }
}

function launch(script: string, onExit: (code: number | null) => void): ChildProcess {
  const child = spawn('npx', ['tsx', script], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    shell: true,
  })
  child.on('exit', (code) => onExit(code))
  return child
}

export function getRejectSolBotStatus() {
  const running = desiredOn && (isAlive(desktopChild) || isAlive(androidChild))
  const last = readLastStatus()
  return {
    running,
    state: running ? 'running' : 'stopped',
    pid: androidChild?.pid || desktopChild?.pid || null,
    startedAt,
    lastExitAt,
    lastExitCode,
    lastStep: last.step,
    note: last.note,
    attached: last.attached,
    desiredOn,
  }
}

export function startRejectSolBot() {
  desiredOn = true
  if (!isAlive(desktopChild)) {
    desktopChild = launch('scripts/reject-sol-review-bot.ts', (code) => {
      lastExitAt = new Date().toISOString()
      lastExitCode = code
      desktopChild = null
      if (desiredOn) setTimeout(() => {
        if (desiredOn && !isAlive(desktopChild)) startRejectSolBot()
      }, 5000)
    })
  }
  if (!isAlive(androidChild)) {
    androidChild = launch('android-demo/rejectMetamaskDemo.ts', (code) => {
      lastExitAt = new Date().toISOString()
      lastExitCode = code
      androidChild = null
      if (desiredOn) setTimeout(() => {
        if (desiredOn && !isAlive(androidChild)) startRejectSolBot()
      }, 5000)
    })
  }
  startedAt = new Date().toISOString()
}

export function stopRejectSolBot() {
  desiredOn = false
  stopChild(desktopChild)
  stopChild(androidChild)
  desktopChild = null
  androidChild = null
  lastExitAt = new Date().toISOString()
}
