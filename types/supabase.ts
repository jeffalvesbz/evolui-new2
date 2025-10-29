// types/supabase.ts
// Este arquivo define a estrutura completa do banco de dados para o Supabase.
// Para manter este arquivo atualizado, use a CLI do Supabase:
// `supabase gen types typescript --linked > types/supabase.ts`

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
          created_at: string
          description: string
          icon: string
          id: string
          is_secret: boolean | null
          name: string
          xp: number
        }
        Insert: {
          created_at?: string
          description: string
          icon: string
          id: string
          is_secret?: boolean | null
          name: string
          xp: number
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_secret?: boolean | null
          name?: string
          xp?: number
        }
        Relationships: []
      }
      ciclos: {
        Row: {
          created_at: string
          id: string
          nome: string
          sessoes: Json | null
          studyPlanId: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          sessoes?: Json | null
          studyPlanId: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          sessoes?: Json | null
          studyPlanId?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ciclos_studyPlanId_fkey"
            columns: ["studyPlanId"]
            referencedRelation: "editais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ciclos_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      disciplinas: {
        Row: {
          anotacoes: string | null
          created_at: string
          id: string
          nome: string
          progresso: number
          studyPlanId: string
          topicos: Json | null
          user_id: string
        }
        Insert: {
          anotacoes?: string | null
          created_at?: string
          id?: string
          nome: string
          progresso: number
          studyPlanId: string
          topicos?: Json | null
          user_id: string
        }
        Update: {
          anotacoes?: string | null
          created_at?: string
          id?: string
          nome?: string
          progresso?: number
          studyPlanId?: string
          topicos?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disciplinas_studyPlanId_fkey"
            columns: ["studyPlanId"]
            referencedRelation: "editais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinas_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      editais: {
        Row: {
          banca: string | null
          created_at: string
          data_alvo: string
          descricao: string | null
          id: string
          nome: string
          orgao: string | null
          user_id: string
        }
        Insert: {
          banca?: string | null
          created_at?: string
          data_alvo: string
          descricao?: string | null
          id?: string
          nome: string
          orgao?: string | null
          user_id: string
        }
        Update: {
          banca?: string | null
          created_at?: string
          data_alvo?: string
          descricao?: string | null
          id?: string
          nome?: string
          orgao?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "editais_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      erros: {
        Row: {
          alternativaCorreta: string | null
          assunto: string
          created_at: string
          data: string
          descricao: string
          disciplina: string
          disciplinaId: string
          enunciado: string | null
          id: string
          nivelDificuldade: Database["public"]["Enums"]["nivel_dificuldade"] | null
          observacoes: string | null
          proximaRevisao: string | null
          resolvido: boolean
          revisoes: Json | null
          studyPlanId: string
          topicoId: string | null
          topicoTitulo: string | null
          user_id: string
        }
        Insert: {
          alternativaCorreta?: string | null
          assunto: string
          created_at?: string
          data: string
          descricao: string
          disciplina: string
          disciplinaId: string
          enunciado?: string | null
          id?: string
          nivelDificuldade?: Database["public"]["Enums"]["nivel_dificuldade"] | null
          observacoes?: string | null
          proximaRevisao?: string | null
          resolvido: boolean
          revisoes?: Json | null
          studyPlanId: string
          topicoId?: string | null
          topicoTitulo?: string | null
          user_id: string
        }
        Update: {
          alternativaCorreta?: string | null
          assunto?: string
          created_at?: string
          data?: string
          descricao?: string
          disciplina?: string
          disciplinaId?: string
          enunciado?: string | null
          id?: string
          nivelDificuldade?: Database["public"]["Enums"]["nivel_dificuldade"] | null
          observacoes?: string | null
          proximaRevisao?: string | null
          resolvido?: boolean
          revisoes?: Json | null
          studyPlanId?: string
          topicoId?: string | null
          topicoTitulo?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "erros_disciplinaId_fkey"
            columns: ["disciplinaId"]
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erros_studyPlanId_fkey"
            columns: ["studyPlanId"]
            referencedRelation: "editais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erros_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      flashcards: {
        Row: {
          created_at: string
          dueDate: string
          easeFactor: number
          estilo: string | null
          id: string
          interval: number
          pergunta: string
          resposta: string
          topico_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dueDate: string
          easeFactor: number
          estilo?: string | null
          id?: string
          interval: number
          pergunta: string
          resposta: string
          topico_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          dueDate?: string
          easeFactor?: number
          estilo?: string | null
          id?: string
          interval?: number
          pergunta?: string
          resposta?: string
          topico_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      friendships: {
        Row: {
          created_at: string
          id: string
          status: Database["public"]["Enums"]["friendship_status"]
          user_id_1: string
          user_id_2: string
        }
        Insert: {
          created_at?: string
          id?: string
          status: Database["public"]["Enums"]["friendship_status"]
          user_id_1: string
          user_id_2: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["friendship_status"]
          user_id_1?: string
          user_id_2?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_user_id_1_fkey"
            columns: ["user_id_1"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_2_fkey"
            columns: ["user_id_2"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      gamification_user_stats: {
        Row: {
          best_streak_days: number
          current_streak_days: number
          level: number
          unlockedBadgeIds: string[] | null
          updated_at: string
          user_id: string
          xp_total: number
        }
        Insert: {
          best_streak_days?: number
          current_streak_days?: number
          level?: number
          unlockedBadgeIds?: string[] | null
          updated_at?: string
          user_id: string
          xp_total?: number
        }
        Update: {
          best_streak_days?: number
          current_streak_days?: number
          level?: number
          unlockedBadgeIds?: string[] | null
          updated_at?: string
          user_id?: string
          xp_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "gamification_user_stats_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      gamification_xp_log: {
        Row: {
          amount: number
          created_at: string
          event: Database["public"]["Enums"]["xp_log_event"]
          id: string
          meta_json: Json
          multiplicador: number | null
          tipo_evento: Database["public"]["Enums"]["xp_log_tipo"] | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          event: Database["public"]["Enums"]["xp_log_event"]
          id?: string
          meta_json: Json
          multiplicador?: number | null
          tipo_evento?: Database["public"]["Enums"]["xp_log_tipo"] | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          event?: Database["public"]["Enums"]["xp_log_event"]
          id?: string
          meta_json?: Json
          multiplicador?: number | null
          tipo_evento?: Database["public"]["Enums"]["xp_log_tipo"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_xp_log_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      redacoes: {
        Row: {
          banca: string
          correcao: Json
          created_at: string
          data: string
          id: string
          notaMaxima: number
          studyPlanId: string
          tema: string | null
          texto: string
          user_id: string
        }
        Insert: {
          banca: string
          correcao: Json
          created_at?: string
          data: string
          id?: string
          notaMaxima: number
          studyPlanId: string
          tema?: string | null
          texto: string
          user_id: string
        }
        Update: {
          banca?: string
          correcao?: Json
          created_at?: string
          data?: string
          id?: string
          notaMaxima?: number
          studyPlanId?: string
          tema?: string | null
          texto?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redacoes_studyPlanId_fkey"
            columns: ["studyPlanId"]
            referencedRelation: "editais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redacoes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      revisoes: {
        Row: {
          conteudo: string
          created_at: string
          data_prevista: string
          dificuldade: Database["public"]["Enums"]["nivel_dificuldade"]
          disciplinaId: string
          id: string
          origem: Database["public"]["Enums"]["revisao_origem"]
          status: Database["public"]["Enums"]["revisao_status"]
          studyPlanId: string
          topico_id: string
          user_id: string
        }
        Insert: {
          conteudo: string
          created_at?: string
          data_prevista: string
          dificuldade: Database["public"]["Enums"]["nivel_dificuldade"]
          disciplinaId: string
          id?: string
          origem: Database["public"]["Enums"]["revisao_origem"]
          status: Database["public"]["Enums"]["revisao_status"]
          studyPlanId: string
          topico_id: string
          user_id: string
        }
        Update: {
          conteudo?: string
          created_at?: string
          data_prevista?: string
          dificuldade?: Database["public"]["Enums"]["nivel_dificuldade"]
          disciplinaId?: string
          id?: string
          origem?: Database["public"]["Enums"]["revisao_origem"]
          status?: Database["public"]["Enums"]["revisao_status"]
          studyPlanId?: string
          topico_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revisoes_disciplinaId_fkey"
            columns: ["disciplinaId"]
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revisoes_studyPlanId_fkey"
            columns: ["studyPlanId"]
            referencedRelation: "editais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revisoes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      sessoes: {
        Row: {
          comentarios: string | null
          created_at: string
          data_estudo: string
          id: string
          studyPlanId: string
          tempo_estudado: number
          topico_id: string
          user_id: string
        }
        Insert: {
          comentarios?: string | null
          created_at?: string
          data_estudo: string
          id?: string
          studyPlanId: string
          tempo_estudado: number
          topico_id: string
          user_id: string
        }
        Update: {
          comentarios?: string | null
          created_at?: string
          data_estudo?: string
          id?: string
          studyPlanId?: string
          tempo_estudado?: number
          topico_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessoes_studyPlanId_fkey"
            columns: ["studyPlanId"]
            referencedRelation: "editais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      simulados: {
        Row: {
          blank: number | null
          correct: number
          created_at: string
          date: string
          durationMinutes: number
          edital_id: string
          id: string
          isCebraspe: boolean | null
          name: string
          notes: string | null
          user_id: string
          wrong: number
        }
        Insert: {
          blank?: number | null
          correct: number
          created_at?: string
          date: string
          durationMinutes: number
          edital_id: string
          id?: string
          isCebraspe?: boolean | null
          name: string
          notes?: string | null
          user_id: string
          wrong: number
        }
        Update: {
          blank?: number | null
          correct?: number
          created_at?: string
          date?: string
          durationMinutes?: number
          edital_id?: string
          id?: string
          isCebraspe?: boolean | null
          name?: string
          notes?: string | null
          user_id?: string
          wrong?: number
        }
        Relationships: [
          {
            foreignKeyName: "simulados_edital_id_fkey"
            columns: ["edital_id"]
            referencedRelation: "editais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulados_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      friendship_status: "pending" | "accepted" | "declined" | "blocked"
      nivel_dificuldade: "fácil" | "médio" | "difícil" | "desconhecido"
      revisao_origem: "flashcard" | "erro" | "manual" | "teorica"
      revisao_status: "pendente" | "concluida" | "atrasada"
      xp_log_event:
        | "cronometro_finalizado"
        | "estudo_manual"
        | "revisao_concluida"
        | "revisao_atrasada"
        | "revisao_dificil"
        | "trilha_topico_concluido"
        | "estudo_extra"
        | "meta_semanal_completa"
        | "missao_diaria_completa"
        | "conquista_desbloqueada"
      xp_log_tipo: "ativo" | "manual"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
