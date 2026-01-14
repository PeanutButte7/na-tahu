import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { GameSession } from '../types';
import { zustandStorage } from './storage';

interface GameSetup {
  playerCount: number;
  targetScore: number;
  selectedPackIds: string[];
}

interface GameState {
  session: GameSession | null;
  lastSetup: GameSetup | null;
  startSession: (session: GameSession) => void;
  updateCurrentPlayerScore: (points: number) => void;
  nextTurn: () => void;
  endSession: () => void;
  setLastSetup: (setup: GameSetup) => void;
  resetGameData: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      session: null,
      lastSetup: { playerCount: 2, targetScore: 10, selectedPackIds: [] },
      startSession: (session) => set({ session }),
      updateCurrentPlayerScore: (points) =>
        set((state) => {
          const session = state.session;
          if (!session) return {};
          const players = session.players.map((p, i) => 
            i === session.currentPlayerIndex 
              ? { ...p, score: p.score + points } 
              : p
          );
          return { session: { ...session, players } };
        }),
      nextTurn: () =>
        set((state) => {
          if (!state.session) return {};
          const nextPlayerIndex =
            (state.session.currentPlayerIndex + 1) % state.session.players.length;
          const nextQuestionIndex = state.session.currentQuestionIndex + 1;
          return {
            session: {
              ...state.session,
              currentPlayerIndex: nextPlayerIndex,
              currentQuestionIndex: nextQuestionIndex,
            },
          };
        }),
      endSession: () =>
        set((state) => {
          if (!state.session) return {};
          return { session: { ...state.session, isActive: false } };
        }),
      setLastSetup: (setup) => set({ lastSetup: setup }),
      resetGameData: () =>
        set({
          session: null,
          lastSetup: { playerCount: 2, targetScore: 10, selectedPackIds: [] },
        }),
    }),
    {
      name: 'game-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
