// store/authStore.ts

import { create } from 'zustand';

import type { SessionUser } from '@/lib/session-types';

interface AuthState {
  user: SessionUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setUser: (user: SessionUser | null) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  setUser: (user) => set({ user, isAuthenticated: Boolean(user), isInitialized: true }),
  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } finally {
      set({ user: null, isAuthenticated: false, isInitialized: true });
    }
  },
  initialize: async () => {
    try {
      const response = await fetch('/api/auth/session', { cache: 'no-store', credentials: 'same-origin' });
      if (!response.ok) throw new Error('Session unavailable');
      const data = (await response.json()) as { user: SessionUser };
      set({ user: data.user, isAuthenticated: true, isInitialized: true });
    } catch {
      set({ user: null, isAuthenticated: false, isInitialized: true });
    }
  },
}));
