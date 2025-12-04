import { create } from 'zustand';
import { StudyPlan } from '../types';
import { getStudyPlans, createStudyPlan, updateStudyPlanApi, deleteStudyPlan } from '../services/geminiService';
import { toast } from '../components/Sonner';
import { supabase } from '../services/supabaseClient';

interface EditalStore {
  editais: StudyPlan[];
  editalAtivo: StudyPlan | null;
  loading: boolean;
  setEditalAtivo: (edital: StudyPlan | null) => Promise<void>;
  fetchEditais: () => Promise<void>;
  addEdital: (editalData: Omit<StudyPlan, 'id'>) => Promise<StudyPlan>;
  updateEdital: (id: string, updates: Partial<StudyPlan>) => Promise<void>;
  removeEdital: (id: string) => Promise<void>;
}

export const useEditalStore = create<EditalStore>((set, get) => ({
  editais: [],
  editalAtivo: null,
  loading: false,
  setEditalAtivo: async (edital) => {
    set({ editalAtivo: edital });
    
    // Salvar o edital ativo no banco de dados
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ active_edital_id: edital?.id || null })
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Erro ao salvar edital ativo:', error);
      // Não mostrar erro ao usuário, pois é uma operação silenciosa
    }
  },

  fetchEditais: async () => {
    set({ loading: true });
    try {
      const editais = await getStudyPlans();
      set({ editais, loading: false });
      
      // Tentar carregar o último edital selecionado do banco
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('active_edital_id')
            .eq('user_id', user.id)
            .single();
          
          if (profile?.active_edital_id) {
            const lastEdital = editais.find(e => e.id === profile.active_edital_id);
            if (lastEdital) {
              set({ editalAtivo: lastEdital });
              return; // Edital encontrado, não precisa fazer mais nada
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar edital ativo do banco:', error);
        // Continuar com a lógica padrão se houver erro
      }
      
      // Se não encontrou edital salvo ou houve erro, usar o primeiro disponível
      if (get().editalAtivo === null && editais.length > 0) {
        set({ editalAtivo: editais[0] });
      }
    } catch (error) {
      console.error("Failed to fetch editais:", error);
      toast.error("Não foi possível carregar os editais.");
      set({ loading: false });
    }
  },

  addEdital: async (editalData) => {
    try {
      const newEdital = await createStudyPlan(editalData);
      set(state => ({ editais: [...state.editais, newEdital] }));
      return newEdital;
    } catch (error: any) {
      console.error("Failed to create edital:", error);
      toast.error("Falha ao criar o edital.");
      throw error;
    }
  },
  
  updateEdital: async (id, updates) => {
    try {
      const updatedEdital = await updateStudyPlanApi(id, updates);
      set(state => ({
        editais: state.editais.map(e => (e.id === id ? updatedEdital : e)),
        editalAtivo: state.editalAtivo?.id === id ? updatedEdital : state.editalAtivo
      }));
    } catch (error) {
      console.error("Failed to update edital:", error);
      toast.error("Falha ao atualizar o edital.");
      throw error;
    }
  },

  removeEdital: async (id) => {
    try {
      await deleteStudyPlan(id);
      set(state => {
        const novosEditais = state.editais.filter(e => e.id !== id);
        let novoEditalAtivo = state.editalAtivo;
        if (state.editalAtivo?.id === id) {
          novoEditalAtivo = novosEditais[0] || null;
        }
        return { editais: novosEditais, editalAtivo: novoEditalAtivo };
      });
    } catch (error) {
      console.error("Failed to delete edital:", error);
      toast.error("Falha ao remover o edital.");
      throw error;
    }
  },
}));
