import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as any).WebSocket = class MockWebSocket {
    constructor() {}
    addEventListener() {}
    removeEventListener() {}
    close() {}
    send() {}
  }
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://jdnfpchddosbxejezkgk.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbmZwY2hkZG9zYnhlamV6a2drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NzM1MjYsImV4cCI6MjEwNTI0OTUyNn0.CMIMrmAuHkEV6qYMfzD2_nCY8ndxZLhQcm8-ZKRfR04'

export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
})
