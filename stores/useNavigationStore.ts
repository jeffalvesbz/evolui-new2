import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NavigationHistoryItem {
  view: string;
  timestamp: number;
  count: number;
}

interface NavigationStore {
  // Histórico de navegação
  navigationHistory: NavigationHistoryItem[];
  addToHistory: (view: string) => void;
  
  // Páginas favoritas
  favoriteViews: string[];
  toggleFavorite: (view: string) => void;
  
  // Última página visitada
  lastVisitedView: string | null;
  setLastVisitedView: (view: string) => void;
  
  // Preferências
  preferences: {
    restoreLastPage: boolean;
  };
  setPreference: (key: keyof NavigationStore['preferences'], value: boolean) => void;
}

export const useNavigationStore = create<NavigationStore>()(
  persist(
    (set, get) => ({
      navigationHistory: [],
      favoriteViews: [],
      lastVisitedView: null,
      preferences: {
        restoreLastPage: true,
      },

      addToHistory: (view: string) => {
        const history = get().navigationHistory;
        const existingIndex = history.findIndex(item => item.view === view);
        
        let updatedHistory: NavigationHistoryItem[];
        
        if (existingIndex >= 0) {
          // Atualizar item existente
          updatedHistory = history.map((item, index) =>
            index === existingIndex
              ? { ...item, timestamp: Date.now(), count: item.count + 1 }
              : item
          );
        } else {
          // Adicionar novo item
          updatedHistory = [
            ...history,
            { view, timestamp: Date.now(), count: 1 },
          ];
        }
        
        // Ordenar por frequência e recência (máximo 50 itens)
        updatedHistory.sort((a, b) => {
          // Primeiro por frequência, depois por recência
          if (b.count !== a.count) return b.count - a.count;
          return b.timestamp - a.timestamp;
        });
        
        updatedHistory = updatedHistory.slice(0, 50);
        
        set({ 
          navigationHistory: updatedHistory,
          lastVisitedView: view,
        });
      },

      toggleFavorite: (view: string) => {
        const favorites = get().favoriteViews;
        const isFavorite = favorites.includes(view);
        
        set({
          favoriteViews: isFavorite
            ? favorites.filter(v => v !== view)
            : [...favorites, view],
        });
      },

      setLastVisitedView: (view: string) => {
        set({ lastVisitedView: view });
      },

      setPreference: (key, value) => {
        set({
          preferences: {
            ...get().preferences,
            [key]: value,
          },
        });
      },
    }),
    {
      name: 'navigation-storage',
      partialize: (state) => ({
        navigationHistory: state.navigationHistory,
        favoriteViews: state.favoriteViews,
        lastVisitedView: state.lastVisitedView,
        preferences: state.preferences,
      }),
    }
  )
);




