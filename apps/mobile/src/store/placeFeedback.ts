import { mmkvStorage } from "@/src/utils/mmkvStorage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type FeedbackVote = "like" | "dislike";

export type PlaceFeedback = {
  id: string;
  vote: FeedbackVote | null;
  reasons: string[]; // quick feedback tags
  updatedAt: number;
};

type PlaceFeedbackState = {
  byId: Record<string, PlaceFeedback>;

  get: (id: string) => PlaceFeedback | null;

  setVote: (id: string, vote: FeedbackVote | null) => void;
  toggleVote: (id: string, vote: FeedbackVote) => void;

  toggleReason: (id: string, reason: string) => void;
  clear: (id: string) => void;
  clearAll: () => void;
};

function uniq(arr: string[]) {
  return Array.from(new Set(arr));
}

export const usePlaceFeedback = create<PlaceFeedbackState>()(
  persist(
    (set, get) => ({
      byId: {},

      get: (id) => get().byId[id] ?? null,

      setVote: (id, vote) => {
        const current = get().byId[id];
        const next: PlaceFeedback = {
          id,
          vote,
          reasons: current?.reasons ?? [],
          updatedAt: Date.now(),
        };
        set((s) => ({
          byId: { ...s.byId, [id]: next },
        }));
      },

      toggleVote: (id, vote) => {
        const current = get().byId[id];
        const nextVote: FeedbackVote | null =
          current?.vote === vote ? null : vote;

        const next: PlaceFeedback = {
          id,
          vote: nextVote,
          reasons: current?.reasons ?? [],
          updatedAt: Date.now(),
        };

        set((s) => ({
          byId: { ...s.byId, [id]: next },
        }));
      },

      toggleReason: (id, reason) => {
        const current = get().byId[id];
        const reasons = current?.reasons ?? [];
        const exists = reasons.includes(reason);
        const nextReasons = exists
          ? reasons.filter((r) => r !== reason)
          : uniq([reason, ...reasons]);

        const next: PlaceFeedback = {
          id,
          vote: current?.vote ?? null,
          reasons: nextReasons,
          updatedAt: Date.now(),
        };

        set((s) => ({
          byId: { ...s.byId, [id]: next },
        }));
      },

      clear: (id) => {
        set((s) => {
          const { [id]: _removed, ...rest } = s.byId;
          return { byId: rest };
        });
      },

      clearAll: () => set({ byId: {} }),
    }),
    {
      name: "place-feedback-v1",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);