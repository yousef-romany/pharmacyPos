/**
 * Simple logger utility to wrap console logging
 * This allows us to easily disable logs in production or send them to a logging service
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = {
  error: (message: string, error?: any) => {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, error || '');
    }
    // In production, you could send to a logging service like Sentry
    // Example: Sentry.captureException(error);
  },

  warn: (message: string, data?: any) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, data || '');
    }
  },

  info: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, data || '');
    }
  },

  debug: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, data || '');
    }
  },
};