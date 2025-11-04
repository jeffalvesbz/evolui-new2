import { create } from 'zustand';
import { RedacaoCorrigida } from '../types';
import { getRedacoes, createRedacao } from '../services/geminiService';
import { toast } from '../components/Sonner';
import { useEditalStore } from './useEditalStore';

interface RedacaoStore {
  historico: RedacaoCorrigida[];
  loading: boolean;
  fetchRedacoes: (studyPlanId: string) => Promise<void>;
  addCorrecao: (data: Omit<RedacaoCorrigida, 'id' | 'data' | 'studyPlanId'>) => Promise<void>;
}

export const useRedacaoStore = create<RedacaoStore>((set, get) => ({
      historico: [],
      loading: false,

      // ✅ Corrigido: Parâmetro renomeado para `studyPlanId` para consistência com o serviço.
      fetchRedacoes: async (studyPlanId: string) => {
          set({ loading: true });
          try {
              const historico = await getRedacoes(studyPlanId);
              set({ historico });
          } catch (error) {
              console.error("Failed to fetch redacoes:", error);
              toast.error("Não foi possível carregar o histórico de redações.");
          } finally {
              set({ loading: false });
          }
      },

      addCorrecao: async (data) => {
        const studyPlanId = useEditalStore.getState().editalAtivo?.id;
        if (!studyPlanId) {
            toast.error("Nenhum plano de estudo ativo para salvar a redação.");
            return;
        }
        try {
            // ✅ Corrigido: Adicionada a propriedade `data` obrigatória na chamada `createRedacao`.
            const novaRedacaoCorrigida = await createRedacao(studyPlanId, { ...data, data: new Date().toISOString() });
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