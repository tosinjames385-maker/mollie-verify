import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bot, Cpu, Radio, Shield, Zap } from 'lucide-react'
import { adminFetchJson } from '../../lib/adminDemo'

interface BotStatus {
  mode: string
  armed: boolean
  uptimeMs: number
  nodes: number
  cpu: number
  ram: number
  latencyMs: number
  packets: number
  label: string
}

interface FeedLine {
  id: string
  ts: string
  line: string
}

const FALLBACK_STATUS: BotStatus = {
  mode: 'standby',
  armed: false,
  uptimeMs: 0,
  nodes: 12,
  cpu: 22,
  ram: 44,
  latencyMs: 14,
  packets: 9100,
  label: 'SIMULATION — bot performs no live actions',
}

function formatUptime(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function MatrixRain() {
  const cols = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        delay: `${(i % 7) * 0.35}s`,
        duration: `${3.2 + (i % 5) * 0.4}s`,
        chars: '01ABCDEF<>/\\$#*'.repeat(8),
      })),
    []
  )
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.18]">
      <div className="flex h-full gap-2 font-mono text-[10px] leading-3 text-[#c7f284]">
        {cols.map((c, i) => (
          <div
            key={i}
            className="animate-[botfall_4s_linear_infinite] whitespace-pre"
            style={{ animationDelay: c.delay, animationDuration: c.duration }}
          >
            {c.chars.split('').join('\n')}
          </div>
        ))}
      </div>
    </div>
  )
}

export const AdminBotConsole: React.FC = () => {
  const [status, setStatus] = useState<BotStatus>(FALLBACK_STATUS)
  const [feed, setFeed] = useState<FeedLine[]>([])
  const [running, setRunning] = useState(false)
  const [bootLines, setBootLines] = useState<string[]>([])

  const load = useCallback(async () => {
    const data = await adminFetchJson<{ status: BotStatus; feed: FeedLine[] }>(
      '/api/admin/bot/feed',
      { status: FALLBACK_STATUS, feed: [] }
    )
    if (data.status) setStatus({ ...FALLBACK_STATUS, ...data.status })
    if (data.feed?.length) setFeed(data.feed)
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 1600)
    return () => clearInterval(id)
  }, [load])

  const runSequence = () => {
    if (running) return
    setRunning(true)
    const seq = [
      '> INIT SEQUENCE ………… accepted',
      '> allocate virtual nodes …… 12/12',
      '> overlay holo-grid ………… ok',
      '> bind wallet-watch channel … idle',
      '> inject cinematic payload … visual only',
      '> RESULT: STANDBY — no live action executed',
    ]
    setBootLines([])
    seq.forEach((line, i) => {
      setTimeout(() => {
        setBootLines((prev) => [...prev, line])
        if (i === seq.length - 1) setRunning(false)
      }, 380 * (i + 1))
    })
  }

  return (
    <div className="space-y-4">
      <style>{`
        @keyframes botfall { from { transform: translateY(-40%); } to { transform: translateY(40%); } }
        @keyframes botscan { 0% { top: 0%; } 100% { top: 100%; } }
        @keyframes botradar { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#c7f284]" />
            <h1 className="text-xl font-bold text-white tracking-wide">Bot console</h1>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300/90 border border-amber-400/30 px-2 py-0.5 rounded">
              Simulation
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-xl">
            Cinematic operator interface for your presentation. The bot is idle — it does not scan, steal, or send
            anything.
          </p>
        </div>
        <button
          type="button"
          onClick={runSequence}
          disabled={running}
          className="px-4 py-2 rounded-lg text-xs font-bold bg-[#c7f284] text-[#06090E] hover:bg-[#b7e374] disabled:opacity-50 flex items-center gap-2"
        >
          <Zap className="w-3.5 h-3.5" />
          {running ? 'Running sequence…' : 'Initiate sequence'}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Mode', value: status.mode.toUpperCase(), icon: Shield },
          { label: 'Nodes', value: String(status.nodes).padStart(2, '0'), icon: Radio },
          { label: 'CPU', value: `${status.cpu}%`, icon: Cpu },
          { label: 'Uptime', value: formatUptime(status.uptimeMs), icon: Bot },
        ].map((s) => (
          <div key={s.label} className="bg-[#0B1118] border border-[#16212D] rounded-xl p-3">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500">
              {s.label}
              <s.icon className="w-3.5 h-3.5 text-[#c7f284]" />
            </div>
            <p className="text-lg font-mono font-bold text-[#c7f284] mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 relative bg-black border border-[#1a3a24] rounded-xl overflow-hidden min-h-[380px]">
          <MatrixRain />
          <div className="absolute left-0 right-0 h-px bg-[#c7f284]/40 animate-[botscan_3.8s_linear_infinite] z-10" />
          <div className="relative z-20 p-4 font-mono">
            <p className="text-[10px] text-[#6ee7a0] tracking-[0.25em] mb-3">ROOT@VRFD-BOT // TTY-01</p>
            <div className="space-y-1 text-[11px] text-[#9ae6b4] max-h-[240px] overflow-hidden">
              {feed.map((f) => (
                <p key={f.id} className="truncate">
                  <span className="text-[#4ade80]/60">{new Date(f.ts).toLocaleTimeString()}</span> {f.line}
                </p>
              ))}
            </div>
            {bootLines.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[#1a3a24] space-y-1 text-[11px] text-[#c7f284]">
                {bootLines.map((l) => (
                  <p key={l}>{l}</p>
                ))}
              </div>
            )}
            <p className="mt-4 text-[#c7f284] animate-pulse">█</p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-[#0B1118] border border-[#16212D] rounded-xl p-4 flex flex-col">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-3">Holo grid</p>
          <div className="relative mx-auto w-48 h-48">
            <div className="absolute inset-0 rounded-full border border-[#c7f284]/20" />
            <div className="absolute inset-4 rounded-full border border-[#c7f284]/20" />
            <div className="absolute inset-10 rounded-full border border-[#c7f284]/30" />
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  'conic-gradient(from 0deg, transparent 0deg, rgba(199,243,132,0.35) 40deg, transparent 70deg)',
                animation: 'botradar 4s linear infinite',
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-mono text-[#c7f284]">STANDBY</span>
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-[#060A0E] rounded-lg p-2 border border-[#16212D]">
              <dt className="text-gray-500">Latency</dt>
              <dd className="font-mono text-white">{status.latencyMs} ms</dd>
            </div>
            <div className="bg-[#060A0E] rounded-lg p-2 border border-[#16212D]">
              <dt className="text-gray-500">Packets</dt>
              <dd className="font-mono text-white">{status.packets.toLocaleString()}</dd>
            </div>
            <div className="bg-[#060A0E] rounded-lg p-2 border border-[#16212D] col-span-2">
              <dt className="text-gray-500">Policy</dt>
              <dd className="text-[#c7f284] mt-0.5">{status.label}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
