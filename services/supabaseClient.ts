import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

// 🔒 Variáveis carregadas do ambiente do Vite/Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 🔐 Garante que não suba sem configuração
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Supabase environment variables are missing')
}

// ✅ Criação do cliente Supabase (frontend seguro)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true },
})
