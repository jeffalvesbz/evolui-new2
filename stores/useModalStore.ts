import { create } from 'zustand';
import { CadernoErro, Flashcard } from '../types';

interface ModalStore {
  isEditalModalOpen: boolean;
  openEditalModal: () => void;
  closeEditalModal: () => void;
  
  isAddTopicModalOpen: boolean;
  addTopicTargetDisciplinaId: string | null;
  shouldOpenInBatchMode: boolean;
  openAddTopicModal: (disciplinaId: string) => void;
  openAddTopicModalBatch: (disciplinaId: string) => void;
  closeAddTopicModal: () => void;

  isCriarCicloModalOpen: boolean;
  openCriarCicloModal: () => void;
  closeCriarCicloModal: () => void;

  isErroModalOpen: boolean;
  erroEmEdicao: CadernoErro | null;
  openErroModal: (erro?: CadernoErro | null) => void;
  closeErroModal: () => void;

  isGeradorPlanoModalOpen: boolean;
  openGeradorPlanoModal: () => void;
  closeGeradorPlanoModal: () => void;

  isCriarFlashcardModalOpen: boolean;
  flashcardToEdit: Flashcard | null;
  openCriarFlashcardModal: (flashcard?: Flashcard) => void;
  closeCriarFlashcardModal: () => void;

  isAgendarRevisoesModalOpen: boolean;
  agendarRevisoesData: { disciplinaId: string; disciplinaNome: string; topicoId: string; topicoNome: string } | null;
  openAgendarRevisoesModal: (data: { disciplinaId: string; disciplinaNome: string; topicoId: string; topicoNome: string }) => void;
  closeAgendarRevisoesModal: () => void;
  
  closeAllModals: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  isEditalModalOpen: false,
  openEditalModal: () => set({ isEditalModalOpen: true }),
  closeEditalModal: () => set({ isEditalModalOpen: false }),
  
  isAddTopicModalOpen: false,
  addTopicTargetDisciplinaId: null,
  shouldOpenInBatchMode: false,
  openAddTopicModal: (disciplinaId: string) => set({ isAddTopicModalOpen: true, addTopicTargetDisciplinaId: disciplinaId, shouldOpenInBatchMode: false }),
  openAddTopicModalBatch: (disciplinaId: string) => set({ isAddTopicModalOpen: true, addTopicTargetDisciplinaId: disciplinaId, shouldOpenInBatchMode: true }),
  closeAddTopicModal: () => set({ isAddTopicModalOpen: false, addTopicTargetDisciplinaId: null, shouldOpenInBatchMode: false }),

  isCriarCicloModalOpen: false,
  openCriarCicloModal: () => set({ isCriarCicloModalOpen: true }),
  closeCriarCicloModal: () => set({ isCriarCicloModalOpen: false }),

  isErroModalOpen: false,
  erroEmEdicao: null,
  openErroModal: (erro = null) => set({ isErroModalOpen: true, erroEmEdicao: erro }),
  closeErroModal: () => set({ isErroModalOpen: false, erroEmEdicao: null }),

  isGeradorPlanoModalOpen: false,
  openGeradorPlanoModal: () => set({ isGeradorPlanoModalOpen: true }),
  closeGeradorPlanoModal: () => set({ isGeradorPlanoModalOpen: false }),

  isCriarFlashcardModalOpen: false,
  flashcardToEdit: null,
  openCriarFlashcardModal: (flashcard = null) => set({ isCriarFlashcardModalOpen: true, flashcardToEdit: flashcard }),
  closeCriarFlashcardModal: () => set({ isCriarFlashcardModalOpen: false, flashcardToEdit: null }),

  isAgendarRevisoesModalOpen: false,
  agendarRevisoesData: null,
  openAgendarRevisoesModal: (data) => set({ isAgendarRevisoesModalOpen: true, agendarRevisoesData: data }),
  closeAgendarRevisoesModal: () => set({ isAgendarRevisoesModalOpen: false, agendarRevisoesData: null }),
  
  closeAllModals: () => set({
    isEditalModalOpen: false,
    isAddTopicModalOpen: false,
    addTopicTargetDisciplinaId: null,
    shouldOpenInBatchMode: false,
    isCriarCicloModalOpen: false,
    isErroModalOpen: false,
    erroEmEdicao: null,
    isGeradorPlanoModalOpen: false,
    isCriarFlashcardModalOpen: false,
    flashcardToEdit: null,
    isAgendarRevisoesModalOpen: false,
    agendarRevisoesData: null,
  }),
}));