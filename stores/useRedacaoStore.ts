import { create } from 'zustand';
import { RedacaoCorrigida } from '../types';
import { getRedacoes, createRedacao } from '../services/geminiService';
import { toast } from '../components/Sonner';
import { useEditalStore } from './useEditalStore';

interface RedacaoStore {
  historico: RedacaoCorrigida[];
  loading: boolean;
  fetchRedacoes: (editalId: string) => Promise<void>;
  addCorrecao: (data: Omit<RedacaoCorrigida, 'id' | 'data' | 'studyPlanId'>) => Promise<void>;
}

export const useRedacaoStore = create<RedacaoStore>((set, get) => ({
      historico: [],
      loading: false,

      fetchRedacoes: async (editalId: string) => {
          set({ loading: true });
          try {
              const historico = await getRedacoes(editalId);
              set({ historico });
          } catch (error) {
              console.error("Failed to fetch redacoes:", error);
              toast.error("Não foi possível carregar o histórico de redações.");
          } finally {
              set({ loading: false });
          }
      },

      addCorrecao: async (data) => {
        const editalAtivoId = useEditalStore.getState().editalAtivo?.id;
        if (!editalAtivoId) {
            toast.error("Nenhum edital ativo para salvar a redação.");
            return;
        }
        try {
            const novaRedacaoCorrigida = await createRedacao(editalAtivoId, data);
            set(state => ({
              historico: [novaRedacaoCorrigida, ...state.historico],
            }));
        } catch (error) {
            toast.error("Falha ao salvar a redação no histórico.");
            console.error(error);
        }
      },
    })
);