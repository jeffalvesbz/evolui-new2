import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { RedacaoCorrigida } from '../types';

interface RedacaoStore {
  historico: RedacaoCorrigida[];
  _hasHydrated: boolean;
  addCorrecao: (data: Omit<RedacaoCorrigida, 'id' | 'data'>) => void;
}

export const useRedacaoStore = create<RedacaoStore>()(
  persist(
    (set, get) => ({
      historico: [],
      _hasHydrated: false,
      addCorrecao: (data) => {
        const novaRedacaoCorrigida: RedacaoCorrigida = {
          ...data,
          id: `redacao-${Date.now()}`,
          data: new Date().toISOString(),
        };

        set(state => ({
          historico: [novaRedacaoCorrigida, ...state.historico],
        }));
      },
    }),
    {
      name: 'evolui-redacao-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state._hasHydrated = true;
      },
    }
  )
);