import { create } from 'zustand';
import { Quiz } from '../types';
import { supabase } from '../services/supabaseClient';
import { toast } from '../components/Sonner';

interface QuizzesRepository {
  quizzes: Quiz[];
  loading: boolean;
  error: string | null;

  // Métodos principais
  fetchQuizzes: (studyPlanId?: string) => Promise<void>;
  getQuizById: (id: string) => Quiz | null;
  deleteQuiz: (id: string) => Promise<void>;
  updateQuiz: (id: string, updates: Partial<Pick<Quiz, 'title' | 'description'>>) => Promise<void>;

  // Métodos de busca e filtro
  searchQuizzes: (query: string) => Quiz[];
  filterByMode: (mode: 'standard' | 'true_false') => Quiz[];
  getQuizzesByDateRange: (startDate: Date, endDate: Date) => Quiz[];

  // Utilitários
  getTotalQuizzes: () => number;
  getQuizzesCountByMode: () => { standard: number; true_false: number };
  clearError: () => void;
}

export const useQuizzesRepository = create<QuizzesRepository>((set, get) => ({
  quizzes: [],
  loading: false,
  error: null,

  fetchQuizzes: async (studyPlanId?: string) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        set({ quizzes: [], loading: false });
        return;
      }

      let query = supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (studyPlanId) {
        query = query.eq('studyPlanId', studyPlanId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Converter os dados do banco para o tipo Quiz
      const quizzes: Quiz[] = (data || []).map((quiz: any) => ({
        id: quiz.id,
        user_id: quiz.user_id,
        title: quiz.title,
        description: quiz.description || undefined,
        mode: quiz.mode as 'standard' | 'true_false',
        questions: quiz.questions || [],
        created_at: quiz.created_at,
        updated_at: quiz.updated_at,
        studyPlanId: quiz.studyPlanId
      }));

      set({ quizzes, loading: false });
    } catch (error: any) {
      console.error('Erro ao buscar quizzes:', error);
      set({
        error: error.message || 'Erro ao carregar quizzes',
        loading: false
      });
      toast.error('Não foi possível carregar os quizzes.');
    }
  },

  getQuizById: (id: string) => {
    const { quizzes } = get();
    return quizzes.find(quiz => quiz.id === id) || null;
  },

  deleteQuiz: async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Remover do estado local
      set(state => ({
        quizzes: state.quizzes.filter(quiz => quiz.id !== id)
      }));

      toast.success('Quiz removido com sucesso!');
    } catch (error: any) {
      console.error('Erro ao deletar quiz:', error);
      toast.error('Falha ao remover o quiz.');
      throw error;
    }
  },

  updateQuiz: async (id: string, updates: Partial<Pick<Quiz, 'title' | 'description'>>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('quizzes')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Atualizar no estado local
      if (data) {
        const updatedQuiz: Quiz = {
          id: data.id,
          user_id: data.user_id,
          title: data.title,
          description: data.description || undefined,
          mode: data.mode as 'standard' | 'true_false',
          questions: data.questions || [],
          created_at: data.created_at,
          updated_at: data.updated_at,
          studyPlanId: data.studyPlanId
        };

        set(state => ({
          quizzes: state.quizzes.map(quiz =>
            quiz.id === id ? updatedQuiz : quiz
          )
        }));

        toast.success('Quiz atualizado com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar quiz:', error);
      toast.error('Falha ao atualizar o quiz.');
      throw error;
    }
  },

  searchQuizzes: (query: string) => {
    const { quizzes } = get();
    if (!query.trim()) {
      return quizzes;
    }

    const lowerQuery = query.toLowerCase();
    return quizzes.filter(quiz =>
      quiz.title.toLowerCase().includes(lowerQuery) ||
      (quiz.description && quiz.description.toLowerCase().includes(lowerQuery))
    );
  },

  filterByMode: (mode: 'standard' | 'true_false') => {
    const { quizzes } = get();
    return quizzes.filter(quiz => quiz.mode === mode);
  },

  getQuizzesByDateRange: (startDate: Date, endDate: Date) => {
    const { quizzes } = get();
    return quizzes.filter(quiz => {
      const quizDate = new Date(quiz.created_at);
      return quizDate >= startDate && quizDate <= endDate;
    });
  },

  getTotalQuizzes: () => {
    return get().quizzes.length;
  },

  getQuizzesCountByMode: () => {
    const { quizzes } = get();
    return {
      standard: quizzes.filter(q => q.mode === 'standard').length,
      true_false: quizzes.filter(q => q.mode === 'true_false').length,
    };
  },

  clearError: () => {
    set({ error: null });
  },
}));


