import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";

// ⚙️ Configuração com variáveis de ambiente (recomendado para produção)
// Fallback para valores padrão se as variáveis não estiverem definidas (modo desenvolvimento)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://ilzbcfamqkfcochldtxn.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsemJjZmFtcWtmY29jaGxkdHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MTUzNTIsImV4cCI6MjA3NzE5MTM1Mn0.ywCtrjlKOIN6OYBDdvP7f5o5L7_rPUhMZXRDv2DczDk";

// Validação das variáveis de ambiente
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Variáveis de ambiente do Supabase não configuradas!');
  console.error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
}

// Cria o cliente Supabase
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
