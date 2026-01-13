/**
 * DATEV Adapter Interface
 *
 * Abstraction layer for DATEV data access. This interface allows
 * swapping implementations (e.g., Klardaten, direct DATEVconnect, mock).
 *
 * Current implementation: KlardatenAdapter (lib/infrastructure/klardaten.client.ts)
 */

import { DatevClient, DatevOrder } from "@/types/datev";

/**
 * Interface for DATEV data adapters
 *
 * Implementations must handle:
 * - Authentication with the DATEV system
 * - Fetching client (Mandanten) data
 * - Fetching order (Aufträge) data with year filtering
 */
export interface IDATEVAdapter {
  /**
   * Authenticate with the DATEV system
   * Must be called before fetching data
   * @throws Error if authentication fails
   */
  authenticate(): Promise<void>;

  /**
   * Check if the adapter is currently authenticated
   */
  isAuthenticated(): boolean;

  /**
   * Fetch all clients (Mandanten) from DATEV
   * @returns Array of client records
   * @throws Error if not authenticated or fetch fails
   */
  getClients(): Promise<DatevClient[]>;

  /**
   * Fetch orders (Aufträge) for a specific year
   * @param year - The creation year to filter by (e.g., 2025)
   * @returns Array of order records
   * @throws Error if not authenticated or fetch fails
   */
  getOrders(year: number): Promise<DatevOrder[]>;

  /**
   * Get the name of this adapter implementation
   * Useful for logging and debugging
   */
  getAdapterName(): string;
}

/**
 * Factory function type for creating DATEV adapters
 */
export type DATEVAdapterFactory = () => IDATEVAdapter;

// Re-export types for convenience
export type { DatevClient, DatevOrder } from "@/types/datev";
