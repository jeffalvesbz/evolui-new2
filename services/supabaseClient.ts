import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// -----------------------------------------------------------------------------
// ✅ Correto para Vite / Google AI Studio / Vercel
// -----------------------------------------------------------------------------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 🚨 Verificação para evitar erro em produção
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '❌ Erro: Variáveis do Supabase não configuradas. ' +
    'Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão no .env ou no Vercel.'
  );
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);
