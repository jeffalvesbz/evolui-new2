import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CadernoErro, RevisaoErro } from '../types';
import { mockErrosPorEdital } from '../data/mockData';

const generateId = () => `err-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

interface CadernoErrosStore {
  erros: CadernoErro[];
  errosPorEdital: Record<string, CadernoErro[]>;
  editalAtivoId: string | null;
  _hasHydrated: boolean;
  setEditalAtivo: (editalId: string) => void;
  addErro: (erroData: Omit<CadernoErro, 'id'>) => Promise<CadernoErro>;
  updateErro: (id: string, updates: Partial<CadernoErro>) => Promise<void>;
  removeErro: (id: string) => Promise<void>;
  addRevisao: (erroId: string, revisao: RevisaoErro) => Promise<void>;
  importErros: (errosImportados: CadernoErro[]) => void;
  recoverLostData: () => void;
  removeDataForEdital: (editalId: string) => void;
  initializeDataForEdital: (editalId: string) => void;
}

export const useCadernoErrosStore = create<CadernoErrosStore>()(
  persist(
    (set, get) => ({
      erros: [],
      errosPorEdital: {},
      editalAtivoId: null,
      _hasHydrated: false,
      setEditalAtivo: (editalId) => {
        set(state => {
          let errosDoEdital = state.errosPorEdital[editalId];
          const newState = { ...state.errosPorEdital };

          if (errosDoEdital === undefined) {
            errosDoEdital = mockErrosPorEdital[editalId] ?? [];
            newState[editalId] = errosDoEdital;
          }

          return {
            editalAtivoId: editalId,
            erros: errosDoEdital,
            errosPorEdital: newState,
          };
        });
      },
      addErro: async (erroData) => {
        const { editalAtivoId } = get();
        if (!editalAtivoId) throw new Error("Edital não selecionado");

        const newErro: CadernoErro = {
          ...erroData,
          id: generateId(),
        };
        set(state => {
          const novosErros = [...state.erros, newErro];
          return {
            erros: novosErros,
            errosPorEdital: { ...state.errosPorEdital, [editalAtivoId]: novosErros },
          };
        });
        return newErro;
      },
      updateErro: async (id, updates) => {
        const { editalAtivoId } = get();
        if (!editalAtivoId) return;

        set(state => {
          const novosErros = state.erros.map(e => e.id === id ? { ...e, ...updates } : e);
          return {
            erros: novosErros,
            errosPorEdital: { ...state.errosPorEdital, [editalAtivoId]: novosErros },
          };
        });
      },
      removeErro: async (id) => {
        const { editalAtivoId } = get();
        if (!editalAtivoId) return;
        
        set(state => {
          const novosErros = state.erros.filter(e => e.id !== id);
          return {
            erros: novosErros,
            errosPorEdital: { ...state.errosPorEdital, [editalAtivoId]: novosErros },
          };
        });
      },
      addRevisao: async (erroId, revisao) => {
        const { editalAtivoId } = get();
        if (!editalAtivoId) return;

        set(state => {
          const novosErros = state.erros.map(e => {
            if (e.id === erroId) {
              return { ...e, revisoes: [...(e.revisoes || []), revisao] };
            }
            return e;
          });
          return {
            erros: novosErros,
            errosPorEdital: { ...state.errosPorEdital, [editalAtivoId]: novosErros },
          };
        });
      },
      importErros: (errosImportados) => {
        const { editalAtivoId } = get();
        if (!editalAtivoId) return;

        set(state => {
          const errosAtuais = state.erros;
          // Avoid duplicates by ID
          const novosErros = errosImportados.filter(imp => !errosAtuais.some(curr => curr.id === imp.id));
          const mergedErros = [...errosAtuais, ...novosErros];
          return {
            erros: mergedErros,
            errosPorEdital: { ...state.errosPorEdital, [editalAtivoId]: mergedErros },
          };
        });
      },
      recoverLostData: () => {
        // Mock recovery logic
        console.log("Attempting to recover lost data...");
        // This would typically involve more complex logic, like checking another storage.
        // For now, it can re-initialize from mock data if empty.
        const { editalAtivoId, erros } = get();
        if (editalAtivoId && erros.length === 0) {
            set(state => {
                const errosDoEdital = mockErrosPorEdital[editalAtivoId] ?? [];
                return {
                    erros: errosDoEdital,
                    errosPorEdital: { ...state.errosPorEdital, [editalAtivoId]: errosDoEdital }
                }
            });
        }
      },
      removeDataForEdital: (editalId) => {
        set(state => {
          const { [editalId]: _, ...rest } = state.errosPorEdital;
          return { errosPorEdital: rest };
        });
      },
      initializeDataForEdital: (editalId) => {
        set(state => {
            if (state.errosPorEdital[editalId] === undefined) {
                return {
                    errosPorEdital: { ...state.errosPorEdital, [editalId]: [] },
                };
            }
            return state;
        });
      },
    }),
    {
      name: 'evolui-erros-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state._hasHydrated = true;
      },
    }
  )
);