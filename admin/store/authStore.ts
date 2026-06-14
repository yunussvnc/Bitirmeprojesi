// store/authStore.ts

import { create } from 'zustand';
import { decodeToken, isTokenExpired } from '../lib/auth';

interface AuthState {
  token: string | null;
  user: {
    sub: string;
    role: string;
    email?: string;
  } | null;
  isAuthenticated: boolean;
  setToken: (token: string | null) => void;
  logout: () => void;
  initialize: () => void;
}

const setCookie = (name: string, value: string, days = 7) => {
  if (typeof window !== 'undefined') {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax; Secure=${window.location.protocol === 'https:'}`;
  }
};

const deleteCookie = (name: string) => {
  if (typeof window !== 'undefined') {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  setToken: (token) => {
    if (token) {
      localStorage.setItem('admin_token', token);
      setCookie('admin_token', token);
      const decoded = decodeToken(token);
      set({ token, user: decoded, isAuthenticated: true });
    } else {
      localStorage.removeItem('admin_token');
      deleteCookie('admin_token');
      set({ token: null, user: null, isAuthenticated: false });
    }
  },
  logout: () => {
    localStorage.removeItem('admin_token');
    deleteCookie('admin_token');
    set({ token: null, user: null, isAuthenticated: false });
  },
  initialize: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin_token');
      if (token && !isTokenExpired(token)) {
        const decoded = decodeToken(token);
        setCookie('admin_token', token);
        set({ token, user: decoded, isAuthenticated: true });
      } else {
        localStorage.removeItem('admin_token');
        deleteCookie('admin_token');
        set({ token: null, user: null, isAuthenticated: false });
      }
    }
  },
}));

