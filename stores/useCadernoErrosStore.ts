
import { create } from 'zustand';
import { CadernoErro, RevisaoErro } from '../types';
import { getErros, createErro, updateErroApi, deleteErro } from '../services/geminiService';
import { useEditalStore } from './useEditalStore';
import { toast } from '../components/Sonner';

interface CadernoErrosStore {
  erros: CadernoErro[];
  loading: boolean;
  fetchErros: (studyPlanId: string) => Promise<void>;
  addErro: (erroData: Omit<CadernoErro, 'id' | 'studyPlanId'>) => Promise<CadernoErro>;
  updateErro: (id: string, updates: Partial<CadernoErro>) => Promise<void>;
  removeErro: (id: string) => Promise<void>;
  addRevisao: (erroId: string, revisao: RevisaoErro) => Promise<void>;
}

export const useCadernoErrosStore = create<CadernoErrosStore>((set, get) => ({
  erros: [],
  loading: false,

  // ✅ Corrigido: Parâmetro renomeado para `studyPlanId` para consistência com o serviço.
  fetchErros: async (studyPlanId: string) => {
    set({ loading: true });
    try {
      const erros = await getErros(studyPlanId);
      set({ erros, loading: false });
    } catch (error) {
      console.error("Failed to fetch erros:", error);
      toast.error("Não foi possível carregar o caderno de erros.");
      set({ loading: false });
    }
  },

  addErro: async (erroData) => {
    const studyPlanId = useEditalStore.getState().editalAtivo?.id;
    if (!studyPlanId) throw new Error("Plano de estudo ativo não encontrado.");

    try {
      const novoErro = await createErro(studyPlanId, erroData);
      set(state => ({ erros: [...state.erros, novoErro] }));
      
      return novoErro;
    } catch (error) {
      console.error("Failed to add erro:", error);
      toast.error("Falha ao adicionar erro.");
      throw error;
    }
  },

  updateErro: async (id, updates) => {
    try {
      const erroAtualizado = await updateErroApi(id, updates);
      set(state => ({
        erros: state.erros.map(e => (e.id === id ? erroAtualizado : e)),
      }));
    } catch (error) {
      console.error("Failed to update erro:", error);
      toast.error("Falha ao atualizar erro.");
      throw error;
    }
  },

  removeErro: async (id) => {
    try {
      await deleteErro(id);
      set(state => ({
        erros: state.erros.filter(e => e.id !== id),
      }));
    } catch (error) {
      console.error("Failed to remove erro:", error);
      toast.error("Falha ao remover erro.");
      throw error;
    }
  },

  addRevisao: async (erroId, revisao) => {
    const erro = get().erros.find(e => e.id === erroId);
    if (!erro) return;
    const revisoes = [...(erro.revisoes || []), revisao];
    await get().updateErro(erroId, { revisoes });
  },
}));
