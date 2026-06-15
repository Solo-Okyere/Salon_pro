import { create } from "zustand";
import type { QueueEntry } from "@/types";

interface QueueState {
  entries: QueueEntry[];
  myEntry: QueueEntry | null;
  shopId: string | null;
  setEntries: (entries: QueueEntry[]) => void;
  addEntry: (entry: QueueEntry) => void;
  updateEntry: (id: string, updates: Partial<QueueEntry>) => void;
  removeEntry: (id: string) => void;
  setMyEntry: (entry: QueueEntry | null) => void;
  setShopId: (shopId: string) => void;
}

export const useQueueStore = create<QueueState>((set) => ({
  entries: [],
  myEntry: null,
  shopId: null,

  setEntries: (entries) => set({ entries }),

  addEntry: (entry) =>
    set((state) => ({ entries: [...state.entries, entry] })),

  updateEntry: (id, updates) =>
    set((state) => ({
      entries: state.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      myEntry: state.myEntry?.id === id ? { ...state.myEntry, ...updates } : state.myEntry,
    })),

  removeEntry: (id) =>
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
      myEntry: state.myEntry?.id === id ? null : state.myEntry,
    })),

  setMyEntry: (entry) => set({ myEntry: entry }),
  setShopId: (shopId) => set({ shopId }),
}));
