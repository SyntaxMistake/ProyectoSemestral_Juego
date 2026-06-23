import { create } from "zustand";

export const useSessionStore = create((set) => ({
  streak: 0,
  correctCount: 0,
  wrongCount: 0,

  incrementStreak: () => set((s) => ({ streak: s.streak + 1 })),
  resetStreak: () => set({ streak: 0 }),
  incrementCorrect: () => set((s) => ({ correctCount: s.correctCount + 1 })),
  incrementWrong: () => set((s) => ({ wrongCount: s.wrongCount + 1 })),
  resetSession: () => set({ streak: 0, correctCount: 0, wrongCount: 0 }),
}));
