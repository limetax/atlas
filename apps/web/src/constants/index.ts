/**
 * Application Constants
 * Central location for all magic strings, keys, and configuration values
 */

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'supabase_token',
  CHAT_SESSIONS: 'limetax-sessions',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
} as const;

export const API_ENDPOINTS = {
  CHAT_STREAM: '/api/chat/stream',
  DOCUMENTS_UPLOAD: '/api/documents/upload',
  TAX_ASSESSMENT_REVIEW: '/api/tax-assessment/review',
  TRPC: '/api/trpc',
} as const;

export const APP_CONFIG = {
  SYSTEM_PROMPT: 'System prompt placeholder',
  DATA_SOURCES: ['AO', 'UStG', 'EStG'],
  MAX_TEXTAREA_ROWS: 8,
  ROWS_PER_PAGE: 25,
} as const;
