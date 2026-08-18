const DEFAULT_API_ORIGIN = 'https://api.asemos.tr';
const API_V1_PATH = '/api/v1';

export function buildApiBaseUrl(configuredUrl?: string): string {
  const baseUrl = (configuredUrl?.trim() || DEFAULT_API_ORIGIN).replace(/\/+$/, '');

  if (baseUrl.endsWith(API_V1_PATH)) {
    return baseUrl;
  }

  return `${baseUrl}${API_V1_PATH}`;
}

export const API_BASE_URL = buildApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
