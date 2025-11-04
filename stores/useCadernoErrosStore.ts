import { create } from 'zustand';
import { CadernoErro, RevisaoErro } from '../types';
import { getErros, createErro, updateErroApi, deleteErro } from '../services/geminiService';
import { useEditalStore } from './useEditalStore';
import { toast } from '../components/Sonner';
import { useGamificationStore } from './useGamificationStore';

interface CadernoErrosStore {
  erros: CadernoErro[];
  loading: boolean;
  fetchErros: (editalId: string) => Promise<void>;
  addErro: (erroData: Omit<CadernoErro, 'id' | 'studyPlanId'>) => Promise<CadernoErro>;
  updateErro: (id: string, updates: Partial<CadernoErro>) => Promise<void>;
  removeErro: (id: string) => Promise<void>;
  addRevisao: (erroId: string, revisao: RevisaoErro) => Promise<void>;
}

export const useCadernoErrosStore = create<CadernoErrosStore>((set, get) => ({
  erros: [],
  loading: false,

  fetchErros: async (editalId: string) => {
    set({ loading: true });
    try {
      const erros = await getErros(editalId);
      set({ erros });
    } catch (error) {
      console.error("Failed to fetch erros:", error);
      toast.error("Não foi possível carregar o caderno de erros.");
    } finally {
      set({ loading: false });
    }
  },

  addErro: async (erroData) => {
    const editalAtivoId = useEditalStore.getState().editalAtivo?.id;
    if (!editalAtivoId) throw new Error("Edital não selecionado");

    try {
        const newErro = await createErro(editalAtivoId, erroData);
        set(state => ({ erros: [...state.erros, newErro] }));
        useGamificationStore.getState().logXpEvent('estudo_extra', { erroId: newErro.id, action: 'create' });
        return newErro;
    } catch (error) {
        toast.error("Falha ao registrar erro.");
        throw error;
    }
  },

  updateErro: async (id, updates) => {
    const erroOriginal = get().erros.find(e => e.id === id);
    try {
        const erroAtualizado = await updateErroApi(id, updates);
        set(state => ({
            erros: state.erros.map(e => e.id === id ? erroAtualizado : e),
        }));
        // Se o erro foi marcado como resolvido e não estava resolvido antes
        if (updates.resolvido && !erroOriginal?.resolvido) {
            useGamificationStore.getState().logXpEvent('estudo_extra', { erroId: id, action: 'resolve' });
        }
    } catch (error) {
        toast.error("Falha ao atualizar erro.");
        throw error;
    }
  },

  removeErro: async (id) => {
    try {
        await deleteErro(id);
        set(state => ({ erros: state.erros.filter(e => e.id !== id) }));
    } catch (error) {
        toast.error("Falha ao remover erro.");
        throw error;
    }
  },

  addRevisao: async (erroId, revisao) => {
    const erro = get().erros.find(e => e.id === erroId);
    if (!erro) return;

    const updatedRevisoes = [...(erro.revisoes || []), revisao];
    await get().updateErro(erroId, { revisoes: updatedRevisoes });
  },
}));