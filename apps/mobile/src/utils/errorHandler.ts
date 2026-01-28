/**
 * Error Handler Utility
 * 
 * Centralized error handling and user-friendly error messages.
 * 
 * @module utils/errorHandler
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
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
  // Network errors
  if (error instanceof TypeError && error.message.includes('Network request failed')) {
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

  // HTTP errors
  if (error instanceof Error && error.message.includes('API error:')) {
    const match = error.message.match(/API error: (\d+)/);
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
    
    if (status >= 500) {
      return new AppError(
        'Server error',
        'SERVER_ERROR',
        'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.',
        true
      );
    }
    
    return new AppError(
      error.message,
      'API_ERROR',
      'Bir hata oluştu. Lütfen tekrar deneyin.',
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
