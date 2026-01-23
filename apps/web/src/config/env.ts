/**
 * Environment Configuration
 * Centralized access to environment variables
 */

export const env = {
    // API Configuration
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',

    // Environment flags
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
    mode: import.meta.env.MODE,
} as const;

// Type-safe environment variable access
export type Env = typeof env;
