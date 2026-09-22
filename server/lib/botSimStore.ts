const LINES = [
  'boot://core        simulation kernel online',
  'net://mesh         12 ghost nodes attached (local)',
  'auth://gate        admin session token accepted',
  'watch://wallets    listening for connect events',
  'scan://surface     fingerprinting browser headers',
  'pipe://presence    heartbeat channel idle',
  'ui://overlay       holo-grid renderer 60fps',
  'task://queue       0 jobs — bot is standby',
  'note://policy      no outbound exploits in this build',
  'sys://clock        sync to presentation clock',
]

let tick = 0
const startedAt = Date.now()

export function getBotSimStatus() {
  tick += 1
  return {
    mode: 'standby' as const,
    armed: false,
    uptimeMs: Date.now() - startedAt,
    nodes: 12,
    cpu: 18 + (tick % 7),
    ram: 41 + (tick % 5),
    latencyMs: 12 + (tick % 9),
    packets: 8400 + tick * 3,
    label: 'SIMULATION — bot performs no live actions',
  }
}

export function getBotSimFeed(limit = 18) {
  const status = getBotSimStatus()
  const feed = Array.from({ length: limit }, (_, i) => {
    const idx = (tick + i) % LINES.length
    return {
      id: `bot-${tick}-${i}`,
      ts: new Date(Date.now() - (limit - i) * 700).toISOString(),
      line: LINES[idx],
    }
  })
  return { status, feed }
}
