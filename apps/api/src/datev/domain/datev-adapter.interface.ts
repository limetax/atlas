import { DatevClient, DatevOrder } from '@atlas/shared';

/**
 * DATEV Adapter - Domain contract for DATEV data providers
 *
 * Abstract class (not interface) so it can be used directly as injection token
 * This defines what we expect from any DATEV provider,
 * regardless of the underlying implementation (Klardaten, direct DATEV, mock)
 */
export abstract class IDatevAdapter {
  /**
   * Authenticate with the DATEV system
   * Must be called before fetching data
   * @throws Error if authentication fails
   */
  abstract authenticate(): Promise<void>;

  /**
   * Check if the adapter is currently authenticated
   * @returns True if authenticated, false otherwise
   */
  abstract isAuthenticated(): boolean;

  /**
   * Fetch all clients (Mandanten) from DATEV
   * @returns Array of client records
   * @throws Error if not authenticated or fetch fails
   */
  abstract getClients(): Promise<DatevClient[]>;

  /**
   * Fetch orders (Aufträge) for a specific year
   * @param year - The creation year to filter by (e.g., 2025)
   * @returns Array of order records
   * @throws Error if not authenticated or fetch fails
   */
  abstract getOrders(year: number): Promise<DatevOrder[]>;

  /**
   * Get the name of this adapter implementation
   * Useful for logging and debugging
   * @returns Adapter name
   */
  abstract getAdapterName(): string;
}
