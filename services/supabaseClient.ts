import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";

// ⚙️ MODO GOOGLE AI STUDIO — chaves fixas públicas (anon key segura)
const supabaseUrl = "https://ilzbcfamqkfcochldtxn.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsemJjZmFtcWtmY29jaGxkdHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MTUzNTIsImV4cCI6MjA3NzE5MTM1Mn0.ywCtrjlKOIN6OYBDdvP7f5o5L7_rPUhMZXRDv2DczDk";

// Cria o cliente Supabase
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
