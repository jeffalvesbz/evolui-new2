import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Revisao, NivelDificuldade } from '../types';
import { mockRevisoesPorEdital } from '../data/mockData';
import { addDays } from 'date-fns';

const generateId = () => `rev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

interface ConcluirRevisaoPayload {
    id: string;
    resultado: 'acertou' | 'errou' | 'adiou';
    novaDificuldade?: 'facil' | 'medio' | 'dificil';
}

const mapDificuldade = (d?: 'facil' | 'medio' | 'dificil'): NivelDificuldade | undefined => {
    if (d === 'facil') return 'fácil';
    if (d === 'medio') return 'médio';
    if (d === 'dificil') return 'difícil';
    return undefined;
};


interface RevisoesStore {
  revisoes: Revisao[];
  revisoesPorEdital: Record<string, Revisao[]>;
  editalAtivoId: string | null;
  loading: boolean;
  error: string | null;
  _hasHydrated: boolean;
  setEditalAtivo: (editalId: string) => void;
  fetchRevisoes: () => Promise<void>;
  addRevisao: (revisaoData: Omit<Revisao, 'id'>) => Promise<Revisao>;
  updateRevisao: (id: string, updates: Partial<Revisao>) => Promise<void>;
  removeRevisao: (id: string) => Promise<void>;
  setRevisoes: (revisoes: Revisao[]) => void;
  concluirRevisao: (payload: ConcluirRevisaoPayload) => Promise<void>;
  reagendarRevisao: (id: string, dias: number) => Promise<void>;
  atualizarStatusAtrasadas: () => Promise<void>;
  removeDataForEdital: (editalId: string) => void;
  initializeDataForEdital: (editalId: string) => void;
}

export const useRevisoesStore = create<RevisoesStore>()(
  persist(
    (set, get) => ({
      revisoes: [],
      revisoesPorEdital: {},
      editalAtivoId: null,
      loading: false,
      error: null,
      _hasHydrated: false,

      setEditalAtivo: (editalId: string) => {
        set(state => {
          let revisoesDoEdital = state.revisoesPorEdital[editalId];
          const newState = { ...state.revisoesPorEdital };

          if (revisoesDoEdital === undefined) {
            revisoesDoEdital = mockRevisoesPorEdital[editalId] ?? [];
            newState[editalId] = revisoesDoEdital;
          }
          
          return {
            editalAtivoId: editalId,
            revisoes: revisoesDoEdital,
            revisoesPorEdital: newState
          };
        });
      },
      fetchRevisoes: async () => {
        const { editalAtivoId, setEditalAtivo } = get();
        set({ loading: true, error: null });
        try {
            if(editalAtivoId) {
                setEditalAtivo(editalAtivoId);
            }
        } catch (e) {
            set({ error: 'Falha ao buscar revisões' });
        } finally {
            set({ loading: false });
        }
      },
      addRevisao: async (revisaoData) => {
        const { editalAtivoId } = get();
        if (!editalAtivoId) throw new Error("Edital não selecionado");
        
        const newRevisao: Revisao = {
          ...revisaoData,
          id: generateId(),
        };
        set(state => {
          const novasRevisoes = [...state.revisoes, newRevisao];
          return {
            revisoes: novasRevisoes,
            revisoesPorEdital: {
              ...state.revisoesPorEdital,
              [editalAtivoId]: novasRevisoes,
            }
          };
        });
        return newRevisao;
      },
      updateRevisao: async (id, updates) => {
        const { editalAtivoId } = get();
        if (!editalAtivoId) return;

        set(state => {
          const novasRevisoes = state.revisoes.map(rev => 
            rev.id === id ? { ...rev, ...updates } : rev
          );
          return {
            revisoes: novasRevisoes,
            revisoesPorEdital: {
              ...state.revisoesPorEdital,
              [editalAtivoId]: novasRevisoes
            }
          };
        });
      },
      removeRevisao: async (id) => {
        const { editalAtivoId } = get();
        if (!editalAtivoId) return;

        set(state => {
          const novasRevisoes = state.revisoes.filter(rev => rev.id !== id);
          return {
            revisoes: novasRevisoes,
            revisoesPorEdital: {
              ...state.revisoesPorEdital,
              [editalAtivoId]: novasRevisoes,
            }
          };
        });
      },
      setRevisoes: (revisoes) => {
        const { editalAtivoId } = get();
        if (!editalAtivoId) return;

        set(state => ({
          revisoes,
          revisoesPorEdital: {
            ...state.revisoesPorEdital,
            [editalAtivoId]: revisoes,
          }
        }));
      },
      concluirRevisao: async ({ id, resultado, novaDificuldade }) => {
        const { editalAtivoId } = get();
        if (!editalAtivoId) return;
    
        set(state => {
            const revisaoOriginal = state.revisoes.find(r => r.id === id);
            if (!revisaoOriginal) return state;
    
            const mappedNovaDificuldade = mapDificuldade(novaDificuldade);

            const novasRevisoes = state.revisoes.map(r =>
                r.id === id ? { ...r, status: 'concluida' as const, dificuldade: mappedNovaDificuldade ?? r.dificuldade } : r
            );
    
            if (resultado === 'errou') {
                const novaRevisao: Revisao = {
                    ...revisaoOriginal,
                    id: generateId(),
                    data_prevista: addDays(new Date(), 1).toISOString(),
                    status: 'pendente',
                    dificuldade: mappedNovaDificuldade || 'difícil',
                };
                novasRevisoes.push(novaRevisao);
            }
    
            return {
                revisoes: novasRevisoes,
                revisoesPorEdital: {
                    ...state.revisoesPorEdital,
                    [editalAtivoId]: novasRevisoes,
                }
            };
        });
      },
      reagendarRevisao: async (id, dias) => {
        const { updateRevisao } = get();
        const novaData = addDays(new Date(), dias);
        await updateRevisao(id, {
          data_prevista: novaData.toISOString(),
          status: 'pendente'
        });
      },
      atualizarStatusAtrasadas: async () => {
        const { editalAtivoId } = get();
        if (!editalAtivoId) return;

        set(state => {
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);

          let hasChanges = false;
          const revisoesAtualizadas = state.revisoes.map(r => {
            const dataPrevista = new Date(r.data_prevista);
            dataPrevista.setHours(0, 0, 0, 0);

            if (r.status === 'pendente' && dataPrevista < hoje) {
              hasChanges = true;
              return { ...r, status: 'atrasada' as const };
            }
            return r;
          });

          if (hasChanges) {
            return {
              revisoes: revisoesAtualizadas,
              revisoesPorEdital: { ...state.revisoesPorEdital, [editalAtivoId]: revisoesAtualizadas },
            };
          }
          return state;
        });
      },
      removeDataForEdital: (editalId) => {
        set(state => {
          const { [editalId]: _, ...rest } = state.revisoesPorEdital;
          return { revisoesPorEdital: rest };
        });
      },
      initializeDataForEdital: (editalId) => {
        set(state => {
            if (state.revisoesPorEdital[editalId] === undefined) {
                return {
                    revisoesPorEdital: { ...state.revisoesPorEdital, [editalId]: [] },
                };
            }
            return state;
        });
      },
    }),
    {
      name: 'evolui-revisoes-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state._hasHydrated = true;
      },
    }
  )
);