import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Activity, Cpu, Radio, Shield, Terminal, Zap } from 'lucide-react'
import { nextOpsLine, opsHexDump, opsTargets, type OpsLine, type OpsTarget } from '../../lib/botOpsSim'

function pad(n: number, size = 2) {
  return String(n).padStart(size, '0')
}

function formatClock(ms: number) {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${pad(h)}:${pad(m)}:${pad(s % 60)}`
}

function formatStamp(ts: number) {
  const d = new Date(ts)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
}

const LEVEL_COLOR: Record<OpsLine['level'], string> = {
  info: 'text-[#9ca8b8]',
  ok: 'text-[#7dffb3]',
  warn: 'text-[#f5d36c]',
  crit: 'text-[#ff7a7a]',
  sys: 'text-[#6ee0ff]',
}

const STATE_COLOR: Record<OpsTarget['state'], string> = {
  OPEN: 'text-[#8ad4ff]',
  LIVE: 'text-[#7dffb3]',
  AUTH: 'text-[#f5d36c]',
  HOLD: 'text-[#6b7787]',
}

function Metric({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string
  value: string
  sub?: string
  icon: typeof Cpu
}) {
  return (
    <div className="bg-[#070c12] border border-[#1a2633] rounded-lg px-3 py-2.5">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-[#6b7787]">
        <span>{label}</span>
        <Icon className="w-3.5 h-3.5 text-[#c7f284]" />
      </div>
      <p className="mt-1 font-mono text-lg font-semibold text-[#e8ffe9] leading-none">{value}</p>
      {sub && <p className="mt-1 text-[10px] text-[#5d6b7a] font-mono">{sub}</p>}
    </div>
  )
}

export const AdminBotConsole: React.FC = () => {
  const startedAt = useRef(Date.now())
  const termRef = useRef<HTMLDivElement>(null)
  const [now, setNow] = useState(Date.now())
  const [lines, setLines] = useState<OpsLine[]>(() => Array.from({ length: 18 }, () => nextOpsLine()))
  const [cpu, setCpu] = useState(37)
  const [ram, setRam] = useState(52)
  const [net, setNet] = useState(18)
  const [packets, setPackets] = useState(148220)
  const [burst, setBurst] = useState(false)
  const [targets, setTargets] = useState<OpsTarget[]>(() => opsTargets())
  const [hexRows, setHexRows] = useState(() => opsHexDump())
  const [exfil, setExfil] = useState(12)
  const [inject, setInject] = useState(28)
  const [capture, setCapture] = useState(9)
  const [rejectBot, setRejectBot] = useState<{
    state: 'running' | 'stopped'
    lastStep: string
    note?: string
    attached?: boolean
  } | null>(null)
  const [botBusy, setBotBusy] = useState(false)

  const applyRejectBot = (data: { state?: string; lastStep?: string; note?: string; attached?: boolean } | null) => {
    if (!data) return
    setRejectBot({
      state: data.state === 'running' ? 'running' : 'stopped',
      lastStep: data.lastStep || 'WAITING',
      note: data.note,
      attached: data.attached,
    })
  }

  useEffect(() => {
    let cancelled = false
    const load = () => {
      void fetch('/api/admin/bot/reject-sol', { credentials: 'include' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!cancelled) applyRejectBot(data)
        })
        .catch(() => {
          if (!cancelled) setRejectBot(null)
        })
    }
    load()
    const id = window.setInterval(load, 3000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  const toggleRejectBot = async () => {
    if (botBusy) return
    setBotBusy(true)
    const path = rejectBot?.state === 'running' ? '/api/admin/bot/reject-sol/stop' : '/api/admin/bot/reject-sol/start'
    try {
      const res = await fetch(path, { method: 'POST', credentials: 'include' })
      applyRejectBot(res.ok ? await res.json() : null)
    } finally {
      setBotBusy(false)
    }
  }

  const tickLive = useCallback(() => {
    setNow(Date.now())
    setCpu((v) => Math.min(96, Math.max(18, v + (Math.random() * 10 - 4.5))))
    setRam((v) => Math.min(91, Math.max(34, v + (Math.random() * 6 - 2.8))))
    setNet((v) => Math.min(92, Math.max(8, v + (Math.random() * 14 - 5))))
    setPackets((v) => v + Math.floor(Math.random() * 48) + 6)
    setExfil((v) => (v + Math.random() * 4) % 100)
    setInject((v) => (v + Math.random() * 6) % 100)
    setCapture((v) => (v + Math.random() * 3.5) % 100)
    setHexRows(opsHexDump())
    if (Math.random() > 0.82) setTargets(opsTargets())
  }, [])

  useEffect(() => {
    const clock = setInterval(tickLive, 280)
    return () => clearInterval(clock)
  }, [tickLive])

  useEffect(() => {
    const cadence = burst ? 90 : 240
    const id = setInterval(() => {
      setLines((prev) => {
        const count = burst ? 2 : 1
        const next = [...prev]
        for (let i = 0; i < count; i++) next.push(nextOpsLine())
        return next.slice(-120)
      })
    }, cadence)
    return () => clearInterval(id)
  }, [burst])

  useEffect(() => {
    const el = termRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [lines])

  const uptime = now - startedAt.current
  const loadAvg = useMemo(() => (cpu / 40 + ram / 80).toFixed(2), [cpu, ram])

  const engage = () => {
    setBurst(true)
    const extra = [
      nextOpsLine(),
      nextOpsLine(),
      nextOpsLine(),
    ]
    extra[0] = {
      id: `ops-engage-${Date.now()}`,
      ts: Date.now(),
      level: 'crit',
      tag: 'ENGAGE',
      text: 'operator override  full-rate stream  channels=wallet,tls,http,mem',
    }
    setLines((prev) => [...prev, ...extra].slice(-120))
    window.setTimeout(() => setBurst(false), 9000)
  }

  return (
    <div className="space-y-3">
      <style>{`
        @keyframes opsScan { 0% { transform: translateY(-100%); } 100% { transform: translateY(380%); } }
        @keyframes opsRadar { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes opsPulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
        @keyframes opsFlicker { 0%, 97%, 100% { opacity: 1; } 98% { opacity: .72; } }
      `}</style>

      <div className="rounded-lg border border-[#1a2633] bg-[#070c12] px-3 py-2.5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#6b7787]">SOL review bot</p>
          <p className="mt-1 text-[12px] text-[#9ca8b8]">
            {rejectBot
              ? `Last step: ${rejectBot.lastStep}${rejectBot.note ? ` · ${rejectBot.note}` : ''}`
              : 'Turn the bot on here. It stays off until you start it.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-[11px] font-bold tracking-[0.14em] ${
              rejectBot?.state === 'running' ? 'text-[#7dffb3]' : 'text-[#ff7a7a]'
            }`}
          >
            {rejectBot?.state === 'running' ? 'RUNNING' : 'STOPPED'}
          </span>
          <button
            type="button"
            onClick={() => void toggleRejectBot()}
            disabled={botBusy}
            className={`rounded-full px-3.5 py-1.5 text-[11px] font-bold disabled:opacity-50 ${
              rejectBot?.state === 'running'
                ? 'bg-[#ff7a7a] text-[#1a0808]'
                : 'bg-[#c7f284] text-[#07110c]'
            }`}
          >
            {botBusy ? 'Working…' : rejectBot?.state === 'running' ? 'Turn off' : 'Turn on'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#0d1a12] border border-[#2a4a32] flex items-center justify-center">
            <Terminal className="w-4 h-4 text-[#c7f284]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[15px] font-semibold text-white tracking-wide">OPS / live intercept</h1>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] text-[#7dffb3]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7dffb3] animate-[opsPulse_1.1s_ease_infinite]" />
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-[#6b7787] font-mono mt-0.5">
              root@vrfd-ops · tty/01 · pid 1044 · load {loadAvg}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={engage}
          className="self-start lg:self-auto px-3.5 py-2 rounded-md text-[11px] font-semibold bg-[#c7f284] text-[#07110c] hover:bg-[#d7ff9a] flex items-center gap-2"
        >
          <Zap className="w-3.5 h-3.5" />
          {burst ? 'Stream elevated' : 'Elevate stream'}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <Metric label="CPU" value={`${cpu.toFixed(0)}%`} sub="sched/irq" icon={Cpu} />
        <Metric label="Mem" value={`${ram.toFixed(0)}%`} sub="heap + ring" icon={Activity} />
        <Metric label="Net I/O" value={`${net.toFixed(0)}%`} sub={`${packets.toLocaleString()} pkt`} icon={Radio} />
        <Metric label="Uptime" value={formatClock(uptime)} sub="session clock" icon={Shield} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        <section className="xl:col-span-7 bg-[#05080c] border border-[#1a2633] rounded-lg overflow-hidden min-h-[440px] flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#1a2633] bg-[#080d13]">
            <p className="text-[10px] font-mono tracking-[0.2em] text-[#7dffb3]">/dev/ttyS0  ·  intercept.log</p>
            <p className="text-[10px] font-mono text-[#5d6b7a]">{lines.length} events</p>
          </div>
          <div className="relative flex-1">
            <div
              className="pointer-events-none absolute inset-x-0 h-10 bg-gradient-to-b from-[#7dffb3]/10 to-transparent z-10 animate-[opsScan_3.4s_linear_infinite]"
            />
            <div
              ref={termRef}
              className="absolute inset-0 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-[1.55] animate-[opsFlicker_8s_linear_infinite]"
            >
              {lines.map((line) => (
                <p key={line.id} className="whitespace-nowrap">
                  <span className="text-[#3e4c5a]">{formatStamp(line.ts)}</span>
                  <span className="text-[#4a5d4f] mx-2">{line.tag.padEnd(5, ' ')}</span>
                  <span className={LEVEL_COLOR[line.level]}>{line.text}</span>
                </p>
              ))}
              <p className="text-[#c7f284]">
                <span className="text-[#3e4c5a]">{formatStamp(now)}</span>
                <span className="mx-2 text-[#4a5d4f]">IN   </span>
                <span className="animate-pulse">█</span>
              </p>
            </div>
          </div>
        </section>

        <section className="xl:col-span-5 space-y-3">
          <div className="bg-[#070c12] border border-[#1a2633] rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-[#1a2633] flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#6b7787]">Targets</p>
              <span className="text-[10px] font-mono text-[#7dffb3]">{targets.filter((t) => t.state === 'LIVE').length} live</span>
            </div>
            <table className="w-full text-[11px] font-mono">
              <tbody>
                {targets.map((t) => (
                  <tr key={t.host} className="border-t border-[#121a22]">
                    <td className="px-3 py-1.5 text-[#d5dde6]">{t.host}</td>
                    <td className="px-2 py-1.5 text-[#6b7787] hidden sm:table-cell">{t.ip}</td>
                    <td className="px-2 py-1.5 text-[#8ad4ff]">{t.port}/{t.proto}</td>
                    <td className={`px-3 py-1.5 text-right ${STATE_COLOR[t.state]}`}>{t.state}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#070c12] border border-[#1a2633] rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#6b7787] mb-2">Sweep</p>
              <div className="relative mx-auto w-[132px] h-[132px]">
                <div className="absolute inset-0 rounded-full border border-[#1f3d2a]" />
                <div className="absolute inset-5 rounded-full border border-[#1f3d2a]" />
                <div className="absolute inset-10 rounded-full border border-[#2a5538]" />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#1f3d2a]" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-[#1f3d2a]" />
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      'conic-gradient(from 0deg, transparent 0deg, rgba(125,255,179,0.4) 26deg, transparent 58deg)',
                    animation: 'opsRadar 2.6s linear infinite',
                  }}
                />
                <span className="absolute left-[22%] top-[30%] w-1.5 h-1.5 rounded-full bg-[#7dffb3] shadow-[0_0_8px_#7dffb3]" />
                <span className="absolute right-[24%] bottom-[28%] w-1 h-1 rounded-full bg-[#f5d36c]" />
                <span className="absolute right-[38%] top-[22%] w-1 h-1 rounded-full bg-[#8ad4ff]" />
              </div>
            </div>
            <div className="bg-[#070c12] border border-[#1a2633] rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#6b7787] mb-2">Hex / ring</p>
              <div className="font-mono text-[9px] leading-[1.45] text-[#5ee0a0] break-all">
                {Array.from({ length: 8 }, (_, i) => (
                  <p key={i} className="text-[#4a5d4f]">
                    <span className="text-[#3e4c5a]">{pad(i * 16, 4)}  </span>
                    {hexRows.slice(i * 8, i * 8 + 8).join(' ')}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#070c12] border border-[#1a2633] rounded-lg p-3 space-y-2.5">
            {[
              { label: 'payload inject', value: inject, color: 'bg-[#c7f284]' },
              { label: 'exfil buffer', value: exfil, color: 'bg-[#8ad4ff]' },
              { label: 'keystroke capture', value: capture, color: 'bg-[#f5d36c]' },
            ].map((bar) => (
              <div key={bar.label}>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#6b7787] mb-1">
                  <span className="uppercase tracking-[0.14em]">{bar.label}</span>
                  <span className="text-[#d5dde6]">{bar.value.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#121a22] overflow-hidden">
                  <div className={`h-full ${bar.color}`} style={{ width: `${Math.min(100, bar.value)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
