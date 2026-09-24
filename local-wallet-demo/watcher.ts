import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium, type Browser, type Locator, type Page } from 'playwright'

const root = path.dirname(fileURLToPath(import.meta.url))
const config = JSON.parse(readFileSync(path.join(root, 'config.json'), 'utf8')) as {
  siteUrl: string
  cdpUrl: string
  expectedAmount: string
  required: string[]
}

export type DemoStatus = {
  bot: 'RUNNING' | 'STOPPED'
  chrome: 'CONNECTED' | 'DISCONNECTED'
  metamask: 'DETECTED' | 'NOT DETECTED'
  website: 'CONNECTED' | 'NOT CONNECTED'
  request: 'WAITING' | 'DETECTED' | 'VALIDATED' | 'CANCELLED' | 'IGNORED'
  lastAction: string
  lastError: string
  emergency: boolean
  log: string[]
}

const FORBIDDEN_CLICKS = ['confirm', 'approve', 'send', 'sign', 'swap', 'submit']

export const status: DemoStatus = {
  bot: 'STOPPED',
  chrome: 'DISCONNECTED',
  metamask: 'NOT DETECTED',
  website: 'NOT CONNECTED',
  request: 'WAITING',
  lastAction: 'None',
  lastError: '',
  emergency: false,
  log: [],
}

let stopped = true
let lastCancelAt = 0

function stamp() {
  return new Date().toISOString()
}

function record(step: string, extra: Record<string, unknown> = {}) {
  status.log = [...status.log, `${stamp()}  ${step}`].slice(-80)
  console.log(`${stamp()}  ${step}`)
  const outDir = path.join(process.cwd(), 'bot-output')
  mkdirSync(outDir, { recursive: true })
  writeFileSync(
    path.join(outDir, 'sol-review-reject.json'),
    JSON.stringify(
      {
        timestamp: stamp(),
        step,
        chrome: status.chrome,
        metamask: status.metamask,
        website: status.website,
        request: status.request,
        lastAction: status.lastAction,
        ...extra,
        confirmed: false,
      },
      null,
      2
    )
  )
}

function compact(value: string) {
  return value.replace(/\s+/g, ' ').trim().toLowerCase()
}

function matchesDemo(text: string): boolean {
  const flat = compact(text)
  if (!flat.includes('transaction request')) return false
  if (!config.required.every((part) => flat.includes(compact(part)))) return false
  if (config.expectedAmount && !flat.includes(compact(config.expectedAmount))) return false
  return true
}

async function reviewDialog(page: Page): Promise<Locator | null> {
  const heading = page.getByText('Transaction request', { exact: true })
  if ((await heading.count().catch(() => 0)) < 1) return null
  const dialog = heading
    .first()
    .locator('xpath=ancestor::*[.//button[normalize-space()="Cancel"] and .//button[normalize-space()="Confirm"]][1]')
  if ((await dialog.count().catch(() => 0)) < 1) return null
  return dialog
}

async function attach(): Promise<Browser | null> {
  try {
    return await chromium.connectOverCDP(config.cdpUrl)
  } catch {
    return null
  }
}

async function inspect(browser: Browser) {
  if (stopped || status.emergency) return
  let sawMetaMask = false
  let sawSite = false

  for (const context of browser.contexts()) {
    for (const page of context.pages()) {
      const url = page.url()
      if (url.includes('verifiedjup.ag')) sawSite = true
      if (url.includes('chrome-extension://') || url.includes('metamask')) sawMetaMask = true

      const dialog = await reviewDialog(page)
      if (!dialog) continue

      status.metamask = 'DETECTED'
      status.request = 'DETECTED'
      record('META_MASK_DETECTED')
      record('TEST_REQUEST_DETECTED')

      const text = await dialog.innerText().catch(() => '')
      if (!matchesDemo(text)) {
        status.request = 'IGNORED'
        status.lastAction = 'Request did not match the demo. No click.'
        record('WAITING', { validation: 'failed' })
        continue
      }

      status.request = 'VALIDATED'
      record('REQUEST_VALIDATED')

      const cancel = dialog.getByRole('button', { name: 'Cancel', exact: true })
      if ((await cancel.count()) !== 1) {
        status.lastError = 'Cancel could not be uniquely identified.'
        record('WAITING', { validation: 'cancel-not-unique' })
        continue
      }

      const label = compact((await cancel.first().innerText().catch(() => 'cancel')) || 'cancel')
      if (label !== 'cancel' || FORBIDDEN_CLICKS.includes(label)) {
        status.lastError = 'Refused to click a non-Cancel control.'
        record('WAITING', { validation: 'not-cancel' })
        continue
      }

      if (Date.now() - lastCancelAt < 2500) return
      await cancel.first().click()
      lastCancelAt = Date.now()
      status.lastAction = 'Cancel pressed'
      record('CANCEL_CLICKED', { action: 'Cancel' })

      let gone = false
      for (let i = 0; i < 16; i++) {
        const left = await page.getByText('Transaction request', { exact: true }).count().catch(() => 0)
        if (left === 0) {
          gone = true
          break
        }
        await new Promise((resolve) => setTimeout(resolve, 250))
      }

      if (!gone) {
        status.lastError = 'Review was still visible after Cancel.'
        record('WAITING', { result: 'still-visible' })
        return
      }

      status.request = 'CANCELLED'
      status.lastError = ''
      record('REQUEST_DISMISSED', { result: 'cancelled' })
      status.request = 'WAITING'
      record('WAITING')
      return
    }
  }

  status.website = sawSite ? 'CONNECTED' : 'NOT CONNECTED'
  status.metamask = sawMetaMask ? 'DETECTED' : status.metamask
  if (status.request !== 'CANCELLED') status.request = 'WAITING'
}

export function emergencyStop() {
  status.emergency = true
  stopped = true
  status.bot = 'STOPPED'
  status.lastAction = 'EMERGENCY STOP'
  record('STOPPED', { action: 'emergency-stop' })
}

export function stopWatcher() {
  stopped = true
  status.bot = 'STOPPED'
  status.lastAction = 'Bot stopped'
  record('STOPPED')
}

export async function runWatcher() {
  if (status.bot === 'RUNNING' && !stopped) {
    status.lastAction = status.chrome === 'CONNECTED'
      ? 'Already running. Waiting for the MetaMask review.'
      : 'Start pressed. Chrome is still closed. Quit Chrome, then run ./local-wallet-demo/launch-chrome.sh'
    return
  }
  stopped = false
  status.emergency = false
  status.bot = 'RUNNING'
  status.request = 'WAITING'
  status.lastAction = 'Watching Chrome'
  record('WAITING')

  let browser: Browser | null = null
  while (!stopped && !status.emergency) {
    if (!browser || !browser.isConnected()) {
      browser = await attach()
      status.chrome = browser ? 'CONNECTED' : 'DISCONNECTED'
      if (!browser) {
        status.lastError = 'Chrome debug port is closed. Use the dedicated demo profile on port 9222.'
        await new Promise((resolve) => setTimeout(resolve, 2000))
        continue
      }
      status.lastError = ''
      record('WAITING', { chrome: 'CONNECTED' })
    }
    try {
      await inspect(browser)
    } catch (err) {
      status.lastError = err instanceof Error ? err.message : 'Watcher error'
      browser = null
      status.chrome = 'DISCONNECTED'
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  status.bot = 'STOPPED'
  status.chrome = 'DISCONNECTED'
}
