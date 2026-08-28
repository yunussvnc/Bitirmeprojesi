import axios from 'axios';

interface ApiErrorBody {
  detail?: string;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<ApiErrorBody>(error)) return fallback;
  const detail = error.response?.data?.detail;
  return typeof detail === 'string' && detail.trim() ? detail : fallback;
}
