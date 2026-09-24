/**
 * Android security demo. Presses Cancel on one verified MetaMask Mobile
 * transaction review. Never presses Confirm.
 *
 * Test procedure:
 * 1. Set deviceSerial to the dedicated test phone from `adb devices`.
 * 2. Set expectedAmount to the exact harmless demo amount shown on that review.
 * 3. Keep demoMode true. Run: npm run bot:android-demo
 * 4. On the phone, open the demo site, tap Connect Wallet, and connect the test wallet.
 * 5. When MetaMask shows the matching Transaction request, this tool taps Cancel.
 * 6. The dashboard should move to REJECTION_DETECTED, then back to WAITING_FOR_REQUEST.
 * 7. Press STOP AUTOMATION on the dashboard to halt it.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'http'
import { execFile } from 'child_process'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)
const root = path.dirname(fileURLToPath(import.meta.url))
const configPath = path.join(root, 'demo.config.json')

type State =
  | 'WAITING_FOR_DEVICE'
  | 'WAITING_FOR_METAMASK'
  | 'WAITING_FOR_REQUEST'
  | 'REQUEST_DETECTED'
  | 'VERIFYING_REQUEST'
  | 'REJECTING_REQUEST'
  | 'REJECTION_DETECTED'
  | 'ERROR'

type Config = {
  demoMode: boolean
  deviceSerial: string
  expectedAmount: string
  metamaskPackage: string
  demoSiteUrl: string
}

type Status = {
  running: boolean
  state: State
  metamask: boolean
  request: boolean
  lastAction: string
  lastRejection: string
  error: string
  log: string[]
}

const REQUIRED = [
  'Transaction request',
  'Estimated changes',
  'Account',
  'Recipient',
  'Solana Mainnet',
  'Cancel',
  'Confirm',
]

const status: Status = {
  running: false,
  state: 'WAITING_FOR_DEVICE',
  metamask: false,
  request: false,
  lastAction: 'Idle',
  lastRejection: '',
  error: '',
  log: [],
}

let stopped = false
let loopPromise: Promise<void> | null = null

function loadConfig(): Config {
  const raw = JSON.parse(readFileSync(configPath, 'utf8')) as Partial<Config>
  return {
    demoMode: raw.demoMode === true,
    deviceSerial: String(raw.deviceSerial || '').trim(),
    expectedAmount: String(raw.expectedAmount || '').trim(),
    metamaskPackage: String(raw.metamaskPackage || 'io.metamask').trim(),
    demoSiteUrl: String(raw.demoSiteUrl || '').trim(),
  }
}

function transition(next: State, detail = '') {
  const stamp = new Date().toISOString()
  const line = `${stamp}  ${status.state} → ${next}${detail ? `  ${detail}` : ''}`
  status.log = [...status.log, line].slice(-40)
  status.state = next
  console.log(line)
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function adb(serial: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('adb', ['-s', serial, ...args], {
    timeout: 15000,
    maxBuffer: 8 * 1024 * 1024,
  })
  return stdout
}

async function listAdbDevices(): Promise<string[]> {
  try {
    const { stdout } = await execFileAsync('adb', ['devices'], { timeout: 8000 })
    return stdout
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.endsWith('\tdevice'))
      .map((line) => line.split('\t')[0])
      .filter(Boolean)
  } catch {
    return []
  }
}

async function resolveDevice(serial: string): Promise<string | null> {
  const devices = await listAdbDevices()
  if (serial) return devices.includes(serial) ? serial : null
  return devices.length === 1 ? devices[0] : null
}

function decodeXml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

type NodeInfo = { text: string; desc: string; id: string; bounds: string }

function parseNodes(xml: string): NodeInfo[] {
  const nodes: NodeInfo[] = []
  const pattern = /<node\b([^>]*)\/>/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(xml))) {
    const attrs = match[1]
    const read = (name: string) => decodeXml(attrs.match(new RegExp(`${name}="([^"]*)"`))?.[1] || '')
    nodes.push({ text: read('text'), desc: read('content-desc'), id: read('resource-id'), bounds: read('bounds') })
  }
  return nodes
}

function nodeLabel(node: NodeInfo): string {
  return node.text || node.desc || node.id
}

function boundsCenter(bounds: string): { x: number; y: number } | null {
  const match = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/)
  if (!match) return null
  const x1 = Number(match[1])
  const y1 = Number(match[2])
  const x2 = Number(match[3])
  const y2 = Number(match[4])
  if (x2 <= x1 || y2 <= y1) return null
  return { x: Math.round((x1 + x2) / 2), y: Math.round((y1 + y2) / 2) }
}

async function dumpUi(serial: string): Promise<{ xml: string; nodes: NodeInfo[]; flat: string }> {
  await adb(serial, ['shell', 'uiautomator', 'dump', '/sdcard/demo-window.xml'])
  const xml = await adb(serial, ['exec-out', 'cat', '/sdcard/demo-window.xml'])
  const nodes = parseNodes(xml)
  const flat = nodes.map(nodeLabel).join('\n')
  return { xml, nodes, flat }
}

async function metamaskFocused(serial: string, pkg: string): Promise<boolean> {
  try {
    const focus = await adb(serial, ['shell', 'dumpsys', 'window'])
    return focus.includes(pkg)
  } catch {
    return false
  }
}

function screenMatches(flat: string, expectedAmount: string): boolean {
  if (!REQUIRED.every((part) => flat.includes(part))) return false
  if (expectedAmount && !flat.includes(expectedAmount)) return false
  return true
}

async function tick(config: Config) {
  if (stopped) return
  if (!config.demoMode) {
    status.error = 'demoMode is not true. Automation is locked.'
    if (status.state !== 'ERROR') transition('ERROR', status.error)
    stopped = true
    status.running = false
    return
  }
  const serial = await resolveDevice(config.deviceSerial)
  if (!serial) {
    status.metamask = false
    status.request = false
    if (status.state !== 'WAITING_FOR_DEVICE') transition('WAITING_FOR_DEVICE', 'No dedicated Android test device is connected')
    return
  }

  const focused = await metamaskFocused(serial, config.metamaskPackage)
  let ui: { nodes: NodeInfo[]; flat: string }
  try {
    ui = await dumpUi(serial)
  } catch (err) {
    status.error = err instanceof Error ? err.message : 'Could not read the device UI.'
    transition('ERROR', status.error)
    stopped = true
    status.running = false
    return
  }

  const inMetaMask = focused || ui.flat.includes('MetaMask')
  status.metamask = inMetaMask
  if (!inMetaMask) {
    status.request = false
    if (status.state !== 'WAITING_FOR_METAMASK') transition('WAITING_FOR_METAMASK')
    return
  }

  if (!screenMatches(ui.flat, config.expectedAmount)) {
    status.request = false
    if (status.state !== 'WAITING_FOR_REQUEST' && status.state !== 'REJECTION_DETECTED') {
      transition('WAITING_FOR_REQUEST')
    } else if (status.state === 'REJECTION_DETECTED') {
      transition('WAITING_FOR_REQUEST')
    }
    return
  }

  status.request = true
  transition('REQUEST_DETECTED')
  transition('VERIFYING_REQUEST')

  const cancels = ui.nodes.filter((node) => node.text === 'Cancel' || node.desc === 'Cancel')
  const confirms = ui.nodes.filter((node) => node.text === 'Confirm' || node.desc === 'Confirm')
  if (cancels.length !== 1 || confirms.length < 1) {
    status.error = 'Cancel could not be tied to this review. Automation stopped.'
    transition('ERROR', status.error)
    stopped = true
    status.running = false
    return
  }

  const point = boundsCenter(cancels[0].bounds)
  if (!point) {
    status.error = 'Cancel was found but its bounds were unusable. Automation stopped.'
    transition('ERROR', status.error)
    stopped = true
    status.running = false
    return
  }

  transition('REJECTING_REQUEST')
  await adb(serial, ['shell', 'input', 'tap', String(point.x), String(point.y)])
  status.lastAction = 'Tapped Cancel on the verified test review'
  await sleep(1200)

  const after = await dumpUi(serial)
  if (after.flat.includes('Transaction request')) {
    status.error = 'The review was still visible after Cancel. Automation stopped.'
    transition('ERROR', status.error)
    stopped = true
    status.running = false
    return
  }

  status.lastRejection = new Date().toLocaleTimeString()
  status.lastAction = 'Rejected test request'
  status.request = false
  status.error = ''
  transition('REJECTION_DETECTED')
}

async function loop() {
  const config = loadConfig()
  status.running = true
  stopped = false
  status.error = ''
  transition('WAITING_FOR_DEVICE', 'demo started')
  while (!stopped) {
    try {
      await tick(config)
    } catch (err) {
      status.error = err instanceof Error ? err.message : 'Unexpected automation error.'
      transition('ERROR', status.error)
      stopped = true
      break
    }
    await sleep(1000)
  }
  status.running = false
  if (status.state !== 'ERROR') status.lastAction = 'Stopped'
}

function startLoop() {
  if (loopPromise && status.running) return
  stopped = false
  loopPromise = loop()
}

function page(): string {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>MetaMask cancel demo</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; background: #0c1116; color: #e8eef4; margin: 0; }
    main { max-width: 640px; margin: 40px auto; padding: 0 16px; }
    h1 { font-size: 22px; }
    dl { display: grid; grid-template-columns: 180px 1fr; gap: 8px 12px; }
    dt { color: #8ea0b0; }
    button { margin-top: 24px; background: #ff5a5a; color: white; border: 0; border-radius: 10px; padding: 14px 18px; font-weight: 700; cursor: pointer; }
    pre { background: #070b0f; padding: 12px; border-radius: 8px; overflow: auto; font-size: 12px; }
    p { color: #b7c3ce; }
  </style>
</head>
<body>
  <main>
    <h1>MetaMask Mobile cancel demo</h1>
    <p>This tool only taps Cancel on a verified test review. It never taps Confirm.</p>
    <dl>
      <dt>Status</dt><dd id="running">—</dd>
      <dt>State</dt><dd id="state">—</dd>
      <dt>MetaMask</dt><dd id="metamask">—</dd>
      <dt>Request</dt><dd id="request">—</dd>
      <dt>Last action</dt><dd id="action">—</dd>
      <dt>Last rejection</dt><dd id="rejection">—</dd>
      <dt>Error</dt><dd id="error">—</dd>
    </dl>
    <button id="stop" type="button">STOP AUTOMATION</button>
    <h2>Log</h2>
    <pre id="log"></pre>
  </main>
  <script>
    async function refresh() {
      const res = await fetch('/api/status')
      const data = await res.json()
      document.getElementById('running').textContent = data.running ? 'RUNNING' : 'STOPPED'
      document.getElementById('state').textContent = data.state
      document.getElementById('metamask').textContent = data.metamask ? 'DETECTED' : 'NO'
      document.getElementById('request').textContent = data.request ? 'YES' : 'NO'
      document.getElementById('action').textContent = data.lastAction || '—'
      document.getElementById('rejection').textContent = data.lastRejection || '—'
      document.getElementById('error').textContent = data.error || '—'
      document.getElementById('log').textContent = (data.log || []).join('\\n')
    }
    document.getElementById('stop').onclick = async () => {
      await fetch('/api/stop', { method: 'POST' })
      refresh()
    }
    refresh()
    setInterval(refresh, 1000)
  </script>
</body>
</html>`
}

function send(res: ServerResponse, code: number, body: string, type: string) {
  res.writeHead(code, { 'content-type': type })
  res.end(body)
}

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  if (req.url === '/api/status') {
    send(res, 200, JSON.stringify(status), 'application/json')
    return
  }
  if (req.url === '/api/stop' && req.method === 'POST') {
    stopped = true
    status.running = false
    status.lastAction = 'Stopped by STOP AUTOMATION'
    send(res, 200, JSON.stringify({ ok: true, state: status.state }), 'application/json')
    return
  }
  send(res, 200, page(), 'text/html; charset=utf-8')
})

server.listen(3939, '127.0.0.1', () => {
  console.log('Cancel demo dashboard: http://127.0.0.1:3939')
  startLoop()
})
