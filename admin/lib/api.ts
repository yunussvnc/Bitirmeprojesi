// lib/api.ts

import axios, { AxiosError } from 'axios';

export const api = axios.create({
  baseURL: '/api/backend',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let unauthorizedRedirectStarted = false;

const handleUnauthorizedInterceptor = async (error: AxiosError) => {
  if (error.response?.status === 401 && typeof window !== 'undefined' && !unauthorizedRedirectStarted) {
    unauthorizedRedirectStarted = true;
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } finally {
      const redirect = `${window.location.pathname}${window.location.search}`;
      if (!window.location.pathname.startsWith('/login')) {
        window.location.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
      } else {
        unauthorizedRedirectStarted = false;
      }
    }
  }
  return Promise.reject(error);
};

api.interceptors.response.use((response) => response, handleUnauthorizedInterceptor);
