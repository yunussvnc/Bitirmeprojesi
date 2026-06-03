/**
 * Error Handler Utility
 * 
 * Centralized error handling and user-friendly error messages.
 * 
 * @module utils/errorHandler
 */

function mapApiDetailToTurkish(detail: string, status: number): string {
  const d = detail.trim();
  if (!d) {
    if (status === 400) return 'Geçersiz istek. Lütfen bilgilerinizi kontrol edin.';
    return 'Bir hata oluştu. Lütfen tekrar deneyin.';
  }
  const lower = d.toLowerCase();
  if (lower.includes('zaten kayıtlı') || lower.includes('already registered')) {
    return 'Bu e-posta zaten kayıtlı';
  }
  if (
    status === 401 &&
    (lower.includes('e-posta veya şifre') ||
      lower.includes('şifre') ||
      lower.includes('password') ||
      lower.includes('credentials'))
  ) {
    return 'Şifre hatalı girdiniz';
  }
  if (lower.includes('mevcut şifreniz hatalı')) {
    return 'Şifre hatalı girdiniz';
  }
  if (/[ğüşıöçĞÜŞİÖÇ]/.test(d)) {
    return d;
  }
  return 'Bir hata oluştu. Lütfen tekrar deneyin.';
}

export class AppError extends Error {
  public code: string;
  public userMessage: string;
  public retryable: boolean;

  constructor(
    message: string,
    code: string,
    userMessage: string,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage;
    this.retryable = retryable;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }

    // Set the prototype explicitly (required for TypeScript/Babel)
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export interface ErrorResponse {
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
}

/**
 * Convert various error types to user-friendly AppError
 */
export function handleApiError(error: unknown): AppError {
  const msg = error instanceof Error ? error.message : String(error);
  // Network errors (fetch throws TypeError or "Failed to fetch")
  if (
    (error instanceof TypeError && msg.includes('Network request failed')) ||
    msg.includes('Failed to fetch') ||
    msg.includes('Network request failed')
  ) {
    return new AppError(
      'Network request failed',
      'NETWORK_ERROR',
      'İnternet bağlantınızı kontrol edin ve tekrar deneyin.',
      true
    );
  }

  // Timeout errors
  if (error instanceof Error && error.name === 'AbortError') {
    return new AppError(
      'Request timeout',
      'TIMEOUT',
      'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.',
      true
    );
  }

  // Invalid JSON / parse errors
  if (msg.includes('Invalid JSON response')) {
    return new AppError(
      'Invalid response',
      'PARSE_ERROR',
      'Sunucudan geçersiz yanıt alındı. Lütfen tekrar deneyin.',
      true
    );
  }

  // HTTP errors
  if (msg.includes('API error:')) {
    const match = msg.match(/API error: (\d+)/);
    const status = match ? parseInt(match[1]) : 500;

    if (status === 401) {
      return new AppError(
        'Unauthorized',
        'UNAUTHORIZED',
        'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.',
        false
      );
    }

    if (status === 404) {
      return new AppError(
        'Not found',
        'NOT_FOUND',
        'İstenen kayıt bulunamadı.',
        false
      );
    }

    const rawDetail = msg.includes(' - ') ? msg.split(' - ').slice(1).join(' - ') : '';

    if (status >= 500) {
      const serverMsg = mapApiDetailToTurkish(rawDetail, status);
      return new AppError(
        msg,
        'SERVER_ERROR',
        serverMsg.includes('Bir hata oluştu')
          ? 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.'
          : serverMsg,
        true
      );
    }
    const userMessage = mapApiDetailToTurkish(rawDetail, status);

    return new AppError(
      msg,
      'API_ERROR',
      userMessage,
      true
    );
  }

  // Generic error
  if (error instanceof Error) {
    return new AppError(
      error.message,
      'UNKNOWN_ERROR',
      'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
      true
    );
  }

  // Fallback
  return new AppError(
    'Unknown error',
    'UNKNOWN_ERROR',
    'Bir hata oluştu. Lütfen tekrar deneyin.',
    true
  );
}

/**
 * Format error for display
 */
export function formatError(error: AppError): ErrorResponse {
  return {
    code: error.code,
    message: error.message,
    userMessage: error.userMessage,
    retryable: error.retryable,
  };
}
