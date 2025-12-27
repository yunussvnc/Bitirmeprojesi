import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Place = {
  id: string;
  name: string;
  area?: string;
  distanceKm?: number;
  priceLevel?: 1 | 2 | 3 | 4;
  rating?: number;
  tags?: string[];
  whyRecommended?: string;
  imageUrl?: string;
};

type AppState = {
  // Saved
  savedPlaceIds: string[];
  savedPlacesById: Record<string, Place>;

  // Demo gücü: prompt geçmişi
  recentPrompts: string[];

  // Actions
  isSaved: (placeId: string) => boolean;
  toggleSave: (place: Place) => void;
  removeSaved: (placeId: string) => void;
  clearSaved: () => void;

  addRecentPrompt: (prompt: string) => void;
  clearRecentPrompts: () => void;
};

const uniq = (arr: string[]) => Array.from(new Set(arr));

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      savedPlaceIds: [],
      savedPlacesById: {},
      recentPrompts: [],

      isSaved: (placeId) => get().savedPlaceIds.includes(placeId),

      toggleSave: (place) => {
        const { savedPlaceIds, savedPlacesById } = get();
        const exists = savedPlaceIds.includes(place.id);

        if (exists) {
          const nextIds = savedPlaceIds.filter((id) => id !== place.id);
          const { [place.id]: _removed, ...rest } = savedPlacesById;
          set({ savedPlaceIds: nextIds, savedPlacesById: rest });
          return;
        }

        set({
          savedPlaceIds: uniq([place.id, ...savedPlaceIds]),
          savedPlacesById: { ...savedPlacesById, [place.id]: place },
        });
      },

      removeSaved: (placeId) => {
        const { savedPlaceIds, savedPlacesById } = get();
        const nextIds = savedPlaceIds.filter((id) => id !== placeId);
        const { [placeId]: _removed, ...rest } = savedPlacesById;
        set({ savedPlaceIds: nextIds, savedPlacesById: rest });
      },

      clearSaved: () => set({ savedPlaceIds: [], savedPlacesById: {} }),

      addRecentPrompt: (prompt) => {
        const p = prompt.trim();
        if (!p) return;

        const { recentPrompts } = get();
        const next = [p, ...recentPrompts.filter((x) => x !== p)].slice(0, 12);
        set({ recentPrompts: next });
      },

      clearRecentPrompts: () => set({ recentPrompts: [] }),
    }),
    {
      name: "app-store-v1",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
