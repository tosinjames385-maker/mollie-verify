/**
 * API base URL. In dev, leave VITE_API_URL unset and Vite proxies `/api` → localhost:3001.
 * On Vercel (static), set VITE_API_URL to your hosted Express URL (no trailing slash).
 */
export function resolveApiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  const base = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
  return base ? `${base}${normalized}` : normalized
}

export function isApiConfiguredForProduction(): boolean {
  if (import.meta.env.DEV) return true
  return Boolean(String(import.meta.env.VITE_API_URL || '').trim())
}
