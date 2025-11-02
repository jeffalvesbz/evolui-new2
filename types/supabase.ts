
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
      badges: {
        Row: {
          id: string
          name: string
          description: string
          icon: string
          xp: number
          is_secret: boolean | null
        }
        Insert: {
          id: string
          name: string
          description: string
          icon: string
          xp: number
          is_secret?: boolean | null
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon?: string
          xp?: number
          is_secret?: boolean | null
        }
      }
      caderno_erros: {
        Row: {
          id: string
          user_id: string
          study_plan_id: string
          disciplina_id: string
          topico_id: string | null
          assunto: string
          descricao: string
          resolvido: boolean
          data: string
          observacoes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          study_plan_id: string
          disciplina_id: string
          topico_id?: string | null
          assunto: string
          descricao: string
          resolvido?: boolean
          data: string
          observacoes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          study_plan_id?: string
          disciplina_id?: string
          topico_id?: string | null
          assunto?: string
          descricao?: string
          resolvido?: boolean
          data?: string
          observacoes?: string | null
          created_at?: string
        }
      }
      ciclos: {
        Row: {
          id: string
          user_id: string
          study_plan_id: string
          nome: string
        }
        Insert: {
          id?: string
          user_id: string
          study_plan_id: string
          nome: string
        }
        Update: {
          id?: string
          user_id?: string
          study_plan_id?: string
          nome?: string
        }
      }
      disciplinas: {
        Row: {
          id: string
          user_id: string
          study_plan_id: string
          nome: string
          progresso: number
          anotacoes: string
        }
        Insert: {
          id?: string
          user_id: string
          study_plan_id: string
          nome: string
          progresso: number
          anotacoes: string
        }
        Update: {
          id?: string
          user_id?: string
          study_plan_id?: string
          nome?: string
          progresso?: number
          anotacoes?: string
        }
      }
      flashcards: {
        Row: {
          id: string
          user_id: string
          topico_id: string
          pergunta: string
          resposta: string
          interval: number
          easeFactor: number
          dueDate: string
          estilo: string | null
        }
        Insert: {
          id?: string
          user_id: string
          topico_id: string
          pergunta: string
          resposta: string
          interval: number
          easeFactor: number
          dueDate: string
          estilo?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          topico_id?: string
          pergunta?: string
          resposta?: string
          interval?: number
          easeFactor?: number
          dueDate?: string
          estilo?: string | null
        }
      }
      profiles: {
        Row: {
          user_id: string
          name: string
          email: string
          xp_total: number
          current_streak_days: number
          best_streak_days: number
        }
        Insert: {
          user_id: string
          name: string
          email: string
          xp_total?: number
          current_streak_days?: number
          best_streak_days?: number
        }
        Update: {
          user_id?: string
          name?: string
          email?: string
          xp_total?: number
          current_streak_days?: number
          best_streak_days?: number
        }
      }
      redacoes_corrigidas: {
        Row: {
          id: string
          user_id: string
          study_plan_id: string
          texto: string
          banca: string
          notaMaxima: number
          correcao: Json
          data: string
          tema: string | null
        }
        Insert: {
          id?: string
          user_id: string
          study_plan_id: string
          texto: string
          banca: string
          notaMaxima: number
          correcao: Json
          data: string
          tema?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          study_plan_id?: string
          texto?: string
          banca?: string
          notaMaxima?: number
          correcao?: Json
          data?: string
          tema?: string | null
        }
      }
      revisoes: {
        Row: {
          id: string
          user_id: string
          study_plan_id: string
          topico_id: string
          disciplina_id: string
          conteudo: string
          data_prevista: string
          status: string
          origem: string
          dificuldade: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          study_plan_id: string
          topico_id: string
          disciplina_id: string
          conteudo: string
          data_prevista: string
          status?: string
          origem: string
          dificuldade?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          study_plan_id?: string
          topico_id?: string
          disciplina_id?: string
          conteudo?: string
          data_prevista?: string
          status?: string
          origem?: string
          dificuldade?: string
          created_at?: string
        }
      }
      sessoes_ciclo: {
        Row: {
          id: string
          user_id: string
          ciclo_id: string
          disciplina_id: string
          ordem: number
          tempo_previsto: number
        }
        Insert: {
          id?: string
          user_id: string
          ciclo_id: string
          disciplina_id: string
          ordem: number
          tempo_previsto: number
        }
        Update: {
          id?: string
          user_id?: string
          ciclo_id?: string
          disciplina_id?: string
          ordem?: number
          tempo_previsto?: number
        }
      }
      sessoes_estudo: {
        Row: {
          id: string
          user_id: string
          study_plan_id: string
          topico_id: string
          tempo_estudado: number
          data_estudo: string
          comentarios: string | null
        }
        Insert: {
          id?: string
          user_id: string
          study_plan_id: string
          topico_id: string
          tempo_estudado: number
          data_estudo: string
          comentarios?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          study_plan_id?: string
          topico_id?: string
          tempo_estudado?: number
          data_estudo?: string
          comentarios?: string | null
        }
      }
      simulados: {
        Row: {
          id: string
          user_id: string
          study_plan_id: string
          name: string
          correct: number
          wrong: number
          blank: number | null
          durationMinutes: number
          notes: string | null
          date: string
          isCebraspe: boolean | null
        }
        Insert: {
          id?: string
          user_id: string
          study_plan_id: string
          name: string
          correct: number
          wrong: number
          blank?: number | null
          durationMinutes: number
          notes?: string | null
          date: string
          isCebraspe?: boolean | null
        }
        Update: {
          id?: string
          user_id?: string
          study_plan_id?: string
          name?: string
          correct?: number
          wrong?: number
          blank?: number | null
          durationMinutes?: number
          notes?: string | null
          date?: string
          isCebraspe?: boolean | null
        }
      }
      study_plans: {
        Row: {
          id: string
          user_id: string
          nome: string
          descricao: string
          data_alvo: string
          banca: string | null
          orgao: string | null
        }
        Insert: {
          id?: string
          user_id: string
          nome: string
          descricao: string
          data_alvo: string
          banca?: string | null
          orgao?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          nome?: string
          descricao?: string
          data_alvo?: string
          banca?: string | null
          orgao?: string | null
        }
      }
      topicos: {
        Row: {
          id: string
          user_id: string
          disciplina_id: string
          titulo: string
          concluido: boolean
          nivel_dificuldade: string
          ultima_revisao: string | null
          proxima_revisao: string | null
        }
        Insert: {
          id?: string
          user_id: string
          disciplina_id: string
          titulo: string
          concluido?: boolean
          nivel_dificuldade?: string
          ultima_revisao?: string | null
          proxima_revisao?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          disciplina_id?: string
          titulo?: string
          concluido?: boolean
          nivel_dificuldade?: string
          ultima_revisao?: string | null
          proxima_revisao?: string | null
        }
      }
      user_badges: {
        Row: {
          id: number
          user_id: string
          badge_id: string
        }
        Insert: {
          id?: number
          user_id: string
          badge_id: string
        }
        Update: {
          id?: number
          user_id?: string
          badge_id?: string
        }
      }
      xp_log: {
        Row: {
          id: number
          user_id: string
          event: string
          amount: number
          meta_json: Json
          created_at: string
          tipo_evento: string | null
          multiplicador: number | null
        }
        Insert: {
          id?: number
          user_id: string
          event: string
          amount: number
          meta_json: Json
          created_at?: string
          tipo_evento?: string | null
          multiplicador?: number | null
        }
        Update: {
          id?: number
          user_id?: string
          event?: string
          amount?: number
          meta_json?: Json
          created_at?: string
          tipo_evento?: string | null
          multiplicador?: number | null
        }
      }
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
