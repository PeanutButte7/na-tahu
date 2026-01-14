import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from './storage';

interface AppState {
  ownedPackIds: string[];
  addPack: (id: string) => void;
  resetPacks: () => void;
  unlockedAll: boolean; // Dev
  setUnlockedAll: (val: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ownedPackIds: ['pack_general_1', 'pack_geo_1'], // Starter packs
      addPack: (id) => set((state) => ({ ownedPackIds: [...Array.from(new Set([...state.ownedPackIds, id]))] })),
      resetPacks: () => set({ ownedPackIds: ['pack_general_1', 'pack_geo_1'] }),
      unlockedAll: false,
      setUnlockedAll: (val) => set({ unlockedAll: val }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
