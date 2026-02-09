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

type SavedPlacesState = {
  ids: string[];
  byId: Record<string, SavedPlace>;

  isSaved: (id: string) => boolean;
  toggle: (place: SavedPlace) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const uniq = (arr: string[]) => Array.from(new Set(arr));

export const useSavedPlaces = create<SavedPlacesState>()(
  persist(
    (set, get) => ({
      ids: [],
      byId: {},

      isSaved: (id) => get().ids.includes(id),

      toggle: (place) => {
        const { ids, byId } = get();
        const exists = ids.includes(place.id);

        if (exists) {
          const nextIds = ids.filter((x) => x !== place.id);
          const { [place.id]: _removed, ...rest } = byId;
          set({ ids: nextIds, byId: rest });
          return;
        }

        set({
          ids: uniq([place.id, ...ids]),
          byId: { ...byId, [place.id]: place },
        });
      },

      remove: (id) => {
        const { ids, byId } = get();
        const nextIds = ids.filter((x) => x !== id);
        const { [id]: _removed, ...rest } = byId;
        set({ ids: nextIds, byId: rest });
      },

      clear: () => set({ ids: [], byId: {} }),
    }),
    {
      name: "saved-places-v1",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
