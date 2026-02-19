import { Injectable, Logger } from '@nestjs/common';
import { DatevClient } from '@atlas/shared';
import { IClientRepository } from '@datev/domain/client.repository';
import { SupabaseService } from '@shared/infrastructure/supabase.service';

/**
 * Supabase Client Repository - Infrastructure implementation
 * Implements client data access using Supabase PostgreSQL
 */
@Injectable()
export class SupabaseClientRepository implements IClientRepository {
  private readonly logger = new Logger(SupabaseClientRepository.name);

  constructor(private readonly supabase: SupabaseService) {}

  async findAllActive(): Promise<DatevClient[]> {
    const { data, error } = await this.supabase.db
      .from('datev_clients')
      .select(
        'client_id, client_number, client_name, client_status, company_form, main_email, correspondence_city'
      )
      .eq('client_status', '1')
      .order('client_name', { ascending: true });

    if (error) {
      this.logger.error('Failed to fetch active clients:', error);
      throw new Error(`Failed to fetch active clients: ${error.message}`);
    }

    return (data as DatevClient[]) ?? [];
  }

  async findById(clientId: string): Promise<DatevClient | null> {
    const { data, error } = await this.supabase.db
      .from('datev_clients')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      this.logger.error(`Failed to fetch client ${clientId}:`, error);
      throw new Error(`Failed to fetch client: ${error.message}`);
    }

    return data as DatevClient;
  }

  async findByName(clientName: string): Promise<DatevClient[]> {
    const { data, error } = await this.supabase.db
      .from('datev_clients')
      .select('client_id, client_number, client_name, client_status')
      .eq('client_status', '1')
      .ilike('client_name', `%${clientName}%`)
      .order('client_name', { ascending: true });

    if (error) {
      this.logger.error('Failed to search clients by name:', error);
      throw new Error(`Failed to search clients: ${error.message}`);
    }

    return (data as DatevClient[]) ?? [];
  }
}
