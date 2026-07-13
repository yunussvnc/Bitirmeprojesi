import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import { API_V1 } from '@/src/constants/api';
import { handleApiError } from './errorHandler';
import { logger } from './logger';

const APP_VERSION = Application.nativeApplicationVersion ?? 'unknown';
const BUILD_NUMBER = Application.nativeBuildVersion ?? 'unknown';
const APP_PLATFORM = Platform.OS;
const USER_AGENT = `Asemos/${APP_VERSION} (${Platform.OS === 'ios' ? 'iOS' : 'Android'}; Build ${BUILD_NUMBER})`;

function generateRequestId(): string {
  // Gerçek UUID (RFC 4122) — mimari dokümanı uçtan uca korelasyon için UUID
  // bekliyor, expo-crypto zaten bir bağımlılık (yeni paket eklenmedi).
  return Crypto.randomUUID();
}

function getCorrelationHeaders(): Record<string, string> {
  return {
    'X-Request-ID': generateRequestId(),
    'X-App-Version': APP_VERSION,
    'X-Build-Number': BUILD_NUMBER,
    'X-App-Platform': APP_PLATFORM,
    'User-Agent': USER_AGENT,
  };
}

interface RequestOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  skipAuth?: boolean;
  /** Varsayılan 10000 ms; AI/öneri gibi yavaş endpoint'ler için artırın */
  timeoutMs?: number;
}

let _getAccessToken: (() => string | null) | null = null;
let _getRefreshToken: (() => string | null) | null = null;
let _onTokenRefresh: ((access: string, refresh: string) => void) | null = null;
let _onUnauthorized: (() => void) | null = null;

let _isRefreshing = false;
let _refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  _refreshSubscribers.forEach((cb) => cb(token));
  _refreshSubscribers = [];
}

export function setAuthInterceptors(
  getToken: () => string | null,
  getRefreshToken: () => string | null,
  onTokenRefresh: (access: string, refresh: string) => void,
  onUnauthorized: () => void,
) {
  _getAccessToken = getToken;
  _getRefreshToken = getRefreshToken;
  _onTokenRefresh = onTokenRefresh;
  _onUnauthorized = onUnauthorized;
}

async function fetchWithRetry(
  url: string,
  options: RequestOptions = {},
  retries = 3,
  retryDelay = 1000
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? 10000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let token = options.skipAuth ? null : _getAccessToken?.();
    const authHeaders: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    let response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...getCorrelationHeaders(),
        ...authHeaders,
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) return response;

    if (response.status === 401 && !options.skipAuth) {
      // Refresh token mantığı
      const refreshToken = _getRefreshToken?.();
      if (refreshToken) {
        if (!_isRefreshing) {
          _isRefreshing = true;
          try {
            const refreshUrl = `${API_V1}/auth/refresh`;
            const refreshRes = await fetch(refreshUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...getCorrelationHeaders() },
              body: JSON.stringify({ refresh_token: refreshToken })
            });

            if (refreshRes.ok) {
              const data = await refreshRes.json();
              _onTokenRefresh?.(data.access_token, data.refresh_token);
              onRefreshed(data.access_token);
              
              // Orijinal isteği yeni token ile tekrarla
              const newAuthHeaders = { Authorization: `Bearer ${data.access_token}` };
              return await fetch(url, {
                ...options,
                headers: { ...options.headers, ...newAuthHeaders }
              });
            } else {
              throw new Error("Refresh failed");
            }
          } catch (e) {
            _onUnauthorized?.();
            throw new Error('Unauthorized');
          } finally {
            _isRefreshing = false;
          }
        } else {
          // Zaten yenileniyorsa, yenilenmesini bekle ve isteği tekrarla
          return new Promise((resolve, reject) => {
            _refreshSubscribers.push((newToken) => {
              const newAuthHeaders = { Authorization: `Bearer ${newToken}` };
              fetch(url, {
                ...options,
                headers: { ...options.headers, ...newAuthHeaders }
              }).then(resolve).catch(reject);
            });
          });
        }
      } else {
        _onUnauthorized?.();
        throw new Error('Unauthorized');
      }
    }

    // POST/PUT/PATCH/DELETE işlemleri idempotent değildir — retry yapma
    const isReadOnly = !options.method || options.method === 'GET';
    if (isReadOnly && response.status >= 500 && retries > 0) {
      logger.warn(`Retrying request to ${url}, attempts left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return fetchWithRetry(url, options, retries - 1, retryDelay * 2);
    }

    const body = await response.text();
    let detail = `API error: ${response.status}`;
    try {
      const json = JSON.parse(body);
      if (json.detail) {
        let detailMsg = typeof json.detail === 'string' ? json.detail : JSON.stringify(json.detail);
        detail = `API error: ${response.status} - ${detailMsg}`;
      }
    } catch { }
    throw new Error(detail);
  } catch (error) {
    clearTimeout(timeoutId);

    const isNetworkError =
      error instanceof TypeError ||
      (error instanceof Error &&
        (error.message.includes('Network request failed') ||
          error.message.includes('Failed to fetch') ||
          error.name === 'AbortError'));
    const isReadOnly = !options.method || options.method === 'GET';
    if (isNetworkError && isReadOnly && retries > 0) {
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
  const url = endpoint.startsWith('http') ? endpoint : `${API_V1}${endpoint}`;

  try {
    const response = await fetchWithRetry(url, options);
    const text = await response.text();
    if (!text.trim()) return {} as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`Invalid JSON response from ${endpoint}`);
    }
  } catch (error) {
    throw handleApiError(error);
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

export async function apiPatch<T>(
  endpoint: string,
  body?: any,
  options?: RequestOptions
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiDelete<T = void>(endpoint: string, options?: RequestOptions): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: 'DELETE' });
}

export async function apiUploadFile<T = { url: string }>(
  endpoint: string,
  file: { uri: string; type?: string; name?: string },
  fieldName = "file"
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_V1}${endpoint}`;
  const token = _getAccessToken?.();
  const formData = new FormData();
  formData.append(fieldName, {
    uri: file.uri,
    type: file.type || "image/jpeg",
    name: file.name || "image.jpg",
  } as any);
  const headers: Record<string, string> = {
    ...getCorrelationHeaders(),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      let detail = `Upload failed: ${response.status}`;
      try {
        const json = JSON.parse(text);
        if (json.detail) detail = json.detail;
      } catch { }
      throw new Error(`API error: ${response.status} - ${detail}`);
    }
    const text = await response.text();
    if (!text.trim()) return {} as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error("Invalid JSON response from upload");
    }
  } catch (error) {
    throw handleApiError(error);
  }
}
