import { create } from 'zustand';
import { StudyPlan } from '../types';
import { getStudyPlans, createStudyPlan, updateStudyPlanApi, deleteStudyPlan } from '../services/geminiService';
import { toast } from '../components/Sonner';

interface EditalStore {
  editais: StudyPlan[];
  editalAtivo: StudyPlan | null;
  loading: boolean;
  setEditalAtivo: (edital: StudyPlan | null) => void;
  fetchEditais: () => Promise<void>;
  addEdital: (editalData: Omit<StudyPlan, 'id'>) => Promise<StudyPlan>;
  updateEdital: (id: string, updates: Partial<StudyPlan>) => Promise<void>;
  removeEdital: (id: string) => Promise<void>;
}

export const useEditalStore = create<EditalStore>((set, get) => ({
  editais: [],
  editalAtivo: null,
  loading: false,
  setEditalAtivo: (edital) => set({ editalAtivo: edital }),

  fetchEditais: async () => {
    set({ loading: true });
    try {
      const editais = await getStudyPlans();
      set({ editais, loading: false });
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
    } catch (error) {
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
