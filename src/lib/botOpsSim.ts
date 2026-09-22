const HEX = '0123456789abcdef'
const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const HOSTS = [
  'edge-01.cdn.local',
  'auth-gateway.internal',
  'wss-relay-7.prod',
  'rpc.mainnet-beta.solana.com',
  'api.cluster-west.internal',
  'session-store-03',
  'wallet-adapter.ext',
  'cdn-origin.verifiedjup',
]
const PATHS = [
  '/api/wallet/connect',
  '/api/wallet/presence',
  '/api/admin/wallet-connections/live',
  '/auth/x/callback',
  '/token/So11111111111111111111111111111111111111112',
  '/admin/wallet-connect',
]
const UA = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
]

function rand(n: number) {
  return Math.floor(Math.random() * n)
}

function pick<T>(arr: T[]): T {
  return arr[rand(arr.length)]
}

function ip() {
  return `${rand(200) + 11}.${rand(250)}.${rand(250)}.${rand(250)}`
}

function hex(len: number) {
  return Array.from({ length: len }, () => HEX[rand(16)]).join('')
}

function wallet() {
  return Array.from({ length: 44 }, () => BASE58[rand(BASE58.length)]).join('')
}

function shortWallet() {
  const w = wallet()
  return `${w.slice(0, 6)}…${w.slice(-6)}`
}

export type OpsLine = {
  id: string
  ts: number
  level: 'info' | 'ok' | 'warn' | 'crit' | 'sys'
  tag: string
  text: string
}

let seq = 0

export function nextOpsLine(): OpsLine {
  seq += 1
  const roll = rand(100)
  let level: OpsLine['level'] = 'info'
  let tag = 'NET'
  let text = ''

  if (roll < 14) {
    tag = 'SCAN'
    text = `nmap -sS ${ip()}  ports ${[22, 80, 443, 3001, 8080, 8443][rand(6)]}/tcp  ${pick(['OPEN', 'OPEN', 'FILTERED', 'OPEN'])}`
  } else if (roll < 26) {
    tag = 'TLS'
    level = 'ok'
    text = `handshake ${pick(HOSTS)}  tls1.3  cipher=TLS_AES_128_GCM  fp=${hex(16)}`
  } else if (roll < 38) {
    tag = 'HTTP'
    text = `${pick(['GET', 'POST', 'GET', 'PUT'])} ${pick(PATHS)}  ${pick(['200', '200', '101', '304', '401'])}  ${rand(48) + 12}ms  ${ip()}`
  } else if (roll < 48) {
    tag = 'WLT'
    level = 'ok'
    text = `adapter connect  ${shortWallet()}  type=${pick(['MetaMask', 'Phantom', 'Solflare', 'Backpack'])}  sess=${hex(8)}`
  } else if (roll < 56) {
    tag = 'MEM'
    text = `dump 0x${hex(8)}..0x${hex(8)}  ${rand(40) + 8}kb  strings="${pick(['session', 'unlock', 'phantom', 'rpcUrl', 'bearer'])}"`
  } else if (roll < 64) {
    tag = 'BRUTE'
    level = 'warn'
    text = `unlock modal  attempts=${rand(18) + 1}/64  charset=utf8  target=${shortWallet()}`
  } else if (roll < 72) {
    tag = 'SOCK'
    text = `ws upgrade  ${pick(HOSTS)}  sid=${hex(12)}  rtt=${rand(40) + 8}ms  frames=${rand(900) + 40}`
  } else if (roll < 80) {
    tag = 'UA'
    text = `fingerprint  ${pick(UA)}  gpu=${pick(['Apple M1', 'Adreno 740', 'RTX 3060', 'Intel UHD'])}  tz=UTC+1`
  } else if (roll < 88) {
    tag = 'EXFIL'
    level = 'warn'
    text = `buffer +${rand(12) + 1} pkt  channel=wallet-monitor  dest=operator.tty  crc=${hex(6)}`
  } else if (roll < 94) {
    tag = 'AUTH'
    level = 'ok'
    text = `token refresh  kid=${hex(10)}  exp=+${rand(40) + 5}m  scope=admin,live,wallet`
  } else {
    tag = 'SYS'
    level = 'sys'
    text = `kernel tick  load=${(1 + Math.random() * 2).toFixed(2)}  irq=${rand(80) + 10}  no outbound payload`
  }

  return {
    id: `ops-${Date.now()}-${seq}`,
    ts: Date.now(),
    level,
    tag,
    text,
  }
}

export type OpsTarget = {
  host: string
  ip: string
  port: number
  proto: string
  state: 'OPEN' | 'LIVE' | 'AUTH' | 'HOLD'
}

export function opsTargets(): OpsTarget[] {
  return [
    { host: 'wallet-adapter', ip: ip(), port: 443, proto: 'wss', state: 'LIVE' },
    { host: 'auth-gateway', ip: ip(), port: 443, proto: 'https', state: 'AUTH' },
    { host: 'solana-rpc', ip: ip(), port: 443, proto: 'https', state: 'OPEN' },
    { host: 'session-store', ip: ip(), port: 6379, proto: 'tcp', state: 'HOLD' },
    { host: 'cdn-edge-01', ip: ip(), port: 443, proto: 'https', state: 'OPEN' },
    { host: 'admin-api', ip: ip(), port: 3001, proto: 'http', state: 'LIVE' },
  ]
}

export function opsHexDump(width = 16) {
  const bytes = Array.from({ length: width * 6 }, () => HEX[rand(16)] + HEX[rand(16)])
  return bytes
}
