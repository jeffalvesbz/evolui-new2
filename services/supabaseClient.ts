import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// -----------------------------------------------------------------------------
// ATENÇÃO: Substitua pelos valores do seu projeto Supabase!
// Você pode encontrar esses valores em: Project Settings > API no seu dashboard.
// -----------------------------------------------------------------------------
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder-anon-key') {
    console.warn('Variáveis de ambiente do Supabase não configuradas. A aplicação falhará ao conectar ao banco de dados. Insira suas credenciais reais no arquivo `services/supabaseClient.ts`.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);