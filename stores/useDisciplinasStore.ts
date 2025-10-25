import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Disciplina, Topico } from '../types';
import { mockDisciplinasPorEdital } from '../data/mockData';
import { useCiclosStore } from './useCiclosStore';

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const calculateProgress = (topicos: Topico[]): number => {
  if (topicos.length === 0) return 0;
  const concluidos = topicos.filter((t) => t.concluido).length;
  return Math.round((concluidos / topicos.length) * 100);
};

interface DisciplinasState {
  disciplinas: Disciplina[]; // Disciplinas do edital ativo
  disciplinasPorEdital: Record<string, Disciplina[]>;
  editalAtivoId: string | null;
  _hasHydrated: boolean;
  setEditalAtivo: (editalId: string) => void;
  addDisciplina: (disciplinaData: Omit<Disciplina, 'id' | 'progresso'>) => Promise<Disciplina>;
  updateDisciplina: (id: string, updates: Partial<Omit<Disciplina, 'id'>>) => Promise<void>;
  removeDisciplina: (id: string) => Promise<void>;
  updateTopico: (disciplinaId: string, topicoId: string, updates: Partial<Omit<Topico, 'id'>>) => Promise<void>;
  getAverageProgress: () => number;
  getAllTopics: () => (Topico & { disciplinaNome: string; disciplinaId: string })[];
  findTopicById: (topicId: string) => { disciplina: Disciplina; topico: Topico } | null;
  removeDataForEdital: (editalId: string) => void;
  resetDisciplinas: () => void;
  initializeDataForEdital: (editalId: string) => void;
}

export const useDisciplinasStore = create<DisciplinasState>()(
  persist(
    (set, get) => ({
      disciplinas: [],
      disciplinasPorEdital: {},
      editalAtivoId: null,
      _hasHydrated: false,

      setEditalAtivo: (editalId) => {
        set(state => {
          let disciplinasDoEdital = state.disciplinasPorEdital[editalId];
          const newState = { ...state.disciplinasPorEdital };

          // Se não houver dados para este edital, carregue os mocks (se existirem) e salve-os no estado
          if (disciplinasDoEdital === undefined) {
            disciplinasDoEdital = mockDisciplinasPorEdital[editalId] ?? [];
            newState[editalId] = disciplinasDoEdital;
          }

          return {
            editalAtivoId: editalId,
            disciplinas: disciplinasDoEdital,
            disciplinasPorEdital: newState
          };
        });
      },

      addDisciplina: async (disciplinaData) => {
        const { editalAtivoId } = get();
        if (!editalAtivoId) throw new Error("Nenhum edital ativo selecionado.");

        const novaDisciplina: Disciplina = {
          ...disciplinaData,
          id: generateId('disc'),
          topicos: disciplinaData.topicos.map(t => ({ ...t, id: generateId('topic') })),
          progresso: calculateProgress(disciplinaData.topicos),
        };

        set(state => {
          const novasDisciplinas = [...state.disciplinas, novaDisciplina];
          return {
            disciplinas: novasDisciplinas,
            disciplinasPorEdital: {
              ...state.disciplinasPorEdital,
              [editalAtivoId]: novasDisciplinas,
            },
          };
        });
        return novaDisciplina;
      },
      
      updateDisciplina: async (id, updates) => {
        const { editalAtivoId } = get();
        if (!editalAtivoId) return;

        set(state => {
          let updatedDisciplina: Disciplina | undefined;
          const novasDisciplinas = state.disciplinas.map(d => {
            if (d.id === id) {
              updatedDisciplina = { ...d, ...updates };
              if (updates.topicos) {
                updatedDisciplina.progresso = calculateProgress(updates.topicos);
              }
              return updatedDisciplina;
            }
            return d;
          });
          
          return {
            disciplinas: novasDisciplinas,
            disciplinasPorEdital: {
              ...state.disciplinasPorEdital,
              [editalAtivoId]: novasDisciplinas,
            },
          };
        });
      },

      removeDisciplina: async (id) => {
        const { editalAtivoId } = get();
        if (!editalAtivoId) return;

        // Limpa as sessões de ciclo associadas a esta disciplina
        useCiclosStore.getState().removeSessoesPorDisciplina(id);

        set(state => {
          const novasDisciplinas = state.disciplinas.filter(d => d.id !== id);
          return {
            disciplinas: novasDisciplinas,
            disciplinasPorEdital: {
              ...state.disciplinasPorEdital,
              [editalAtivoId]: novasDisciplinas,
            },
          };
        });
      },

      updateTopico: async (disciplinaId, topicoId, updates) => {
        const disciplina = get().disciplinas.find(d => d.id === disciplinaId);
        if (!disciplina) return;

        const topicosAtualizados = disciplina.topicos.map(t => 
            t.id === topicoId ? { ...t, ...updates } : t
        );
        get().updateDisciplina(disciplinaId, { topicos: topicosAtualizados });
      },

      getAverageProgress: () => {
        const { disciplinas } = get();
        if (disciplinas.length === 0) return 0;
        const totalProgress = disciplinas.reduce((sum, d) => sum + d.progresso, 0);
        return totalProgress / disciplinas.length;
      },

      getAllTopics: () => {
        const { disciplinas } = get();
        return disciplinas.flatMap(d => 
            d.topicos.map(t => ({
                ...t,
                disciplinaNome: d.nome,
                disciplinaId: d.id
            }))
        );
      },

      findTopicById: (topicId) => {
          const { disciplinas } = get();
          for (const disciplina of disciplinas) {
              const topico = disciplina.topicos.find(t => t.id === topicId);
              if (topico) {
                  return { disciplina, topico };
              }
          }
          return null;
      },
      
      removeDataForEdital: (editalId) => {
          set(state => {
              const { [editalId]: _, ...rest } = state.disciplinasPorEdital;
              return { disciplinasPorEdital: rest };
          });
      },

      resetDisciplinas: () => set({ disciplinas: [], editalAtivoId: null }),

      initializeDataForEdital: (editalId) => {
        set(state => {
            if (state.disciplinasPorEdital[editalId] === undefined) {
                return {
                    disciplinasPorEdital: { ...state.disciplinasPorEdital, [editalId]: [] },
                };
            }
            return state;
        });
      },
    }),
    {
      name: 'evolui-disciplinas-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        disciplinasPorEdital: state.disciplinasPorEdital,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state._hasHydrated = true;
      },
    }
  )
);