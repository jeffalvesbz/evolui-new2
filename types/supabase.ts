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
          is_secret: boolean
        }
        Insert: {
          id: string
          name: string
          description: string
          icon: string
          xp: number
          is_secret?: boolean
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon?: string
          xp?: number
          is_secret?: boolean
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
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          study_plan_id: string
          nome: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          study_plan_id?: string
          nome?: string
          created_at?: string
        }
      }
      disciplinas: {
        Row: {
          id: string
          user_id: string
          study_plan_id: string
          nome: string
          anotacoes: string | null
          created_at: string
          progresso: number
        }
        Insert: {
          id?: string
          user_id: string
          study_plan_id: string
          nome: string
          anotacoes?: string | null
          created_at?: string
          progresso?: number
        }
        Update: {
          id?: string
          user_id?: string
          study_plan_id?: string
          nome?: string
          anotacoes?: string | null
          created_at?: string
          progresso?: number
        }
      }
      flashcard_decks_default: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          categoria: string | null
          visivel: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          categoria?: string | null
          visivel?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string | null
          categoria?: string | null
          visivel?: boolean
          created_at?: string
        }
        Relationships: []
      }
      flashcards_default: {
        Row: {
          id: string
          deck_id: string
          pergunta: string
          resposta: string
          tags: string[] | null
          ordem: number
          created_at: string
        }
        Insert: {
          id?: string
          deck_id: string
          pergunta: string
          resposta: string
          tags?: string[] | null
          ordem?: number
          created_at?: string
        }
        Update: {
          id?: string
          deck_id?: string
          pergunta?: string
          resposta?: string
          tags?: string[] | null
          ordem?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'flashcards_default_deck_id_fkey'
            columns: ['deck_id']
            referencedRelation: 'flashcard_decks_default'
            referencedColumns: ['id']
          }
        ]
      }
      editais_default: {
        Row: {
          id: string
          nome: string
          banca: string | null
          ano: number | null
          cargo: string | null
          created_at: string
          status_validacao: 'pendente' | 'aprovado' | 'oculto' | null
        }
        Insert: {
          id?: string
          nome: string
          banca?: string | null
          ano?: number | null
          cargo?: string | null
          created_at?: string
          status_validacao?: 'pendente' | 'aprovado' | 'oculto' | null
        }
        Update: {
          id?: string
          nome?: string
          banca?: string | null
          ano?: number | null
          cargo?: string | null
          created_at?: string
          status_validacao?: 'pendente' | 'aprovado' | 'oculto' | null
        }
        Relationships: []
      }
      solicitacoes_editais: {
        Row: {
          id: string
          user_id: string
          nome_edital: string
          banca: string | null
          cargo: string | null
          ano: number | null
          link_edital: string | null
          arquivo_pdf_url: string | null
          observacoes: string | null
          status: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado'
          edital_default_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nome_edital: string
          banca?: string | null
          cargo?: string | null
          ano?: number | null
          link_edital?: string | null
          arquivo_pdf_url?: string | null
          observacoes?: string | null
          status?: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado'
          edital_default_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nome_edital?: string
          banca?: string | null
          cargo?: string | null
          ano?: number | null
          link_edital?: string | null
          arquivo_pdf_url?: string | null
          observacoes?: string | null
          status?: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado'
          edital_default_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'solicitacoes_editais_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'solicitacoes_editais_edital_default_id_fkey'
            columns: ['edital_default_id']
            referencedRelation: 'editais_default'
            referencedColumns: ['id']
          }
        ]
      }
      disciplinas_default: {
        Row: {
          id: string
          edital_default_id: string
          nome: string
          ordem: number | null
          created_at: string
        }
        Insert: {
          id?: string
          edital_default_id: string
          nome: string
          ordem?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          edital_default_id?: string
          nome?: string
          ordem?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'disciplinas_default_edital_default_id_fkey'
            columns: ['edital_default_id']
            referencedRelation: 'editais_default'
            referencedColumns: ['id']
          }
        ]
      }
      flashcards: {
        Row: {
          id: string
          user_id: string
          topico_id: string
          pergunta: string
          resposta: string
          interval: number
          ease_factor: number
          due_date: string
          created_at: string
          estilo: string | null
        }
        Insert: {
          id?: string
          user_id: string
          topico_id: string
          pergunta: string
          resposta: string
          interval?: number
          ease_factor?: number
          due_date?: string
          created_at?: string
          estilo?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          topico_id?: string
          pergunta?: string
          resposta?: string
          interval?: number
          ease_factor?: number
          due_date?: string
          created_at?: string
          estilo?: string | null
        }
      }
      friendships: {
        Row: {
          id: string
          user_id_1: string
          user_id_2: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id_1: string
          user_id_2: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id_1?: string
          user_id_2?: string
          status?: string
          created_at?: string
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
          created_at: string
          has_seen_onboarding?: boolean
          active_edital_id?: string | null
          is_admin?: boolean
        }
        Insert: {
          user_id: string
          name: string
          email: string
          xp_total?: number
          current_streak_days?: number
          best_streak_days?: number
          created_at?: string
          has_seen_onboarding?: boolean
          active_edital_id?: string | null
          is_admin?: boolean
        }
        Update: {
          user_id?: string
          name?: string
          email?: string
          xp_total?: number
          current_streak_days?: number
          best_streak_days?: number
          created_at?: string
          has_seen_onboarding?: boolean
          active_edital_id?: string | null
          is_admin?: boolean
        }
      }
      redacoes_corrigidas: {
        Row: {
          id: string
          user_id: string
          study_plan_id: string
          texto: string
          banca: string
          nota_maxima: number
          tema: string | null
          correcao: Json
          data: string
        }
        Insert: {
          id?: string
          user_id: string
          study_plan_id: string
          texto: string
          banca: string
          nota_maxima: number
          tema?: string | null
          correcao: Json
          data?: string
        }
        Update: {
          id?: string
          user_id?: string
          study_plan_id?: string
          texto?: string
          banca?: string
          nota_maxima?: number
          tema?: string | null
          correcao?: Json
          data?: string
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
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          study_plan_id: string
          topico_id: string
          tempo_estudado: number
          data_estudo: string
          comentarios?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          study_plan_id?: string
          topico_id?: string
          tempo_estudado?: number
          data_estudo?: string
          comentarios?: string | null
          created_at?: string
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
          duration_minutes: number
          notes: string | null
          date: string
          is_cebraspe: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          study_plan_id: string
          name: string
          correct: number
          wrong: number
          blank?: number | null
          duration_minutes: number
          notes?: string | null
          date: string
          is_cebraspe?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          study_plan_id?: string
          name?: string
          correct?: number
          wrong?: number
          blank?: number | null
          duration_minutes?: number
          notes?: string | null
          date?: string
          is_cebraspe?: boolean | null
          created_at?: string
        }
      }
      study_plans: {
        Row: {
          id: string
          user_id: string
          nome: string
          descricao: string | null
          data_alvo: string | null
          banca: string | null
          orgao: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nome: string
          descricao?: string | null
          data_alvo?: string | null
          banca?: string | null
          orgao?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nome?: string
          descricao?: string | null
          data_alvo?: string | null
          banca?: string | null
          orgao?: string | null
          created_at?: string
        }
      }
      topicos_default: {
        Row: {
          id: string
          disciplina_default_id: string
          nome: string
          ordem: number | null
          created_at: string
        }
        Insert: {
          id?: string
          disciplina_default_id: string
          nome: string
          ordem?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          disciplina_default_id?: string
          nome?: string
          ordem?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'topicos_default_disciplina_default_id_fkey'
            columns: ['disciplina_default_id']
            referencedRelation: 'disciplinas_default'
            referencedColumns: ['id']
          }
        ]
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
          created_at: string
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
          created_at?: string
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
          created_at?: string
        }
      }
      user_badges: {
        Row: {
          user_id: string
          badge_id: string
          unlocked_at: string
        }
        Insert: {
          user_id: string
          badge_id: string
          unlocked_at?: string
        }
        Update: {
          user_id?: string
          badge_id?: string
          unlocked_at?: string
        }
      }
      xp_log: {
        Row: {
          id: number
          user_id: string
          event: string
          amount: number
          meta_json: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          event: string
          amount: number
          meta_json?: Json | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          event?: string
          amount?: number
          meta_json?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clone_edital_default: {
        Args: {
          edital_default_id: string
          user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
