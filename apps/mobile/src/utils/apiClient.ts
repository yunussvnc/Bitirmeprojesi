import { API_BASE_URL } from '@/src/constants/api';
import { handleApiError } from './errorHandler';
import { logger } from './logger';

interface RequestOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  skipAuth?: boolean;
}

let _getAccessToken: (() => string | null) | null = null;
let _onUnauthorized: (() => void) | null = null;

export function setAuthInterceptors(
  getToken: () => string | null,
  onUnauthorized: () => void,
) {
  _getAccessToken = getToken;
  _onUnauthorized = onUnauthorized;
}

async function fetchWithRetry(
  url: string,
  options: RequestOptions = {},
  retries = 3,
  retryDelay = 1000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const token = options.skipAuth ? null : _getAccessToken?.();
    const authHeaders: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) return response;

    if (response.status === 401 && !options.skipAuth) {
      _onUnauthorized?.();
      throw new Error('Unauthorized');
    }

    if (response.status >= 500 && retries > 0) {
      logger.warn(`Retrying request to ${url}, attempts left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return fetchWithRetry(url, options, retries - 1, retryDelay * 2);
    }

    const body = await response.text();
    let detail = `API error: ${response.status}`;
    try {
      const json = JSON.parse(body);
      if (json.detail) detail = json.detail;
    } catch {}
    throw new Error(detail);
  } catch (error) {
    clearTimeout(timeoutId);

    if (
      (error instanceof TypeError || error instanceof Error) &&
      (error.message.includes('Network request failed') || error.name === 'AbortError') &&
      retries > 0
    ) {
      logger.warn(`Retrying request to ${url}, attempts left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return fetchWithRetry(url, options, retries - 1, retryDelay * 2);
    }

    throw error;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetchWithRetry(url, options);
    const data = await response.json();
    return data as T;
  } catch (error) {
    const appError = handleApiError(error);
    throw appError;
  }
}

export async function apiGet<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: 'GET' });
}

export async function apiPost<T>(
  endpoint: string,
  body?: any,
  options?: RequestOptions
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiPut<T>(
  endpoint: string,
  body?: any,
  options?: RequestOptions
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}
