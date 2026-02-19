import { DatevClient } from '@atlas/shared';

/**
 * Client Repository - Domain contract for client data access
 *
 * Abstract class (not interface) so it can be used directly as injection token.
 * No I-prefix following modern TypeScript conventions.
 */
export abstract class ClientRepository {
  /**
   * Find all active clients
   * @returns Array of active client records
   */
  abstract findAllActive(): Promise<DatevClient[]>;

  /**
   * Find client by client_id
   * @param clientId - The UUID client identifier
   * @returns Client record or null if not found
   */
  abstract findById(clientId: string): Promise<DatevClient | null>;

  /**
   * Find client by client_name (case-insensitive partial match)
   * @param clientName - Partial client name to search for
   * @returns Array of matching clients
   */
  abstract findByName(clientName: string): Promise<DatevClient[]>;
}
