import { Injectable, Logger } from '@nestjs/common';
import { DatevClient, DatevOrder, DatevSyncResult } from '@atlas/shared';
import { IDatevAdapter } from '@datev/domain/datev-adapter.interface';
import { IEmbeddingsProvider } from '@llm/domain/embeddings-provider.interface';
import { SupabaseService } from '@shared/infrastructure/supabase.service';

/**
 * DATEV Sync Service - Application layer for DATEV data synchronization
 *
 * Orchestrates the synchronization of DATEV data (clients and orders)
 * into Supabase with vector embeddings for RAG.
 *
 * Flow:
 * 1. Authenticate with DATEV via adapter
 * 2. Fetch clients and orders
 * 3. Generate embeddings for each record
 * 4. Upsert to Supabase tables
 *
 * Depends on domain interfaces, not concrete implementations
 */
@Injectable()
export class DatevSyncService {
  private readonly logger = new Logger(DatevSyncService.name);

  constructor(
    private readonly datevAdapter: IDatevAdapter,
    private readonly embeddingsProvider: IEmbeddingsProvider,
    private readonly supabase: SupabaseService
  ) {}

  /**
   * Run full sync: clients + orders for specified year
   */
  async sync(orderYear: number = 2025): Promise<DatevSyncResult> {
    const startTime = Date.now();
    this.logger.log(`🚀 Starting DATEV sync (orders for year ${orderYear})...`);
    this.logger.log(`📡 Using adapter: ${this.datevAdapter.getAdapterName()}`);

    try {
      // Step 1: Authenticate
      await this.datevAdapter.authenticate();

      // Step 2: Fetch clients
      const clients = await this.datevAdapter.getClients();

      // Step 3: Fetch orders for specified year
      const orders: DatevOrder[] = []; // TODO: Enable once API is working: await this.datevAdapter.getOrders(orderYear);

      // Step 4: Build client map for denormalization
      const clientMap = new Map<string, string>();
      for (const client of clients) {
        clientMap.set(client.client_id, client.client_name);
      }

      // Step 5: Sync clients to Supabase
      const clientResult = await this.syncClients(clients);

      // Step 6: Sync orders to Supabase
      const orderResult = await this.syncOrders(orders, clientMap);

      const duration = Date.now() - startTime;
      this.logger.log(`✅ DATEV sync completed in ${duration}ms`);

      return {
        success: true,
        clients: {
          fetched: clients.length,
          synced: clientResult.synced,
          errors: clientResult.errors,
        },
        orders: {
          fetched: orders.length,
          synced: orderResult.synced,
          errors: orderResult.errors,
        },
        duration_ms: duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('❌ DATEV sync failed:', error);

      return {
        success: false,
        clients: { fetched: 0, synced: 0, errors: 0 },
        orders: { fetched: 0, synced: 0, errors: 0 },
        duration_ms: duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sync clients from DATEV to Supabase
   */
  private async syncClients(clients: DatevClient[]): Promise<{ synced: number; errors: number }> {
    let synced = 0;
    let errors = 0;

    this.logger.log(`📊 Syncing ${clients.length} clients to Supabase...`);

    for (const client of clients) {
      try {
        // Generate embedding text
        const embeddingText = this.generateClientEmbeddingText(client);

        // Generate embedding vector
        const embedding = await this.embeddingsProvider.generateEmbedding(embeddingText);

        // Upsert to Supabase
        const { error } = await this.supabase.db.from('datev_clients').upsert(
          {
            client_id: client.client_id,
            client_number: client.client_number,
            client_name: client.client_name,
            differing_name: client.differing_name || null,
            client_type: client.client_type,
            client_status: client.client_status,
            company_form: client.company_form || null,
            industry_description: client.industry_description || null,
            main_email: client.main_email || null,
            main_phone: client.main_phone || null,
            correspondence_street: client.correspondence_street || null,
            correspondence_city: client.correspondence_city || null,
            correspondence_zip_code: client.correspondence_zip_code || null,
            tax_number_vat: client.tax_number_vat || null,
            embedding_text: embeddingText,
            embedding: embedding,
            synced_at: new Date().toISOString(),
          },
          {
            onConflict: 'client_id',
          }
        );

        if (error) {
          this.logger.error(`Error syncing client ${client.client_name}:`, error);
          errors++;
        } else {
          synced++;
        }
      } catch (err) {
        this.logger.error(`Error processing client ${client.client_name}:`, err);
        errors++;
      }
    }

    this.logger.log(`✅ Synced ${synced} clients (${errors} errors)`);
    return { synced, errors };
  }

  /**
   * Sync orders from DATEV to Supabase
   */
  private async syncOrders(
    orders: DatevOrder[],
    clientMap: Map<string, string>
  ): Promise<{ synced: number; errors: number }> {
    let synced = 0;
    let errors = 0;

    this.logger.log(`📊 Syncing ${orders.length} orders to Supabase...`);

    for (const order of orders) {
      try {
        // Get client name for denormalization
        const clientName = clientMap.get(order.client_id) ?? 'Unbekannter Mandant';

        // Generate embedding text with client name
        const embeddingText = this.generateOrderEmbeddingText(order, clientName);

        // Generate embedding vector
        const embedding = await this.embeddingsProvider.generateEmbedding(embeddingText);

        // Upsert to Supabase
        const { error } = await this.supabase.db.from('datev_orders').upsert(
          {
            order_id: order.order_id,
            creation_year: order.creation_year,
            order_number: order.order_number,
            order_name: order.order_name,
            ordertype: order.ordertype,
            ordertype_group: order.ordertype_group || null,
            assessment_year: order.assessment_year || null,
            fiscal_year: order.fiscal_year || null,
            client_id: order.client_id,
            client_name: clientName,
            completion_status: order.completion_status,
            billing_status: order.billing_status,
            date_completion_status: order.date_completion_status || null,
            date_billing_status: order.date_billing_status || null,
            embedding_text: embeddingText,
            embedding: embedding,
            synced_at: new Date().toISOString(),
          },
          {
            onConflict: 'creation_year,order_number',
          }
        );

        if (error) {
          this.logger.error(`Error syncing order ${order.order_name}:`, error);
          errors++;
        } else {
          synced++;
        }
      } catch (err) {
        this.logger.error(`Error processing order ${order.order_name}:`, err);
        errors++;
      }
    }

    this.logger.log(`✅ Synced ${synced} orders (${errors} errors)`);
    return { synced, errors };
  }

  /**
   * Generate embedding text for a client
   */
  private generateClientEmbeddingText(client: DatevClient): string {
    const parts: string[] = [];

    parts.push(`Mandant: ${client.client_name}`);

    if (client.company_form) {
      parts.push(`(${client.company_form})`);
    }

    const typeDescriptions: Record<number, string> = {
      1: 'Natürliche Person',
      2: 'Einzelunternehmen',
      3: 'Juristische Person',
    };
    parts.push(`- ${typeDescriptions[client.client_type] || 'Unbekannt'}`);

    if (client.industry_description) {
      parts.push(`- Branche: ${client.industry_description}`);
    }

    if (client.correspondence_city) {
      parts.push(`- Standort: ${client.correspondence_city}`);
    }

    if (client.differing_name && client.differing_name !== client.client_name) {
      parts.push(`- Auch bekannt als: ${client.differing_name}`);
    }

    return parts.join(' ');
  }

  /**
   * Generate embedding text for an order
   */
  private generateOrderEmbeddingText(order: DatevOrder, clientName: string): string {
    const parts: string[] = [];

    parts.push(`Auftrag: ${order.order_name}`);
    parts.push(`für Mandant ${clientName}`);
    parts.push(`- Jahr ${order.creation_year}`);

    if (order.assessment_year && order.assessment_year !== order.creation_year) {
      parts.push(`(Veranlagungsjahr ${order.assessment_year})`);
    }

    parts.push(`- Auftragsart: ${order.ordertype}`);
    if (order.ordertype_group) {
      parts.push(`(${order.ordertype_group})`);
    }

    parts.push(`- Status: ${order.completion_status}`);
    parts.push(`- Abrechnung: ${order.billing_status}`);

    return parts.join(' ');
  }
}
