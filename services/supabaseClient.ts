import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase'; // Este tipo será gerado pelo Supabase CLI

// ATENÇÃO: Substitua pelos valores do seu projeto Supabase!
// Vá para Project Settings > API no seu dashboard Supabase.
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
    console.warn('Variáveis de ambiente do Supabase não configuradas. A aplicação usará placeholders e falhará ao conectar.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
