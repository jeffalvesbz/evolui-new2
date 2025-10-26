import { create } from 'zustand';
import { Flashcard } from '../types';
import { getFlashcards, createFlashcards, updateFlashcardApi } from '../services/geminiService';
import { toast } from '../components/Sonner';

interface FlashcardStore {
  flashcards: Flashcard[];
  loading: boolean;
  fetchFlashcardsByTopic: (topicoId: string) => Promise<void>;
  addFlashcards: (newFlashcards: Omit<Flashcard, 'id' | 'topico_id' | 'interval' | 'easeFactor' | 'dueDate'>[], topicoId: string) => Promise<void>;
  updateFlashcard: (id: string, updates: Partial<Flashcard>) => Promise<void>;
  getFlashcardsByTopic: (topicoId: string) => Flashcard[];
  getDueFlashcards: () => Flashcard[];
  getUpcomingFlashcards: () => Flashcard[];
  removeFlashcardsByTopicIds: (topicIds: string[]) => void; // Assume local removal for now
}

export const useFlashcardsStore = create<FlashcardStore>((set, get) => ({
      flashcards: [],
      loading: false,

      fetchFlashcardsByTopic: async (topicoId: string) => {
        set({ loading: true });
        try {
          const flashcards = await getFlashcards(topicoId);
          set(state => ({
            // Merge new flashcards, avoiding duplicates
            flashcards: [...state.flashcards.filter(fc => fc.topico_id !== topicoId), ...flashcards]
          }));
        } catch (error) {
          console.error(`Failed to fetch flashcards for topic ${topicoId}:`, error);
          toast.error("Não foi possível carregar os flashcards.");
        } finally {
          set({ loading: false });
        }
      },

      addFlashcards: async (newFlashcards, topicoId) => {
        try {
          const createdFlashcards = await createFlashcards(topicoId, { flashcards: newFlashcards });
          set(state => ({
            flashcards: [...state.flashcards, ...createdFlashcards],
          }));
        } catch(e) {
            toast.error("Falha ao salvar flashcards.");
            throw e;
        }
      },
      updateFlashcard: async (id, updates) => {
        try {
            const flashcardAtualizado = await updateFlashcardApi(id, updates);
            set(state => ({
              flashcards: state.flashcards.map(fc =>
                fc.id === id ? flashcardAtualizado : fc
              ),
            }));
        } catch(e) {
            toast.error("Falha ao atualizar flashcard.");
            // Opcional: reverter a UI para o estado anterior
            throw e;
        }
      },
      getFlashcardsByTopic: (topicoId) => {
        return get().flashcards.filter(fc => fc.topico_id === topicoId);
      },
      getDueFlashcards: () => {
        const today = new Date();
        today.setHours(0,0,0,0);
        return get().flashcards.filter(fc => new Date(fc.dueDate) <= today);
      },
      getUpcomingFlashcards: () => {
        const today = new Date();
        today.setHours(0,0,0,0);
        return get().flashcards.filter(fc => new Date(fc.dueDate) > today);
      },
      removeFlashcardsByTopicIds: (topicIds) => {
          // No backend, this would be a single API call
          console.warn("removeFlashcardsByTopicIds should be a backend operation");
          const topicIdSet = new Set(topicIds);
          set(state => ({
              flashcards: state.flashcards.filter(fc => !topicIdSet.has(fc.topico_id))
          }));
      },
    })
);