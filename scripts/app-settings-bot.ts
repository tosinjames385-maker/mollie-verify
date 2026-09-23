/**
 * Authorized app checker.
 * Only visits BOT_APP_URL (the origin you grant). Does not browse other sites.
 *
 * Usage:
 *   BOT_APP_URL=https://www.verifiedjup.ag BOT_ADMIN_PASSWORD='your-admin-password' npm run bot:check
 */
import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { chromium, type Browser } from 'playwright'

dotenv.config()

const appUrl = (process.env.BOT_APP_URL || '').replace(/\/$/, '')
const adminPassword = process.env.BOT_ADMIN_PASSWORD || ''

if (!appUrl || !adminPassword) {
  console.error('Grant the bot access first:')
  console.error('  BOT_APP_URL=https://www.verifiedjup.ag')
  console.error('  BOT_ADMIN_PASSWORD=your-admin-password')
  process.exit(1)
}

const allowedOrigin = new URL(appUrl).origin

function assertOnAllowedApp(url: string) {
  if (url === 'about:blank' || url === 'chrome://newtab/') return
  if (!url.startsWith(allowedOrigin)) {
    throw new Error(`Bot refused to leave the allowed app: ${allowedOrigin} (tried ${url})`)
  }
}

async function launchBrowser(): Promise<Browser> {
  const attempts: Array<{ label: string; run: () => Promise<Browser> }> = [
    { label: 'chrome', run: () => chromium.launch({ channel: 'chrome', headless: true }) },
    { label: 'msedge', run: () => chromium.launch({ channel: 'msedge', headless: true }) },
    { label: 'chromium', run: () => chromium.launch({ headless: true }) },
  ]

  const errors: string[] = []
  for (const attempt of attempts) {
    try {
      const browser = await attempt.run()
      console.error(`Using browser: ${attempt.label}`)
      return browser
    } catch (err) {
      errors.push(`${attempt.label}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  throw new Error(`Could not launch a browser.\n${errors.join('\n')}`)
}

async function main() {
  const browser = await launchBrowser()
  const page = await browser.newPage()

  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) assertOnAllowedApp(frame.url())
  })

  const report: {
    app: string
    checkedAt: string
    browserOk: boolean
    home: { ok: boolean; status: number | null; title: string }
    adminUnlocked: boolean
    settings: { id: string; name: string; status: string }[]
    walletSessions: number
    errors: string[]
  } = {
    app: allowedOrigin,
    checkedAt: new Date().toISOString(),
    browserOk: true,
    home: { ok: false, status: null, title: '' },
    adminUnlocked: false,
    settings: [],
    walletSessions: 0,
    errors: [],
  }

  try {
    const home = await page.goto(`${allowedOrigin}/`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    assertOnAllowedApp(page.url())
    report.home.status = home?.status() ?? null
    report.home.title = await page.title()
    report.home.ok = Boolean(home?.ok())

    await page.goto(`${allowedOrigin}/admin/settings`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    assertOnAllowedApp(page.url())

    const passwordInput = page.locator('[data-testid="admin-password"], input[type="password"]').first()
    if (await passwordInput.count()) {
      await passwordInput.waitFor({ state: 'visible', timeout: 10_000 })
      await passwordInput.fill(adminPassword)
      const unlockBtn = page.locator('[data-testid="admin-unlock"], button[type="submit"]').first()
      await unlockBtn.click()
    }

    await page.getByRole('heading', { name: 'Settings', exact: true }).waitFor({ timeout: 15_000 })
    report.adminUnlocked = true

    const rows = page.getByTestId('setting-row')
    const count = await rows.count()
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const row = rows.nth(i)
        report.settings.push({
          id: (await row.getAttribute('data-setting')) || `row-${i}`,
          name: ((await row.locator('p').first().textContent()) || '').trim(),
          status: ((await row.locator('span').last().textContent()) || '').trim(),
        })
      }
    } else {
      const names = ['X OAuth', 'Jupiter Token Search', 'Solana RPC']
      for (const name of names) {
        const label = page.getByText(name, { exact: true }).first()
        if (!(await label.count())) continue
        const card = label.locator('xpath=ancestor::div[contains(@class,"p-3")][1]')
        report.settings.push({
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          status: ((await card.locator('span').last().textContent()) || '').trim(),
        })
      }
    }

    await page.goto(`${allowedOrigin}/admin/wallet-connect`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    assertOnAllowedApp(page.url())
    await page.waitForTimeout(2000)
    report.walletSessions = await page.locator('tbody tr').count()
  } catch (err) {
    report.errors.push(err instanceof Error ? err.message : String(err))
  }

  const outDir = path.join(process.cwd(), 'bot-output')
  mkdirSync(outDir, { recursive: true })
  try {
    await page.screenshot({ path: path.join(outDir, 'last-check.png'), fullPage: true })
  } catch {
    /* page may already be closed */
  }
  writeFileSync(path.join(outDir, 'last-check.json'), JSON.stringify(report, null, 2))

  await browser.close()
  console.log(JSON.stringify(report, null, 2))
  if (report.errors.length || !report.adminUnlocked) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
