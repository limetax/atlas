/**
 * DATEV Client Entity - Our domain representation of a DATEV client (Mandant)
 *
 * This represents what WE need from a DATEV client,
 * independent of how Klardaten or DATEV provides it
 *
 * Note: We use the shared types from @atlas/shared package
 * which are already defined and used across the application
 */

// Re-export from shared package for domain consistency
export type { DatevClient, DatevClientType, DatevClientStatus } from '@atlas/shared';
