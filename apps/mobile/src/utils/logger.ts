/**
 * Logger Utility
 * 
 * Centralized logging for production apps.
 * Only logs in development mode.
 * 
 * @module utils/logger
 */

const isDev = __DEV__;

export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors, but could send to error tracking service
    if (isDev) {
      console.error(...args);
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
