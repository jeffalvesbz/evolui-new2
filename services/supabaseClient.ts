import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";

// ⚙️ Configuração com variáveis de ambiente (recomendado para produção)
// SEM fallback - variáveis de ambiente são obrigatórias
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isProduction = import.meta.env.PROD;

// Validação rigorosa das variáveis de ambiente
if (!supabaseUrl || !supabaseAnonKey) {
<<<<<<< HEAD
  const errorMessage =
    'CRÍTICO: Variáveis de ambiente do Supabase não configuradas! ' +
    'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente.';

=======
  const errorMessage = 
    'CRÍTICO: Variáveis de ambiente do Supabase não configuradas! ' +
    'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente.';
  
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
  if (isProduction) {
    // Em produção, lançar erro para evitar execução com credenciais inválidas
    throw new Error(errorMessage);
  } else {
    // Em desenvolvimento, apenas avisar (mas ainda assim não funcionará)
    console.error('⚠️', errorMessage);
    console.error('💡 Crie um arquivo .env.local com as variáveis necessárias');
<<<<<<< HEAD
    console.error('💡 URL atual:', supabaseUrl || 'NÃO CONFIGURADA');
    console.error('💡 Key configurada:', supabaseAnonKey ? 'SIM' : 'NÃO');
=======
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
  }
}

// Validação de formato básico das credenciais
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  throw new Error('VITE_SUPABASE_URL deve ser uma URL HTTPS válida');
}

if (supabaseAnonKey && supabaseAnonKey.length < 100) {
  console.warn('⚠️ VITE_SUPABASE_ANON_KEY parece estar incompleta ou inválida');
}

<<<<<<< HEAD
// Cria o cliente Supabase com configurações otimizadas
export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      // Usar localStorage para persistência de sessão
      storage: window.localStorage,
      // Tentar recuperar sessão automaticamente
      autoRefreshToken: true,
      // Detectar mudanças de sessão
      detectSessionInUrl: true,
      // Persistir sessão entre reloads
      persistSession: true,
      // Configurações de flow
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'evolui-app'
      }
    }
  }
=======
// Cria o cliente Supabase
export const supabase = createClient<Database>(
  supabaseUrl || '', 
  supabaseAnonKey || ''
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
);
