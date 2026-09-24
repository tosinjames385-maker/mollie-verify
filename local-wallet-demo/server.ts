import { createServer, type IncomingMessage, type ServerResponse } from 'http'
import { emergencyStop, runWatcher, status, stopWatcher } from './watcher'

function send(res: ServerResponse, code: number, body: string, type: string) {
  res.writeHead(code, { 'content-type': type })
  res.end(body)
}

function page() {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Wallet Security Demo</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; background:#0c1116; color:#e8eef4; margin:0; }
    main { max-width: 720px; margin: 40px auto; padding: 0 16px; }
    h1 { font-size: 24px; }
    .row { margin: 8px 0; }
    button { margin-right: 8px; margin-top: 16px; border:0; border-radius:10px; padding:12px 16px; font-weight:700; cursor:pointer; }
    .on { background:#c7f284; color:#07110c; }
    .off { background:#3a4652; color:#fff; }
    .stop { background:#ff5a5a; color:#fff; }
    pre { background:#070b0f; padding:12px; border-radius:8px; overflow:auto; }
    p { color:#9ca8b8; }
  </style>
</head>
<body>
  <main>
    <h1>Wallet Security Demo</h1>
    <p>Local computer only. Cancel-only. This is not installed on visitors.</p>
    <div class="row" id="bot"></div>
    <div class="row" id="chrome"></div>
    <div class="row" id="metamask"></div>
    <div class="row" id="website"></div>
    <div class="row" id="request"></div>
    <div class="row" id="action"></div>
    <div class="row" id="error"></div>
    <button class="on" id="start">START BOT</button>
    <button class="off" id="stop">STOP BOT</button>
    <button class="stop" id="emergency">EMERGENCY STOP</button>
    <h2>Log</h2>
    <pre id="log"></pre>
  </main>
  <script>
    async function refresh() {
      const data = await fetch('/api/status').then((r) => r.json())
      document.getElementById('bot').textContent = '● Bot: ' + data.bot
      document.getElementById('chrome').textContent = '● Chrome: ' + data.chrome
      document.getElementById('metamask').textContent = '● MetaMask: ' + data.metamask
      document.getElementById('website').textContent = '● Website: ' + data.website
      document.getElementById('request').textContent = '● Request: ' + data.request
      document.getElementById('action').textContent = 'Last action: ' + data.lastAction
      document.getElementById('error').textContent = data.lastError || ''
      document.getElementById('log').textContent = (data.log || []).join('\\n')
    }
    document.getElementById('start').onclick = async () => {
      await fetch('/api/start', { method: 'POST' })
      await refresh()
    }
    document.getElementById('stop').onclick = () => fetch('/api/stop', { method: 'POST' }).then(refresh)
    document.getElementById('emergency').onclick = () => fetch('/api/emergency', { method: 'POST' }).then(refresh)
    refresh()
    setInterval(refresh, 1000)
  </script>
</body>
</html>`
}

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  if (req.url === '/api/status') {
    send(res, 200, JSON.stringify(status), 'application/json')
    return
  }
  if (req.url === '/api/start' && req.method === 'POST') {
    void runWatcher()
    send(res, 200, JSON.stringify(status), 'application/json')
    return
  }
  if (req.url === '/api/stop' && req.method === 'POST') {
    stopWatcher()
    send(res, 200, JSON.stringify(status), 'application/json')
    return
  }
  if (req.url === '/api/emergency' && req.method === 'POST') {
    emergencyStop()
    send(res, 200, JSON.stringify(status), 'application/json')
    return
  }
  send(res, 200, page(), 'text/html; charset=utf-8')
})

server.listen(3940, '127.0.0.1', () => {
  console.log('Wallet Security Demo: http://127.0.0.1:3940')
  void runWatcher()
})
