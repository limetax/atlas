import { DatevClient } from '@atlas/shared';
import { ClientRepository } from '@datev/domain/client.repository';
import { Injectable, Logger } from '@nestjs/common';

const SANDBOX_CLIENT_NUMBERS = [45000, 45001] as const;

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
  async listClients(sandboxMode = false): Promise<
    Array<{
      clientId: string;
      clientNumber: number;
      clientName: string;
      companyForm: string | null;
      mainEmail: string | null;
      correspondenceCity: string | null;
    }>
  > {
    const all = await this.clientRepository.findAllActive();
    const clients = sandboxMode
      ? all.filter((c) =>
          SANDBOX_CLIENT_NUMBERS.includes(
            c.client_number as (typeof SANDBOX_CLIENT_NUMBERS)[number]
          )
        )
      : all;

    return clients.map((client) => ({
      clientId: client.client_id,
      clientNumber: client.client_number,
      clientName: client.client_name,
      companyForm: client.company_form ?? null,
      mainEmail: client.main_email ?? null,
      correspondenceCity: client.correspondence_city ?? null,
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
