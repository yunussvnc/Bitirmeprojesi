/**
 * API Client Utility
 * 
 * Centralized API client with retry logic and error handling.
 * 
 * @module utils/apiClient
 */

import { API_BASE_URL } from '@/src/constants/api';
import { handleApiError, AppError } from './errorHandler';
import { logger } from './logger';

interface RequestOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
}

/**
 * Fetch with automatic retry logic
 */
async function fetchWithRetry(
  url: string,
  options: RequestOptions = {},
  retries = 3,
  retryDelay = 1000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return response;
    }

    // Retry on 5xx errors
    if (response.status >= 500 && retries > 0) {
      logger.warn(`Retrying request to ${url}, attempts left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return fetchWithRetry(url, options, retries - 1, retryDelay * 2);
    }

    // Don't retry on 4xx errors
    throw new Error(`API error: ${response.status}`);
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Retry on network errors
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

/**
 * API client with standardized error handling
 */
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

/**
 * GET request helper
 */
export async function apiGet<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request helper
 */
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
