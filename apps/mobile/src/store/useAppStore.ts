import { mmkvStorage } from "@/src/utils/mmkvStorage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Post } from "@/src/services/feedService";
import {
  toggleSavePlace as apiToggleSavePlace,
  toggleSavePost as apiToggleSavePost,
  clearSavedPlacesApi as apiClearSavedPlaces,
  clearSavedPostsApi as apiClearSavedPosts,
} from "@/src/services/savedService";
import type { Place } from "@/src/services/mekanService";
import { logger } from "@/src/utils/logger";

export type SavedPlace = {
  id: string;
  name: string;
  subtitle?: string;
  description?: string;
  address?: string;
  photo_url?: string;
  category?: string;
  tags?: string[];
};

export type SavedPost = Post;

type AppState = {
  savedIds: string[];
  savedById: Record<string, SavedPlace>;
  savedPostIds: string[];
  savedPostsById: Record<string, SavedPost>;
  recentPrompts: string[];
  apiHealthy: boolean | null;

  isSaved: (id: string) => boolean;
  toggleSave: (place: SavedPlace) => void;
  removeSaved: (id: string | number) => void;
  clearSaved: () => void;

  isPostSaved: (id: string | number) => boolean;
  toggleSavePost: (post: SavedPost) => void;
  removeSavedPost: (id: string | number) => void;
  clearSavedPosts: () => void;

  addRecentPrompt: (prompt: string) => void;
  clearRecentPrompts: () => void;

  setApiHealthy: (healthy: boolean) => void;

  pendingPlaceName: string | null;
  setPendingPlaceName: (name: string) => void;
  clearPendingPlace: () => void;

  pendingSharedPostId: number | null;
  setPendingSharedPostId: (id: number) => void;
  clearPendingSharedPostId: () => void;

  unreadNotificationCount: number;
  setUnreadNotificationCount: (count: number) => void;
  addUnreadNotificationCount: (count: number) => void;
  clearUnreadNotificationCount: () => void;

  clusterPlaceIds: string[];
  setClusterPlaceIds: (ids: string[]) => void;

  deletedPostIds: number[];
  addDeletedPostId: (id: number) => void;
  clearDeletedPostIds: () => void;

  viewedStoryGroupKeys: string[];
  addViewedStoryGroupKey: (key: string) => void;
  clearViewedStoryGroupKeys: () => void;

  blockedUserIds: number[];
  addBlockedUserId: (id: number) => void;
  clearBlockedUserIds: () => void;

  globalPlaces: Place[];
  isGlobalPlacesLoading: boolean;
  setGlobalPlaces: (places: Place[]) => void;
  setIsGlobalPlacesLoading: (loading: boolean) => void;
};

const uniq = (arr: string[]) => Array.from(new Set(arr));

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      savedIds: [],
      savedById: {},
      savedPostIds: [],
      savedPostsById: {},
      recentPrompts: [],
      apiHealthy: null,
      pendingPlaceName: null,
      pendingSharedPostId: null,
      unreadNotificationCount: 0,
      deletedPostIds: [],
      viewedStoryGroupKeys: [],
      blockedUserIds: [],
      clusterPlaceIds: [],
      globalPlaces: [],
      isGlobalPlacesLoading: false,

      setGlobalPlaces: (places) => set({ globalPlaces: places }),
      setIsGlobalPlacesLoading: (loading) => set({ isGlobalPlacesLoading: loading }),

      isSaved: (id) => get().savedIds.includes(id),

      toggleSave: (place) => {
        const { savedIds, savedById } = get();
        const exists = savedIds.includes(place.id);

        // Optimistic update — UI anında değişir
        if (exists) {
          const nextIds = savedIds.filter((x) => x !== place.id);
          const { [place.id]: _removed, ...rest } = savedById;
          set({ savedIds: nextIds, savedById: rest });
        } else {
          set({
            savedIds: uniq([place.id, ...savedIds]),
            savedById: { ...savedById, [place.id]: place },
          });
        }

        // Backend sync (fire-and-forget)
        const numericId = Number(place.id);
        if (!isNaN(numericId)) {
          apiToggleSavePlace(numericId).catch((err) =>
            logger.warn("[toggleSave] Backend sync failed:", err)
          );
        }
      },

      removeSaved: (id) => {
        const key = String(id);
        const { savedIds, savedById } = get();
        const nextIds = savedIds.filter((x) => x !== key);
        const { [key]: _removed, ...rest } = savedById;
        set({ savedIds: nextIds, savedById: rest });

        // Backend sync
        const numericId = Number(id);
        if (!isNaN(numericId)) {
          apiToggleSavePlace(numericId).catch((err) =>
            logger.warn("[removeSaved] Backend sync failed:", err)
          );
        }
      },

      clearSaved: () => {
        set({ savedIds: [], savedById: {} });
        apiClearSavedPlaces().catch((err) =>
          logger.warn("[clearSaved] Backend sync failed:", err)
        );
      },

      isPostSaved: (id) => get().savedPostIds.includes(String(id)),

      toggleSavePost: (post) => {
        const key = String(post.id);
        const { savedPostIds, savedPostsById } = get();
        const exists = savedPostIds.includes(key);

        // Optimistic update
        if (exists) {
          const nextIds = savedPostIds.filter((x) => x !== key);
          const { [key]: _removed, ...rest } = savedPostsById;
          set({ savedPostIds: nextIds, savedPostsById: rest });
        } else {
          set({
            savedPostIds: uniq([key, ...savedPostIds]),
            savedPostsById: { ...savedPostsById, [key]: post },
          });
        }

        // Backend sync
        const numericId = Number(post.id);
        if (!isNaN(numericId)) {
          apiToggleSavePost(numericId).catch((err) =>
            logger.warn("[toggleSavePost] Backend sync failed:", err)
          );
        }
      },

      removeSavedPost: (id) => {
        const key = String(id);
        const { savedPostIds, savedPostsById } = get();
        const nextIds = savedPostIds.filter((x) => x !== key);
        const { [key]: _removed, ...rest } = savedPostsById;
        set({ savedPostIds: nextIds, savedPostsById: rest });

        // Backend sync
        const numericId = Number(id);
        if (!isNaN(numericId)) {
          apiToggleSavePost(numericId).catch((err) =>
            logger.warn("[removeSavedPost] Backend sync failed:", err)
          );
        }
      },

      clearSavedPosts: () => {
        set({ savedPostIds: [], savedPostsById: {} });
        apiClearSavedPosts().catch((err) =>
          logger.warn("[clearSavedPosts] Backend sync failed:", err)
        );
      },

      addRecentPrompt: (prompt) => {
        const p = prompt.trim();
        if (!p) return;
        const { recentPrompts } = get();
        const next = [p, ...recentPrompts.filter((x) => x !== p)].slice(0, 12);
        set({ recentPrompts: next });
      },

      clearRecentPrompts: () => set({ recentPrompts: [] }),

      setApiHealthy: (healthy) => set({ apiHealthy: healthy }),

      setPendingPlaceName: (name) => set({ pendingPlaceName: name }),
      clearPendingPlace: () => set({ pendingPlaceName: null }),

      setPendingSharedPostId: (id) => set({ pendingSharedPostId: id }),
      clearPendingSharedPostId: () => set({ pendingSharedPostId: null }),

      setUnreadNotificationCount: (count) => set({ unreadNotificationCount: count }),
      addUnreadNotificationCount: (count) => set((state) => ({ unreadNotificationCount: state.unreadNotificationCount + count })),
      clearUnreadNotificationCount: () => {
        set({ unreadNotificationCount: 0 });
      },

      setClusterPlaceIds: (ids) => set({ clusterPlaceIds: ids }),

      addDeletedPostId: (id: number) => {
        set((state) => ({ deletedPostIds: uniq([...state.deletedPostIds.map(String), String(id)]).map(Number) }));
      },
      clearDeletedPostIds: () => {
        set({ deletedPostIds: [] });
      },

      addViewedStoryGroupKey: (key: string) => {
        set((state) => {
          const next = uniq([...state.viewedStoryGroupKeys, key]);
          // Bellek + MMKV serialize taşmasını önle — max 200 key tut
          return { viewedStoryGroupKeys: next.length > 200 ? next.slice(-200) : next };
        });
      },
      clearViewedStoryGroupKeys: () => {
        set({ viewedStoryGroupKeys: [] });
      },

      addBlockedUserId: (id: number) => {
        set((state) => ({ blockedUserIds: uniq([...state.blockedUserIds.map(String), String(id)]).map(Number) }));
      },
      clearBlockedUserIds: () => {
        set({ blockedUserIds: [] });
      },
    }),
    {
      name: "app-store-v2",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        savedIds: state.savedIds,
        savedById: state.savedById,
        savedPostIds: state.savedPostIds,
        savedPostsById: state.savedPostsById,
        recentPrompts: state.recentPrompts,
        viewedStoryGroupKeys: state.viewedStoryGroupKeys,
      }),
    }
  )
);
