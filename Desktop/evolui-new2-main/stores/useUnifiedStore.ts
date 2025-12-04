import { create } from 'zustand';

interface UnifiedStore {
  syncing: boolean;
  setSyncing: (syncing: boolean) => void;
}

export const useUnifiedStore = create<UnifiedStore>((set) => ({
  syncing: false,
  setSyncing: (syncing) => set({ syncing }),
}));
