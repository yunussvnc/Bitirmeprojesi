// lib/api.ts

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://asemos-backend.onrender.com';
const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_URL || 'https://asemos-ai.onrender.com';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const aiApi = axios.create({
  baseURL: AI_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to attach authorization header
const attachTokenInterceptor = (config: any) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
};

api.interceptors.request.use(attachTokenInterceptor);
aiApi.interceptors.request.use(attachTokenInterceptor);

// Helper to handle unauthorized responses
const handleUnauthorizedInterceptor = (error: any) => {
  if (error.response?.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      // Redirect to login page if we are in dashboard
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }
  }
  return Promise.reject(error);
};

api.interceptors.response.use((res) => res, handleUnauthorizedInterceptor);
aiApi.interceptors.response.use((res) => res, handleUnauthorizedInterceptor);
