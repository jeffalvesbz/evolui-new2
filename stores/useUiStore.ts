import { create } from 'zustand';

interface UiStore {
  isTimerMinimized: boolean;
  isSaveModalOpen: boolean;
  toggleTimerMinimized: () => void;
  openSaveModal: () => void;
  closeSaveModal: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  isTimerMinimized: false,
  isSaveModalOpen: false,
  toggleTimerMinimized: () => set(state => ({ isTimerMinimized: !state.isTimerMinimized })),
  openSaveModal: () => set({ isSaveModalOpen: true }),
  closeSaveModal: () => set({ isSaveModalOpen: false }),
}));
