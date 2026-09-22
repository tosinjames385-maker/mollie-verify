/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://jdnfpchddosbxejezkgk.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbmZwY2hkZG9zYnhlamV6a2drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NzM1MjYsImV4cCI6MjEwNTI0OTUyNn0.CMIMrmAuHkEV6qYMfzD2_nCY8ndxZLhQcm8-ZKRfR04'

function isUsableSupabaseUrl(value: string): boolean {
  const url = value.trim()
  if (!url) return false
  const lower = url.toLowerCase()
  if (
    lower.includes('your_project') ||
    lower.includes('your-project') ||
    lower.includes('xxxx.supabase') ||
    lower.includes('your_project_ref')
  ) {
    return false
  }
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('.supabase.co')
  } catch {
    return false
  }
}

function isUsableAnonKey(value: string): boolean {
  const key = value.trim()
  return key.startsWith('eyJ') && key.length > 40 && !key.toLowerCase().includes('your_supabase')
}

const envUrl = String(import.meta.env.VITE_SUPABASE_URL || '')
const envKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '')

const supabaseUrl = isUsableSupabaseUrl(envUrl) ? envUrl.replace(/\/$/, '') : DEFAULT_SUPABASE_URL
const supabaseAnonKey = isUsableAnonKey(envKey) ? envKey : DEFAULT_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
})
