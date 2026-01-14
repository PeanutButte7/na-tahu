import { fetchRemotePacks } from '@/lib/remotePacks';
import { Pack } from '@/types';
import { create } from 'zustand';

interface PackState {
  packs: Pack[] | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  loadRemotePacks: () => Promise<void>;
}

export const usePackStore = create<PackState>((set) => ({
  packs: null,
  status: 'idle',
  error: null,
  loadRemotePacks: async () => {
    set({ status: 'loading', error: null });
    try {
      const packs = await fetchRemotePacks();
      set({
        packs: packs.length > 0 ? packs : null,
        status: 'ready',
      });
    } catch (error) {
      set({
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to load packs',
      });
    }
  },
}));
