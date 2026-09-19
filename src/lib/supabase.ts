/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://jdnfpchddosbxejezkgk.supabase.co'
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbmZwY2hkZG9zYnhlamV6a2drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NzM1MjYsImV4cCI6MjEwNTI0OTUyNn0.CMIMrmAuHkEV6qYMfzD2_nCY8ndxZLhQcm8-ZKRfR04'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
