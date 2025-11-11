
import { create } from 'zustand';
import { Revisao, NivelDificuldade } from '../types';
import { addDays } from 'date-fns';
import { getRevisoes, createRevisao, updateRevisaoApi, deleteRevisao } from '../services/geminiService';
import { useEditalStore } from './useEditalStore';
import { toast } from '../components/Sonner';

const mapDificuldade = (d?: 'facil' | 'medio' | 'dificil'): NivelDificuldade | undefined => {
    if (d === 'facil') return 'fácil';
    if (d === 'medio') return 'médio';
    if (d === 'dificil') return 'difícil';
    return undefined;
};


interface RevisoesStore {
  revisoes: Revisao[];
  loading: boolean;
  error: string | null;

  fetchRevisoes: (studyPlanId: string) => Promise<void>;
  addRevisao: (revisaoData: Omit<Revisao, 'id' | 'studyPlanId'>) => Promise<Revisao>;
  updateRevisao: (id: string, updates: Partial<Revisao>) => Promise<void>;
  removeRevisao: (id: string) => Promise<void>;
  concluirRevisao: (payload: { id: string; resultado: 'acertou' | 'errou' | 'adiou'; novaDificuldade?: 'facil' | 'medio' | 'dificil'; }) => Promise<void>;
  reagendarRevisao: (id: string, dias: number) => Promise<void>;
  atualizarStatusAtrasadas: () => Promise<void>;
}

export const useRevisoesStore = create<RevisoesStore>((set, get) => ({
      revisoes: [],
      loading: false,
      error: null,

      // ✅ Corrigido: Parâmetro renomeado para `studyPlanId` para consistência com o serviço.
      fetchRevisoes: async (studyPlanId: string) => {
        set({ loading: true, error: null });
        try {
            const revisoes = await getRevisoes(studyPlanId);
            set({ revisoes, loading: false });
        } catch (e) {
            console.error("Failed to fetch revisoes:", e);
            toast.error("Não foi possível carregar as revisões.");
            set({ error: 'Falha ao buscar revisões', loading: false });
        }
      },
      addRevisao: async (revisaoData) => {
        const studyPlanId = useEditalStore.getState().editalAtivo?.id;
        if (!studyPlanId) throw new Error("Plano de estudo não selecionado");
        
        try {
            const newRevisao = await createRevisao(studyPlanId, revisaoData);
            set(state => ({ revisoes: [...state.revisoes, newRevisao] }));
            return newRevisao;
        } catch(e) {
            toast.error("Falha ao adicionar revisão.");
            throw e;
        }
      },
      updateRevisao: async (id, updates) => {
        try {
            const revisaoAtualizada = await updateRevisaoApi(id, updates);
            set(state => ({
              revisoes: state.revisoes.map(rev => rev.id === id ? revisaoAtualizada : rev)
            }));
        } catch(e) {
            toast.error("Falha ao atualizar revisão.");
            throw e;
        }
      },
      removeRevisao: async (id) => {
        try {
            await deleteRevisao(id);
            set(state => ({ revisoes: state.revisoes.filter(rev => rev.id !== id) }));
        } catch (e) {
            toast.error("Falha ao remover revisão.");
            throw e;
        }
      },
      concluirRevisao: async ({ id, resultado, novaDificuldade }) => {
        const revisaoOriginal = get().revisoes.find(r => r.id === id);
        if (!revisaoOriginal) return;

        const mappedNovaDificuldade = mapDificuldade(novaDificuldade);

        await get().updateRevisao(id, { status: 'concluida', dificuldade: mappedNovaDificuldade ?? revisaoOriginal.dificuldade });
        
        // Determine the correct event and context
        if (resultado === 'errou') {
            const novaRevisaoData: Omit<Revisao, 'id' | 'studyPlanId'> = {
                ...revisaoOriginal,
                data_prevista: addDays(new Date(), 1).toISOString(),
                status: 'pendente',
                dificuldade: mappedNovaDificuldade || 'difícil',
            };
            await get().addRevisao(novaRevisaoData);
        }
      },
      reagendarRevisao: async (id, dias) => {
        const novaData = addDays(new Date(), dias);
        await get().updateRevisao(id, {
          data_prevista: novaData.toISOString(),
          status: 'pendente'
        });
      },
      atualizarStatusAtrasadas: async () => {
        // This logic is better handled by the backend, but we can keep a frontend version for UI responsiveness.
        set(state => {
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);

          const revisoesAtualizadas = state.revisoes.map(r => {
            const dataPrevista = new Date(r.data_prevista);
            dataPrevista.setHours(0, 0, 0, 0);

            if (r.status === 'pendente' && dataPrevista < hoje) {
              return { ...r, status: 'atrasada' as const };
            }
            return r;
          });
          return { revisoes: revisoesAtualizadas };
        });
      },
    })
);
