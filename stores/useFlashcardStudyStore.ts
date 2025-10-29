import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Flashcard } from '../types';

export type StudySession = {
  deck: Flashcard[];
  name: string;
  isReviewSession: boolean;
};

interface FlashcardStudyState {
  session: StudySession | null;
  currentIndex: number;
  isFlipped: boolean;
  answers: Record<number, 'errei' | 'dificil' | 'bom' | 'facil'>;
  sessionStartTime: number | null;
  
  startSession: (session: StudySession) => void;
  flipCard: () => void;
  answerCard: (difficulty: 'errei' | 'dificil' | 'bom' | 'facil') => void;
  exitSession: () => void;
  removeCurrentCardFromSession: () => void;
}

export const useFlashcardStudyStore = create<FlashcardStudyState>()(
  persist(
    (set, get) => ({
      session: null,
      currentIndex: 0,
      isFlipped: false,
      answers: {},
      sessionStartTime: null,
      
      startSession: (session) => {
        // Embaralha o deck antes de iniciar, exceto para sessões de revisão que já podem ter uma ordem
        const shuffledDeck = session.isReviewSession ? session.deck : [...session.deck].sort(() => Math.random() - 0.5);
        set({ 
          session: { ...session, deck: shuffledDeck }, 
          currentIndex: 0, 
          isFlipped: false, 
          answers: {},
          sessionStartTime: Date.now(),
        });
      },
      
      flipCard: () => {
        set(state => ({ isFlipped: !state.isFlipped }));
      },
      
      answerCard: (difficulty) => {
        set(state => ({
          answers: { ...state.answers, [state.currentIndex]: difficulty },
          currentIndex: state.currentIndex + 1,
          isFlipped: false,
        }));
      },
      
      exitSession: () => {
        set({ session: null, currentIndex: 0, isFlipped: false, answers: {}, sessionStartTime: null });
      },

      removeCurrentCardFromSession: () => {
        set(state => {
          if (!state.session) return {};
          const newDeck = state.session.deck.filter((_, index) => index !== state.currentIndex);
          
          return {
            session: {
              ...state.session,
              deck: newDeck,
            },
            isFlipped: false,
          };
        });
      },
    }),
    {
      name: 'flashcard-study-session',
      storage: createJSONStorage(() => localStorage),
    }
  )
);