import { Injectable, Logger } from '@nestjs/common';
import { DatevClient, DatevOrder } from '@atlas/shared';
import { IDatevAdapter } from '@datev/domain/datev-adapter.interface';
import { KlardatenClient } from '@datev/infrastructure/klardaten.client';

/**
 * Klardaten DATEV Adapter - Infrastructure implementation for DATEV data access
 * Implements IDatevAdapter interface using Klardaten Gateway
 */
@Injectable()
export class KlardatenDatevAdapter implements IDatevAdapter {
  private readonly logger = new Logger(KlardatenDatevAdapter.name);

  constructor(private readonly klardatenClient: KlardatenClient) {}

  /**
   * Get the name of this adapter implementation
   */
  getAdapterName(): string {
    return 'KlardatenDatevAdapter';
  }

  /**
   * Check if the adapter is currently authenticated
   */
  isAuthenticated(): boolean {
    return this.klardatenClient.isAuthenticated();
  }

  /**
   * Authenticate with the DATEV system via Klardaten
   */
  async authenticate(): Promise<void> {
    await this.klardatenClient.authenticate();
  }

  /**
   * Fetch all clients (Mandanten) from DATEV
   */
  async getClients(): Promise<DatevClient[]> {
    return await this.klardatenClient.getClients();
  }

  /**
   * Fetch orders (Aufträge) for a specific year
   * Phase 1.1: Not implemented - orders postponed to Phase 1.2/2
   */
  async getOrders(year: number): Promise<DatevOrder[]> {
    this.logger.warn('getOrders not implemented in Phase 1.1 - orders postponed to Phase 1.2');
    return [];
  }
}
