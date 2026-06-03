import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthUser } from "@/src/services/authService";
import { useMessagesStore } from "./useMessagesStore";
import { useChatMessagesStore } from "./useChatMessagesStore";
import { useNotificationStore } from "./useNotificationStore";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  hydrated: boolean;

  setTokens: (access: string, refresh: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  setHydrated: (v: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      hydrated: false,

      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh }),

      setUser: (user) => set({ user }),

      logout: () => {
        set({ accessToken: null, refreshToken: null, user: null });
        
        // Merkezi çıkış (logout) işleminde, eski verilerin diğer hesaplarda görünmesini
        // engellemek için yerel önbellekleri (store) temizle.
        useMessagesStore.getState().clearStore();
        useChatMessagesStore.getState().clearStore();
        useNotificationStore.setState({ notifications: [], followRequests: [], unreadCount: 0 });
      },

      setHydrated: (v) => set({ hydrated: v }),
    }),
    {
      name: "auth-store-v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
