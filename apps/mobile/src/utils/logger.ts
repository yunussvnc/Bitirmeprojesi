/**
 * Logger Utility
 * 
 * Centralized logging for production apps.
 * Development: console output
 * Production: Sentry integration for errors and warnings
 * 
 * @module utils/logger
 */

import { captureException, captureMessage } from "@/src/services/sentryService";

const isDev = __DEV__;

export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    if (isDev) {
      console.error(...args);
    }
    // Production'da Sentry'ye gönder
    const error = args[0];
    if (error instanceof Error) {
      captureException(error, { extra_args: args.slice(1) });
    } else {
      captureException(new Error(String(error)), { extra_args: args.slice(1) });
    }
  },
  
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
    // Production'da önemli uyarıları Sentry'ye gönder
    if (!isDev) {
      captureMessage(String(args[0]), "warning");
    }
  },
  
  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args);
    }
  },
};
