import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Simulation {
  id: string;
  name: string;
  correct: number;
  wrong: number;
  blank?: number;
  durationMinutes: number;
  notes?: string;
  date: string; // ISO string
  edital_id: string;
  isCebraspe?: boolean;
}

interface StudyStore {
  simulations: Simulation[];
  _hasHydrated: boolean;
  addSimulation: (simulation: Omit<Simulation, 'id'>) => Promise<Simulation>;
  updateSimulation: (id: string, updates: Partial<Simulation>) => Promise<void>;
  deleteSimulation: (id: string) => Promise<void>;
}

const generateId = () => `sim-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const useStudyStore = create<StudyStore>()(
  persist(
    (set) => ({
      simulations: [],
      _hasHydrated: false,
      addSimulation: async (simulationData) => {
        const newSimulation: Simulation = {
          ...simulationData,
          id: generateId(),
        };
        set(state => ({ simulations: [...state.simulations, newSimulation] }));
        return newSimulation;
      },
      updateSimulation: async (id, updates) => {
        set(state => ({
          simulations: state.simulations.map(sim => 
            sim.id === id ? { ...sim, ...updates } : sim
          ),
        }));
      },
      deleteSimulation: async (id) => {
        set(state => ({
          simulations: state.simulations.filter(sim => sim.id !== id),
        }));
      },
    }),
    {
      name: 'evolui-study-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state._hasHydrated = true;
      },
    }
  )
);