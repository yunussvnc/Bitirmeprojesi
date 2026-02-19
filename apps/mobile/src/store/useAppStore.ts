import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type SavedPlace = {
  id: string;
  name: string;
  subtitle?: string;
  photo_url?: string;
  category?: string;
  tags?: string[];
};

type AppState = {
  savedIds: string[];
  savedById: Record<string, SavedPlace>;
  recentPrompts: string[];
  apiHealthy: boolean | null;

  isSaved: (id: string) => boolean;
  toggleSave: (place: SavedPlace) => void;
  removeSaved: (id: string | number) => void;
  clearSaved: () => void;

  addRecentPrompt: (prompt: string) => void;
  clearRecentPrompts: () => void;

  setApiHealthy: (healthy: boolean) => void;
};

const uniq = (arr: string[]) => Array.from(new Set(arr));

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      savedIds: [],
      savedById: {},
      recentPrompts: [],
      apiHealthy: null,

      isSaved: (id) => get().savedIds.includes(id),

      toggleSave: (place) => {
        const { savedIds, savedById } = get();
        const exists = savedIds.includes(place.id);

        if (exists) {
          const nextIds = savedIds.filter((x) => x !== place.id);
          const { [place.id]: _removed, ...rest } = savedById;
          set({ savedIds: nextIds, savedById: rest });
          return;
        }

        set({
          savedIds: uniq([place.id, ...savedIds]),
          savedById: { ...savedById, [place.id]: place },
        });
      },

      removeSaved: (id) => {
        const key = String(id);
        const { savedIds, savedById } = get();
        const nextIds = savedIds.filter((x) => x !== key);
        const { [key]: _removed, ...rest } = savedById;
        set({ savedIds: nextIds, savedById: rest });
      },

      clearSaved: () => set({ savedIds: [], savedById: {} }),

      addRecentPrompt: (prompt) => {
        const p = prompt.trim();
        if (!p) return;
        const { recentPrompts } = get();
        const next = [p, ...recentPrompts.filter((x) => x !== p)].slice(0, 12);
        set({ recentPrompts: next });
      },

      clearRecentPrompts: () => set({ recentPrompts: [] }),

      setApiHealthy: (healthy) => set({ apiHealthy: healthy }),
    }),
    {
      name: "app-store-v2",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        savedIds: state.savedIds,
        savedById: state.savedById,
        recentPrompts: state.recentPrompts,
      }),
    }
  )
);
