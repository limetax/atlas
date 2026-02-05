import { logger } from './logger';

/**
 * Initialize global error handlers for unhandled errors and promise rejections
 * Call this once in main.tsx during app initialization
 */
export const initGlobalErrorHandlers = (): void => {
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
  });

  // Global errors
  window.addEventListener('error', (event) => {
    logger.error('Global error:', event.error);
  });
};
