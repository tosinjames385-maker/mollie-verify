/**
 * Visible main-site assistant bot.
 * Only visits BOT_APP_URL. Opens Connect Wallet and walks the in-app demo wallet UI
 * (menu → Settings → Security & Privacy → action buttons). Does not control real wallet apps.
 *
 * Usage:
 *   BOT_APP_URL=http://localhost:5173 npm run bot:assistant
 *   BOT_APP_URL=https://www.verifiedjup.ag BOT_HEADLESS=true npm run bot:assistant
 */
import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { chromium, type Browser, type Page } from 'playwright'

dotenv.config()

const appUrl = (process.env.BOT_APP_URL || 'http://localhost:5173').replace(/\/$/, '')
const walletName = process.env.BOT_WALLET_NAME || 'MetaMask'
const headless = process.env.BOT_HEADLESS === 'true'
const slowMo = Number(process.env.BOT_SLOW_MS || '600') || 600

const allowedOrigin = new URL(appUrl).origin

function assertOnAllowedApp(url: string) {
  if (url === 'about:blank' || url === 'chrome://newtab/') return
  if (!url.startsWith(allowedOrigin)) {
    throw new Error(`Bot refused to leave the allowed app: ${allowedOrigin} (tried ${url})`)
  }
}

async function launchBrowser(): Promise<Browser> {
  const launchOpts = { headless, slowMo }
  const attempts: Array<{ label: string; run: () => Promise<Browser> }> = [
    { label: 'chrome', run: () => chromium.launch({ channel: 'chrome', ...launchOpts }) },
    { label: 'msedge', run: () => chromium.launch({ channel: 'msedge', ...launchOpts }) },
    { label: 'chromium', run: () => chromium.launch(launchOpts) },
  ]
  const errors: string[] = []
  for (const attempt of attempts) {
    try {
      const browser = await attempt.run()
      console.error(`Using browser: ${attempt.label} (headless=${headless}, slowMo=${slowMo}ms)`)
      return browser
    } catch (err) {
      errors.push(`${attempt.label}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  throw new Error(`Could not launch a browser.\n${errors.join('\n')}`)
}

function walletTestId(name: string) {
  return `wallet-option-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
}

async function step(page: Page, report: { steps: string[] }, label: string, fn: () => Promise<void>) {
  report.steps.push(label)
  console.error(`→ ${label}`)
  await fn()
  await page.waitForTimeout(400)
}

async function main() {
  const browser = await launchBrowser()
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) assertOnAllowedApp(frame.url())
  })

  const report: {
    app: string
    mode: 'main-assistant-demo'
    checkedAt: string
    wallet: string
    steps: string[]
    actionsClicked: string[]
    errors: string[]
  } = {
    app: allowedOrigin,
    mode: 'main-assistant-demo',
    checkedAt: new Date().toISOString(),
    wallet: walletName,
    steps: [],
    actionsClicked: [],
    errors: [],
  }

  const outDir = path.join(process.cwd(), 'bot-output')
  mkdirSync(outDir, { recursive: true })

  try {
    await step(page, report, 'Open main site with assistant demo', async () => {
      await page.goto(`${allowedOrigin}/submissions?assistantDemo=1`, {
        waitUntil: 'commit',
        timeout: 60_000,
      })
      await page.getByTestId('connect-wallet-button').first().waitFor({ timeout: 30_000 })
      assertOnAllowedApp(page.url())
    })

    await step(page, report, 'Click Connect Wallet', async () => {
      await page.getByTestId('connect-wallet-button').first().click()
      await page.getByRole('heading', { name: 'Connect', exact: true }).waitFor({ timeout: 10_000 })
    })

    await step(page, report, `Choose wallet: ${walletName}`, async () => {
      const tid = walletTestId(walletName)
      const byTestId = page.getByTestId(tid)
      if (await byTestId.count()) {
        await byTestId.first().click()
      } else {
        await page.getByRole('button', { name: walletName, exact: true }).first().click()
      }
      await page.getByTestId('wallet-assistant-demo').waitFor({ timeout: 10_000 })
    })

    await step(page, report, 'Open top menu', async () => {
      await page.getByTestId('wallet-demo-menu-btn').click()
    })

    await step(page, report, 'Open Settings', async () => {
      await page.getByTestId('wallet-demo-nav-settings').click()
    })

    await step(page, report, 'Open Security & Privacy', async () => {
      await page.getByTestId('wallet-demo-nav-security').click()
    })

    await step(page, report, 'Click each security control', async () => {
      const actions = page.locator('[data-testid^="wallet-demo-action-"]')
      const n = await actions.count()
      for (let i = 0; i < n; i++) {
        const btn = actions.nth(i)
        const id = (await btn.getAttribute('data-testid')) || `action-${i}`
        await btn.click()
        report.actionsClicked.push(id.replace('wallet-demo-action-', ''))
      }
    })

    await page.screenshot({ path: path.join(outDir, 'assistant-demo.png'), fullPage: true })
  } catch (err) {
    report.errors.push(err instanceof Error ? err.message : String(err))
    try {
      await page.screenshot({ path: path.join(outDir, 'assistant-demo-error.png'), fullPage: true })
    } catch {
      /* ignore */
    }
  }

  writeFileSync(path.join(outDir, 'assistant-demo.json'), JSON.stringify(report, null, 2))
  await browser.close()
  console.log(JSON.stringify(report, null, 2))
  if (report.errors.length) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
