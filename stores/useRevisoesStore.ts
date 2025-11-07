
import { create } from 'zustand';
import { Revisao, NivelDificuldade, XpLogEvent } from '../types';
import { addDays } from 'date-fns';
import { getRevisoes, createRevisao, updateRevisaoApi, deleteRevisao } from '../services/geminiService';
import { useEditalStore } from './useEditalStore';
import { toast } from '../components/Sonner';
import { useGamificationStore } from './useGamificationStore';
import { checkAndAwardBadges } from '../services/badgeService';


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

        // Se adiou, apenas reagenda para amanhã sem marcar como concluída
        if (resultado === 'adiou') {
          await get().reagendarRevisao(id, 1);
          toast.info('Revisão adiada para amanhã');
          return;
        }

        // Se acertou, mantém a dificuldade atual ou melhora para fácil
        // Se errou, aumenta a dificuldade ou mantém como difícil
        let novaDificuldadeFinal = revisaoOriginal.dificuldade;
        if (resultado === 'acertou') {
          // Se estava difícil ou médio, pode melhorar
          if (revisaoOriginal.dificuldade === 'difícil') {
            novaDificuldadeFinal = 'médio';
          } else if (revisaoOriginal.dificuldade === 'médio') {
            novaDificuldadeFinal = 'fácil';
          }
        } else if (resultado === 'errou') {
          // Se errou, aumenta a dificuldade
          if (revisaoOriginal.dificuldade === 'fácil') {
            novaDificuldadeFinal = 'médio';
          } else {
            novaDificuldadeFinal = 'difícil';
          }
        }

        await get().updateRevisao(id, { status: 'concluida', dificuldade: novaDificuldadeFinal });
        
        // Determine the correct event and context
        let eventType: XpLogEvent = revisaoOriginal.status === 'atrasada' ? 'revisao_atrasada' : 'revisao_concluida';
        const context = {
            difficulty: novaDificuldadeFinal,
            isCorrect: resultado === 'acertou'
        };

        // If it's a difficult card answered correctly, use the specific event
        if (context.difficulty === 'difícil' && context.isCorrect && eventType !== 'revisao_atrasada') {
            eventType = 'revisao_dificil';
        }

        await useGamificationStore.getState().logXpEvent(eventType, { revisaoId: id }, context);

        if (resultado === 'errou') {
            const novaRevisaoData: Omit<Revisao, 'id' | 'studyPlanId'> = {
                ...revisaoOriginal,
                data_prevista: addDays(new Date(), 1).toISOString(),
                status: 'pendente',
                dificuldade: 'difícil',
            };
            await get().addRevisao(novaRevisaoData);
        }
        
        // Verificar conquistas após concluir revisão (aguardar um pouco para garantir que os dados estão atualizados)
        setTimeout(() => {
          checkAndAwardBadges();
        }, 100);
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
