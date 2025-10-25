import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Ciclo, SessaoCiclo } from '../types';
import { mockCiclo } from '../data/mockData';

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

interface CiclosState {
  ciclos: Ciclo[];
  cicloAtivoId: string | null;
  _hasHydrated: boolean;
  
  // Ciclo Actions
  getCicloAtivo: () => Ciclo | null;
  setCicloAtivoId: (id: string | null) => void;
  addCiclo: (cicloData: Omit<Ciclo, 'id'>) => Ciclo;
  updateCiclo: (id: string, nome: string) => void;
  removeCiclo: (id: string) => void;

  // Sessão Actions
  addSessaoAoCiclo: (cicloId: string, disciplinaId: string, tempoPrevisto: number) => void;
  updateSessaoNoCiclo: (cicloId: string, sessaoId: string, updates: Partial<Omit<SessaoCiclo, 'id'>>) => void;
  removeSessaoDoCiclo: (cicloId: string, sessaoId: string) => void;
  removeSessoesPorDisciplina: (disciplinaId: string) => void;
}

export const useCiclosStore = create<CiclosState>()(
  persist(
    (set, get) => ({
      ciclos: [mockCiclo],
      cicloAtivoId: mockCiclo.id,
      _hasHydrated: false,

      // --- Ciclo Actions ---
      getCicloAtivo: () => {
        const { ciclos, cicloAtivoId } = get();
        return ciclos.find(c => c.id === cicloAtivoId) || null;
      },
      setCicloAtivoId: (id) => set({ cicloAtivoId: id }),
      addCiclo: (cicloData) => {
        const novoCiclo: Ciclo = {
          ...cicloData,
          id: generateId('ciclo'),
          sessoes: cicloData.sessoes.map((s, index) => ({
            ...s,
            id: generateId('sessao-ciclo'),
            ordem: index + 1,
          }))
        };
        set(state => ({ ciclos: [...state.ciclos, novoCiclo] }));
        return novoCiclo;
      },
      updateCiclo: (id, nome) => {
        set(state => ({
          ciclos: state.ciclos.map(c => c.id === id ? { ...c, nome } : c),
        }));
      },
      removeCiclo: (id) => {
        set(state => ({
          ciclos: state.ciclos.filter(c => c.id !== id),
          cicloAtivoId: state.cicloAtivoId === id ? state.ciclos[0]?.id || null : state.cicloAtivoId,
        }));
      },

      // --- Sessão Actions ---
      addSessaoAoCiclo: (cicloId, disciplinaId, tempoPrevisto) => {
        set(state => {
          const ciclosAtualizados = state.ciclos.map(ciclo => {
            if (ciclo.id === cicloId) {
              const novaSessao: SessaoCiclo = {
                id: generateId('sessao-ciclo'),
                ordem: ciclo.sessoes.length + 1,
                disciplina_id: disciplinaId,
                tempo_previsto: tempoPrevisto,
              };
              return { ...ciclo, sessoes: [...ciclo.sessoes, novaSessao] };
            }
            return ciclo;
          });
          return { ciclos: ciclosAtualizados };
        });
      },
      updateSessaoNoCiclo: (cicloId, sessaoId, updates) => {
        set(state => ({
          ciclos: state.ciclos.map(c => c.id === cicloId
            ? { ...c, sessoes: c.sessoes.map(s => s.id === sessaoId ? { ...s, ...updates } : s) }
            : c
          ),
        }));
      },
      removeSessaoDoCiclo: (cicloId, sessaoId) => {
        set(state => ({
          ciclos: state.ciclos.map(c => c.id === cicloId
            ? { ...c, sessoes: c.sessoes.filter(s => s.id !== sessaoId).map((s, index) => ({...s, ordem: index + 1})) }
            : c
          ),
        }));
      },
      removeSessoesPorDisciplina: (disciplinaId) => {
        set(state => ({
          ciclos: state.ciclos.map(ciclo => ({
            ...ciclo,
            sessoes: ciclo.sessoes
              .filter(s => s.disciplina_id !== disciplinaId)
              .map((s, index) => ({ ...s, ordem: index + 1 })),
          })),
        }));
      },
    }),
    {
      name: 'evolui-ciclos-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state._hasHydrated = true;
      },
    }
  )
);