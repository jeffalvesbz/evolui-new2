export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          avatar_url: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      friendships: {
        Row: {
          id: string;
          user_id_1: string;
          user_id_2: string;
          status: 'pending' | 'accepted' | 'declined' | 'blocked';
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id_1: string;
          user_id_2: string;
          status?: 'pending' | 'accepted' | 'declined' | 'blocked';
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id_1?: string;
          user_id_2?: string;
          status?: 'pending' | 'accepted' | 'declined' | 'blocked';
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'friendships_user_id_1_fkey';
            columns: ['user_id_1'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'friendships_user_id_2_fkey';
            columns: ['user_id_2'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      badges: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon: string;
          xp: number;
          is_secret: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          icon: string;
          xp: number;
          is_secret?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          icon?: string;
          xp?: number;
          is_secret?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      gamification_user_stats: {
        Row: {
          user_id: string;
          xp_total: number;
          level: number;
          current_streak_days: number;
          best_streak_days: number;
          unlocked_badge_ids: string[];
          updated_at: string | null;
        };
        Insert: {
          user_id: string;
          xp_total?: number;
          level?: number;
          current_streak_days?: number;
          best_streak_days?: number;
          unlocked_badge_ids?: string[];
          updated_at?: string | null;
        };
        Update: {
          user_id?: string;
          xp_total?: number;
          level?: number;
          current_streak_days?: number;
          best_streak_days?: number;
          unlocked_badge_ids?: string[];
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'gamification_user_stats_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      gamification_xp_log: {
        Row: {
          id: string;
          user_id: string;
          event: string;
          amount: number;
          meta_json: Json | null;
          created_at: string;
          tipo_evento: 'ativo' | 'manual';
          multiplicador: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          event: string;
          amount: number;
          meta_json?: Json | null;
          created_at?: string;
          tipo_evento?: 'ativo' | 'manual';
          multiplicador?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          event?: string;
          amount?: number;
          meta_json?: Json | null;
          created_at?: string;
          tipo_evento?: 'ativo' | 'manual';
          multiplicador?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'gamification_xp_log_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      editais: {
        Row: {
          id: string;
          nome: string;
          descricao: string | null;
          data_alvo: string | null;
          banca: string | null;
          orgao: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          nome: string;
          descricao?: string | null;
          data_alvo?: string | null;
          banca?: string | null;
          orgao?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          nome?: string;
          descricao?: string | null;
          data_alvo?: string | null;
          banca?: string | null;
          orgao?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      disciplinas: {
        Row: {
          id: string;
          nome: string;
          progresso: number;
          anotacoes: string | null;
          study_plan_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          nome: string;
          progresso?: number;
          anotacoes?: string | null;
          study_plan_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          nome?: string;
          progresso?: number;
          anotacoes?: string | null;
          study_plan_id?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'disciplinas_study_plan_id_fkey';
            columns: ['study_plan_id'];
            isOneToOne: false;
            referencedRelation: 'editais';
            referencedColumns: ['id'];
          }
        ];
      };
      topicos: {
        Row: {
          id: string;
          disciplina_id: string;
          titulo: string;
          concluido: boolean;
          nivel_dificuldade: 'fácil' | 'médio' | 'difícil' | 'desconhecido';
          ultima_revisao: string | null;
          proxima_revisao: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          disciplina_id: string;
          titulo: string;
          concluido?: boolean;
          nivel_dificuldade?: 'fácil' | 'médio' | 'difícil' | 'desconhecido';
          ultima_revisao?: string | null;
          proxima_revisao?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          disciplina_id?: string;
          titulo?: string;
          concluido?: boolean;
          nivel_dificuldade?: 'fácil' | 'médio' | 'difícil' | 'desconhecido';
          ultima_revisao?: string | null;
          proxima_revisao?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'topicos_disciplina_id_fkey';
            columns: ['disciplina_id'];
            isOneToOne: false;
            referencedRelation: 'disciplinas';
            referencedColumns: ['id'];
          }
        ];
      };
      sessoes: {
        Row: {
          id: string;
          topico_id: string;
          tempo_estudado: number;
          data_estudo: string;
          comentarios: string | null;
          study_plan_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          topico_id: string;
          tempo_estudado: number;
          data_estudo: string;
          comentarios?: string | null;
          study_plan_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          topico_id?: string;
          tempo_estudado?: number;
          data_estudo?: string;
          comentarios?: string | null;
          study_plan_id?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sessoes_study_plan_id_fkey';
            columns: ['study_plan_id'];
            isOneToOne: false;
            referencedRelation: 'editais';
            referencedColumns: ['id'];
          }
        ];
      };
      revisoes: {
        Row: {
          id: string;
          topico_id: string;
          disciplina_id: string;
          conteudo: string;
          data_prevista: string;
          status: 'pendente' | 'concluida' | 'atrasada';
          origem: 'flashcard' | 'erro' | 'manual' | 'teorica';
          dificuldade: 'fácil' | 'médio' | 'difícil' | 'desconhecido';
          study_plan_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          topico_id: string;
          disciplina_id: string;
          conteudo: string;
          data_prevista: string;
          status?: 'pendente' | 'concluida' | 'atrasada';
          origem?: 'flashcard' | 'erro' | 'manual' | 'teorica';
          dificuldade?: 'fácil' | 'médio' | 'difícil' | 'desconhecido';
          study_plan_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          topico_id?: string;
          disciplina_id?: string;
          conteudo?: string;
          data_prevista?: string;
          status?: 'pendente' | 'concluida' | 'atrasada';
          origem?: 'flashcard' | 'erro' | 'manual' | 'teorica';
          dificuldade?: 'fácil' | 'médio' | 'difícil' | 'desconhecido';
          study_plan_id?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'revisoes_study_plan_id_fkey';
            columns: ['study_plan_id'];
            isOneToOne: false;
            referencedRelation: 'editais';
            referencedColumns: ['id'];
          }
        ];
      };
      erros: {
        Row: {
          id: string;
          disciplina: string;
          disciplina_id: string;
          assunto: string;
          descricao: string;
          topico_id: string | null;
          topico_titulo: string | null;
          resolvido: boolean;
          data: string;
          proxima_revisao: string | null;
          nivel_dificuldade: 'fácil' | 'médio' | 'difícil' | null;
          enunciado: string | null;
          alternativa_correta: string | null;
          observacoes: string | null;
          study_plan_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          disciplina: string;
          disciplina_id: string;
          assunto: string;
          descricao: string;
          topico_id?: string | null;
          topico_titulo?: string | null;
          resolvido?: boolean;
          data: string;
          proxima_revisao?: string | null;
          nivel_dificuldade?: 'fácil' | 'médio' | 'difícil' | null;
          enunciado?: string | null;
          alternativa_correta?: string | null;
          observacoes?: string | null;
          study_plan_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          disciplina?: string;
          disciplina_id?: string;
          assunto?: string;
          descricao?: string;
          topico_id?: string | null;
          topico_titulo?: string | null;
          resolvido?: boolean;
          data?: string;
          proxima_revisao?: string | null;
          nivel_dificuldade?: 'fácil' | 'médio' | 'difícil' | null;
          enunciado?: string | null;
          alternativa_correta?: string | null;
          observacoes?: string | null;
          study_plan_id?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'erros_study_plan_id_fkey';
            columns: ['study_plan_id'];
            isOneToOne: false;
            referencedRelation: 'editais';
            referencedColumns: ['id'];
          }
        ];
      };
      ciclos: {
        Row: {
          id: string;
          nome: string;
          study_plan_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          nome: string;
          study_plan_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          nome?: string;
          study_plan_id?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ciclos_study_plan_id_fkey';
            columns: ['study_plan_id'];
            isOneToOne: false;
            referencedRelation: 'editais';
            referencedColumns: ['id'];
          }
        ];
      };
      ciclo_sessoes: {
        Row: {
          id: string;
          ciclo_id: string;
          disciplina_id: string;
          tempo_previsto: number;
          ordem: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          ciclo_id: string;
          disciplina_id: string;
          tempo_previsto: number;
          ordem: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          ciclo_id?: string;
          disciplina_id?: string;
          tempo_previsto?: number;
          ordem?: number;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ciclo_sessoes_ciclo_id_fkey';
            columns: ['ciclo_id'];
            isOneToOne: false;
            referencedRelation: 'ciclos';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ciclo_sessoes_disciplina_id_fkey';
            columns: ['disciplina_id'];
            isOneToOne: false;
            referencedRelation: 'disciplinas';
            referencedColumns: ['id'];
          }
        ];
      };
      flashcards: {
        Row: {
          id: string;
          topico_id: string;
          pergunta: string;
          resposta: string;
          interval: number;
          ease_factor: number;
          due_date: string;
          estilo: 'direto' | 'explicativo' | 'completar' | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          topico_id: string;
          pergunta: string;
          resposta: string;
          interval?: number;
          ease_factor?: number;
          due_date?: string;
          estilo?: 'direto' | 'explicativo' | 'completar' | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          topico_id?: string;
          pergunta?: string;
          resposta?: string;
          interval?: number;
          ease_factor?: number;
          due_date?: string;
          estilo?: 'direto' | 'explicativo' | 'completar' | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'flashcards_topico_id_fkey';
            columns: ['topico_id'];
            isOneToOne: false;
            referencedRelation: 'topicos';
            referencedColumns: ['id'];
          }
        ];
      };
      redacoes: {
        Row: {
          id: string;
          texto: string;
          banca: string;
          nota_maxima: number;
          correcao: Json | null;
          data: string;
          tema: string | null;
          study_plan_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          texto: string;
          banca: string;
          nota_maxima: number;
          correcao?: Json | null;
          data: string;
          tema?: string | null;
          study_plan_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          texto?: string;
          banca?: string;
          nota_maxima?: number;
          correcao?: Json | null;
          data?: string;
          tema?: string | null;
          study_plan_id?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'redacoes_study_plan_id_fkey';
            columns: ['study_plan_id'];
            isOneToOne: false;
            referencedRelation: 'editais';
            referencedColumns: ['id'];
          }
        ];
      };
      simulados: {
        Row: {
          id: string;
          name: string;
          correct: number;
          wrong: number;
          blank: number | null;
          duration_minutes: number;
          notes: string | null;
          date: string;
          edital_id: string;
          is_cebraspe: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          correct: number;
          wrong: number;
          blank?: number | null;
          duration_minutes: number;
          notes?: string | null;
          date: string;
          edital_id: string;
          is_cebraspe?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          correct?: number;
          wrong?: number;
          blank?: number | null;
          duration_minutes?: number;
          notes?: string | null;
          date?: string;
          edital_id?: string;
          is_cebraspe?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'simulados_edital_id_fkey';
            columns: ['edital_id'];
            isOneToOne: false;
            referencedRelation: 'editais';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
