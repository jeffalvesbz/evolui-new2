import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Flashcard } from '../types';
import { addDays, startOfDay, isAfter } from 'date-fns';

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

interface FlashcardStore {
  flashcards: Flashcard[];
  _hasHydrated: boolean;
  addFlashcards: (newFlashcards: Omit<Flashcard, 'id' | 'topico_id' | 'interval' | 'easeFactor' | 'dueDate'>[], topicoId: string) => void;
  updateFlashcard: (id: string, updates: Partial<Flashcard>) => void;
  getFlashcardsByTopic: (topicoId: string) => Flashcard[];
  getDueFlashcards: () => Flashcard[];
  getUpcomingFlashcards: () => Flashcard[];
  fetchFlashcards: (userId: string, force?: boolean) => Promise<void>;
  removeFlashcardsByTopicIds: (topicIds: string[]) => void;
}

export const useFlashcardsStore = create<FlashcardStore>()(
  persist(
    (set, get) => ({
      flashcards: [],
      _hasHydrated: false,
      addFlashcards: (newFlashcards, topicoId) => {
        const tomorrow = startOfDay(addDays(new Date(), 1));

        const formattedFlashcards: Flashcard[] = newFlashcards.map(fc => ({
          ...fc,
          id: generateId('flashcard'),
          topico_id: topicoId,
          // Initialize SRS properties
          interval: 1,
          easeFactor: 2.5,
          dueDate: tomorrow.toISOString(),
        }));

        set(state => ({
          flashcards: [...state.flashcards, ...formattedFlashcards],
        }));
      },
      updateFlashcard: (id, updates) => {
        set(state => ({
          flashcards: state.flashcards.map(fc =>
            fc.id === id ? { ...fc, ...updates } : fc
          ),
        }));
      },
      getFlashcardsByTopic: (topicoId) => {
        return get().flashcards.filter(fc => fc.topico_id === topicoId);
      },
      getDueFlashcards: () => {
        const today = startOfDay(new Date());
        return get().flashcards.filter(fc => {
            const dueDate = startOfDay(new Date(fc.dueDate));
            return dueDate <= today;
        });
      },
      getUpcomingFlashcards: () => {
        const today = startOfDay(new Date());
        return get().flashcards.filter(fc => {
            const dueDate = startOfDay(new Date(fc.dueDate));
            return isAfter(dueDate, today);
        });
      },
      fetchFlashcards: async (userId, force = false) => {
        console.log(`Fetching flashcards for user ${userId}, force: ${force}`);
        // This is a placeholder for a future API call.
        return Promise.resolve();
      },
      removeFlashcardsByTopicIds: (topicIds) => {
          const topicIdSet = new Set(topicIds);
          set(state => ({
              flashcards: state.flashcards.filter(fc => !topicIdSet.has(fc.topico_id))
          }));
      },
    }),
    {
      name: 'evolui-flashcards-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state._hasHydrated = true;
      },
    }
  )
);