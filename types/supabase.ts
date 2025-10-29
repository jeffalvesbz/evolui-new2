// types/supabase.ts
// Este arquivo é um placeholder. Para obter a tipagem completa e segura do seu banco de dados,
// você deve gerar este arquivo usando o Supabase CLI.
//
// 1. Instale o Supabase CLI: https://supabase.com/docs/guides/cli
// 2. Faça login: `supabase login`
// 3. Vincule seu projeto: `supabase link --project-ref <seu-project-ref>`
// 4. Gere os tipos: `supabase gen types typescript --linked > types/supabase.ts`
//
// Executar o comando acima irá substituir este arquivo com os tipos reais do seu banco de dados.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Adicione aqui as definições de suas tabelas como exemplo,
      // mas o ideal é que o CLI gere isso para você.
      editais: {
        Row: {
          id: string
          nome: string
          descricao: string
          data_alvo: string
          banca?: string
          orgao?: string
          user_id: string
        }
        Insert: {
          id?: string
          nome: string
          descricao: string
          data_alvo: string
          banca?: string
          orgao?: string
          user_id: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string
          data_alvo?: string
          banca?: string
          orgao?: string
          user_id?: string
        }
      }
      // ... outras tabelas (disciplinas, sessoes, etc.)
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
