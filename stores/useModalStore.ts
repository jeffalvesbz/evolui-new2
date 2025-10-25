import { create } from 'zustand';
import { CadernoErro } from '../types';

interface ModalStore {
  isEditalModalOpen: boolean;
  openEditalModal: () => void;
  closeEditalModal: () => void;
  
  isAddTopicModalOpen: boolean;
  addTopicTargetDisciplinaId: string | null;
  openAddTopicModal: (disciplinaId: string) => void;
  closeAddTopicModal: () => void;

  isCriarCicloModalOpen: boolean;
  openCriarCicloModal: () => void;
  closeCriarCicloModal: () => void;

  isErroModalOpen: boolean;
  erroEmEdicao: CadernoErro | null;
  openErroModal: (erro?: CadernoErro | null) => void;
  closeErroModal: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  isEditalModalOpen: false,
  openEditalModal: () => set({ isEditalModalOpen: true }),
  closeEditalModal: () => set({ isEditalModalOpen: false }),
  
  isAddTopicModalOpen: false,
  addTopicTargetDisciplinaId: null,
  openAddTopicModal: (disciplinaId: string) => set({ isAddTopicModalOpen: true, addTopicTargetDisciplinaId: disciplinaId }),
  closeAddTopicModal: () => set({ isAddTopicModalOpen: false, addTopicTargetDisciplinaId: null }),

  isCriarCicloModalOpen: false,
  openCriarCicloModal: () => set({ isCriarCicloModalOpen: true }),
  closeCriarCicloModal: () => set({ isCriarCicloModalOpen: false }),

  isErroModalOpen: false,
  erroEmEdicao: null,
  openErroModal: (erro = null) => set({ isErroModalOpen: true, erroEmEdicao: erro }),
  closeErroModal: () => set({ isErroModalOpen: false, erroEmEdicao: null }),
}));