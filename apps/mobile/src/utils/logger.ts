/**
 * Logger Utility
 * 
 * Centralized logging for production apps.
 * Only logs in development mode.
 * 
 * @module utils/logger
 */

const isDev = __DEV__;

function isExpectedApiIssue(args: any[]): boolean {
  return args.some((arg) => {
    if (!arg) return false;
    if (typeof arg === 'string') {
      return (
        arg.includes('API error: 400') ||
        arg.includes('API error: 401') ||
        arg.includes('API error: 403') ||
        arg.includes('API error: 404') ||
        arg.includes('API error: 500') ||
        arg.includes('Server error') ||
        arg.includes('AI API 4') ||
        arg.includes('AI API 5') ||
        arg.includes('Unauthorized') ||
        arg.includes('Network request failed') ||
        arg.includes('Failed to fetch') ||
        arg.includes('timeout')
      );
    }
    if (typeof arg === 'object') {
      const code = String(arg.code || '');
      const message = String(arg.message || '');
      return (
        ['NOT_FOUND', 'UNAUTHORIZED', 'NETWORK_ERROR', 'TIMEOUT', 'API_ERROR', 'SERVER_ERROR', 'PARSE_ERROR'].includes(code) ||
        message === 'Not found' ||
        message === 'Unauthorized' ||
        message.includes('API error: 4') ||
        message.includes('API error: 5') ||
        message.includes('Network request failed') ||
        message.includes('Failed to fetch')
      );
    }
    return false;
  });
}

export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    if (isDev) {
      if (isExpectedApiIssue(args)) {
        console.warn(...args);
      } else {
        console.error(...args);
      }
    }
    // TODO: In production, send to error tracking (Sentry, etc.)
  },
  
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args);
    }
  },
};
