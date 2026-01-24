/**
 * DATEV Order Entity - Our domain representation of a DATEV order (Auftrag)
 *
 * This represents what WE need from a DATEV order,
 * independent of how Klardaten or DATEV provides it
 *
 * Note: We use the shared types from @atlas/shared package
 * which are already defined and used across the application
 */

// Re-export from shared package for domain consistency
export type {
  DatevOrder,
  DatevOrderCompletionStatus,
  DatevOrderBillingStatus,
} from '@atlas/shared';
