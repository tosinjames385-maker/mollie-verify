/**
 * Cancels one wallet review dialog. Never clicks Confirm.
 *
 * Stays idle until a wallet window shows the transaction review titled:
 *   Transaction request
 * with estimated changes, a recipient, Solana Mainnet, and a
 * 0.000005 SOL fee. Then it clicks Cancel.
 *
 * Attach to the Chrome window where the wallet popup is open:
 *   chrome --remote-debugging-port=9222
 *   npm run bot:reject-sol-review
 */
import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import { chromium, type Browser, type Locator, type Page } from 'playwright'

const HEADING = 'Transaction request'
const POLL_MS = 500
const CDP_URL = process.env.BOT_CDP_URL || 'http://127.0.0.1:9222'

type Step =
  | 'WAITING'
  | 'transaction screen detected'
  | 'details verified'
  | 'Cancel clicked'
  | 'rejection detected'

const REQUIRED_SNIPPETS = [
  'Estimated changes',
  'Account',
  'Recipient',
  'Solana Mainnet',
  '0.000005 SOL',
]

function log(step: Step, detail = '') {
  const line = detail ? `${step} — ${detail}` : step
  console.log(line)
}

function normalize(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function detailsMatch(text: string): boolean {
  const flat = normalize(text)
  if (!flat.includes(HEADING)) return false
  return REQUIRED_SNIPPETS.every((part) => flat.includes(part))
}

async function reviewDialog(page: Page): Promise<Locator | null> {
  const heading = page.getByText(HEADING, { exact: true })
  const count = await heading.count().catch(() => 0)
  if (count < 1) return null
  const dialog = heading
    .first()
    .locator(
      'xpath=ancestor::*[.//button[normalize-space()="Cancel"] and .//button[normalize-space()="Confirm"]][1]'
    )
  if ((await dialog.count().catch(() => 0)) < 1) return null
  return dialog
}

async function findReview(browser: Browser): Promise<{ page: Page; dialog: Locator } | null> {
  for (const context of browser.contexts()) {
    for (const page of context.pages()) {
      const dialog = await reviewDialog(page)
      if (!dialog) continue
      const text = await dialog.innerText().catch(() => '')
      if (!detailsMatch(text)) {
        log('transaction screen detected', 'details did not match, staying WAITING')
        continue
      }
      return { page, dialog }
    }
  }
  return null
}

async function headingGone(page: Page): Promise<boolean> {
  const left = await page
    .getByText(HEADING, { exact: true })
    .count()
    .catch(() => 0)
  return left === 0
}

let lastStatus = ''

function writeStatus(result: Record<string, unknown>) {
  const body = JSON.stringify({ ...result, at: new Date().toISOString() }, null, 2)
  if (body === lastStatus) return
  lastStatus = body
  const outDir = path.join(process.cwd(), 'bot-output')
  mkdirSync(outDir, { recursive: true })
  writeFileSync(path.join(outDir, 'sol-review-reject.json'), body)
}

async function attach(): Promise<Browser | null> {
  try {
    return await chromium.connectOverCDP(CDP_URL)
  } catch {
    return null
  }
}

async function cancelOne(browser: Browser): Promise<boolean> {
  const found = await findReview(browser)
  if (!found) return false

  log('transaction screen detected')
  log('details verified')

  const cancel = found.dialog.getByRole('button', { name: 'Cancel', exact: true })
  if ((await cancel.count()) < 1) {
    writeStatus({ ok: false, step: 'details verified', reason: 'Cancel button missing from this dialog', confirmed: false })
    return false
  }
  await cancel.first().click()
  log('Cancel clicked')

  let gone = false
  for (let i = 0; i < 16; i++) {
    if (await headingGone(found.page)) {
      gone = true
      break
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  if (!gone) {
    writeStatus({ ok: false, step: 'Cancel clicked', reason: 'review screen still visible after Cancel', confirmed: false })
    console.log(JSON.stringify({ ok: false, step: 'Cancel clicked', confirmed: false }))
    return false
  }

  log('rejection detected')
  const result = { ok: true, step: 'rejection detected' as const, heading: HEADING, confirmed: false }
  writeStatus(result)
  console.log(JSON.stringify(result))
  log('WAITING')
  return true
}

async function main() {
  log('WAITING')
  writeStatus({ ok: true, step: 'WAITING', note: 'Looking for Chrome', attached: false, confirmed: false })
  let browser: Browser | null = null
  for (;;) {
    if (!browser || !browser.isConnected()) {
      browser = await attach()
      if (!browser) {
        writeStatus({
          ok: true,
          step: 'WAITING',
          note: 'Chrome is not accepting debug connections. Quit Chrome, then open it with a separate profile and port 9222.',
          attached: false,
          confirmed: false,
        })
        await new Promise((resolve) => setTimeout(resolve, 3000))
        continue
      }
      writeStatus({ ok: true, step: 'WAITING', note: 'Watching for the transaction review', attached: true, confirmed: false })
    }
    try {
      await cancelOne(browser)
    } catch (err) {
      console.error(err instanceof Error ? err.message : err)
      browser = null
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS))
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
