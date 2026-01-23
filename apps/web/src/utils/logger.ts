/**
 * Logging Utilities
 * Centralized logging with environment-aware behavior
 */

import { env } from '@/config/env';

export const logger = {
  error: (message: string, ...args: unknown[]) => {
    if (env.isDev) {
      console.error(`[ERROR] ${message}`, ...args);
    }
    // TODO: Send to error reporting service in production (e.g., Sentry)
  },

  warn: (message: string, ...args: unknown[]) => {
    if (env.isDev) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  info: (message: string, ...args: unknown[]) => {
    if (env.isDev) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },

  debug: (message: string, ...args: unknown[]) => {
    if (env.isDev) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
};
