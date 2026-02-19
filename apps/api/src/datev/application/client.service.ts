import { Injectable, Logger } from '@nestjs/common';
import { DatevClient } from '@atlas/shared';
import { ClientRepository } from '@datev/domain/client.repository';

/**
 * Client Service - Application layer for client operations
 * Contains business logic for client data management
 */
@Injectable()
export class ClientService {
  private readonly logger = new Logger(ClientService.name);

  constructor(private readonly clientRepository: ClientRepository) {}

  /**
   * List all active clients
   * Returns simplified client data for dropdown
   */
  async listClients(): Promise<
    Array<{
      clientId: string;
      clientNumber: number;
      clientName: string;
      companyForm: string | null;
    }>
  > {
    const clients = await this.clientRepository.findAllActive();

    return clients.map((client) => ({
      clientId: client.client_id,
      clientNumber: client.client_number,
      clientName: client.client_name,
      companyForm: client.company_form ?? null,
    }));
  }

  /**
   * Get full client details by ID
   */
  async getClientById(clientId: string): Promise<DatevClient | null> {
    return await this.clientRepository.findById(clientId);
  }

  /**
   * Search clients by name (for autocomplete)
   */
  async searchClientsByName(query: string): Promise<DatevClient[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }
    return await this.clientRepository.findByName(query.trim());
  }
}
