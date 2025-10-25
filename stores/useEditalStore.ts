import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { StudyPlan } from '../types';
import { mockStudyPlanPLF, mockStudyPlanENEM } from '../data/mockData';
import { useDisciplinasStore } from './useDisciplinasStore';
import { useFlashcardsStore } from './useFlashcardStore';
import { useRevisoesStore } from './useRevisoesStore';
import { useCadernoErrosStore } from './useCadernoErrosStore';
import { useEstudosStore } from './useEstudosStore';

const generateId = () => `plan-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

interface EditalStore {
  editais: StudyPlan[];
  editalAtivo: StudyPlan | null;
  _hasHydrated: boolean;
  setEditalAtivo: (edital: StudyPlan | null) => void;
  addEdital: (editalData: Omit<StudyPlan, 'id'>) => Promise<StudyPlan>;
  updateEdital: (id: string, updates: Partial<StudyPlan>) => Promise<void>;
  removeEdital: (id: string) => Promise<void>;
}

export const useEditalStore = create<EditalStore>()(
  persist(
    (set, get) => ({
      editais: [mockStudyPlanPLF, mockStudyPlanENEM],
      editalAtivo: null,
      _hasHydrated: false,
      setEditalAtivo: (edital) => set({ editalAtivo: edital }),
      
      addEdital: async (editalData) => {
          const newEdital: StudyPlan = {
              ...editalData,
              id: generateId(),
          };
          set(state => ({
              editais: [...state.editais, newEdital]
          }));

          // FIX: Initialize data structures for the new edital in all relevant stores to prevent data leakage from the previously active edital.
          useDisciplinasStore.getState().initializeDataForEdital(newEdital.id);
          useRevisoesStore.getState().initializeDataForEdital(newEdital.id);
          useCadernoErrosStore.getState().initializeDataForEdital(newEdital.id);
          useEstudosStore.getState().initializeDataForEdital(newEdital.id);
          
          return newEdital;
      },
      
      updateEdital: async (id, updates) => {
          set(state => ({
              editais: state.editais.map(e => (e.id === id ? { ...e, ...updates } : e)),
              // Also update editalAtivo if it's the one being edited
              editalAtivo: state.editalAtivo?.id === id ? { ...state.editalAtivo, ...updates } : state.editalAtivo
          }));
      },

      removeEdital: async (id) => {
          const { editais, editalAtivo } = get();
          
          // Data cleanup in other stores
          const disciplinasDoEdital = useDisciplinasStore.getState().disciplinasPorEdital[id] || [];
          const topicoIds = disciplinasDoEdital.flatMap(d => d.topicos.map(t => t.id));

          useFlashcardsStore.getState().removeFlashcardsByTopicIds(topicoIds);
          useDisciplinasStore.getState().removeDataForEdital(id);
          useRevisoesStore.getState().removeDataForEdital(id);
          useCadernoErrosStore.getState().removeDataForEdital(id);
          useEstudosStore.getState().removeDataForEdital(id);
          
          const novosEditais = editais.filter(e => e.id !== id);

          let novoEditalAtivo = editalAtivo;
          if (editalAtivo?.id === id) {
              novoEditalAtivo = novosEditais[0] || null;
          }
          
          set({ editais: novosEditais, editalAtivo: novoEditalAtivo });
      },
    }),
    {
      name: 'evolui-edital-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        editais: state.editais,
        editalAtivo: state.editalAtivo,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
            state._hasHydrated = true;
            // On first load after hydration, if no edital is active, set one.
            if (state.editalAtivo === null && state.editais.length > 0) {
                state.editalAtivo = state.editais[0];
            }
        }
      },
    }
  )
);