/**
 * DATEV Sync Service
 *
 * Orchestrates the synchronization of DATEV data (clients and orders)
 * into Supabase with vector embeddings for RAG.
 *
 * Flow:
 * 1. Authenticate with DATEV via adapter
 * 2. Fetch clients and orders
 * 3. Generate embeddings for each record
 * 4. Upsert to Supabase tables
 */

import { IDATEVAdapter } from "@/lib/adapters/datev.adapter";
import { getDATEVAdapter } from "@/lib/adapters/datev.factory";
import { generateEmbedding } from "@/lib/infrastructure/embeddings";
import { createSupabaseAdminClient } from "@/lib/infrastructure/supabase.server";
import {
  DatevClient,
  DatevOrder,
  DatevSyncResult,
  DatevClientForRAG,
  DatevOrderForRAG,
} from "@/types/datev";

/**
 * Generate embedding text for a client
 * Combines relevant fields for semantic search
 */
function generateClientEmbeddingText(client: DatevClient): string {
  const parts: string[] = [];

  // Client name is primary
  parts.push(`Mandant: ${client.client_name}`);

  // Add company form if available
  if (client.company_form) {
    parts.push(`(${client.company_form})`);
  }

  // Add client type description
  const typeDescriptions: Record<number, string> = {
    1: "Natürliche Person",
    2: "Einzelunternehmen",
    3: "Juristische Person",
  };
  parts.push(`- ${typeDescriptions[client.client_type] || "Unbekannt"}`);

  // Add industry if available
  if (client.industry_description) {
    parts.push(`- Branche: ${client.industry_description}`);
  }

  // Add location if available
  if (client.correspondence_city) {
    parts.push(`- Standort: ${client.correspondence_city}`);
  }

  // Add alternate name if different
  if (client.differing_name && client.differing_name !== client.client_name) {
    parts.push(`- Auch bekannt als: ${client.differing_name}`);
  }

  return parts.join(" ");
}

/**
 * Generate embedding text for an order
 * Includes denormalized client name for semantic association
 */
function generateOrderEmbeddingText(
  order: DatevOrder,
  clientName: string
): string {
  const parts: string[] = [];

  // Order name and type
  parts.push(`Auftrag: ${order.order_name}`);
  parts.push(`für Mandant ${clientName}`);

  // Year information
  parts.push(`- Jahr ${order.creation_year}`);
  if (order.assessment_year && order.assessment_year !== order.creation_year) {
    parts.push(`(Veranlagungsjahr ${order.assessment_year})`);
  }

  // Order type
  parts.push(`- Auftragsart: ${order.ordertype}`);
  if (order.ordertype_group) {
    parts.push(`(${order.ordertype_group})`);
  }

  // Status information
  parts.push(`- Status: ${order.completion_status}`);
  parts.push(`- Abrechnung: ${order.billing_status}`);

  return parts.join(" ");
}

/**
 * DATEV Sync Service class
 */
export class DatevSyncService {
  private adapter: IDATEVAdapter;

  constructor(adapter?: IDATEVAdapter) {
    this.adapter = adapter || getDATEVAdapter();
  }

  /**
   * Sync clients from DATEV to Supabase
   */
  private async syncClients(
    clients: DatevClient[]
  ): Promise<{ synced: number; errors: number }> {
    const supabase = createSupabaseAdminClient();
    let synced = 0;
    let errors = 0;

    console.log(`📊 Syncing ${clients.length} clients to Supabase...`);

    for (const client of clients) {
      try {
        // Generate embedding text
        const embeddingText = generateClientEmbeddingText(client);

        // Generate embedding vector
        const embedding = await generateEmbedding(embeddingText);

        // Prepare record for upsert
        const record: DatevClientForRAG = {
          ...client,
          embedding_text: embeddingText,
        };

        // Upsert to Supabase
        const { error } = await supabase.from("datev_clients").upsert(
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
            embedding_text: record.embedding_text,
            embedding: embedding as unknown as string, // Supabase expects string for vector
            synced_at: new Date().toISOString(),
          },
          {
            onConflict: "client_id",
          }
        );

        if (error) {
          console.error(`Error syncing client ${client.client_name}:`, error);
          errors++;
        } else {
          synced++;
        }
      } catch (err) {
        console.error(`Error processing client ${client.client_name}:`, err);
        errors++;
      }
    }

    console.log(`✅ Synced ${synced} clients (${errors} errors)`);
    return { synced, errors };
  }

  /**
   * Sync orders from DATEV to Supabase
   * Requires client map for denormalization
   */
  private async syncOrders(
    orders: DatevOrder[],
    clientMap: Map<string, string>
  ): Promise<{ synced: number; errors: number }> {
    const supabase = createSupabaseAdminClient();
    let synced = 0;
    let errors = 0;

    console.log(`📊 Syncing ${orders.length} orders to Supabase...`);

    for (const order of orders) {
      try {
        // Get client name for denormalization
        const clientName =
          clientMap.get(order.client_id) ?? "Unbekannter Mandant";

        // Generate embedding text with client name
        const embeddingText = generateOrderEmbeddingText(order, clientName);

        // Generate embedding vector
        const embedding = await generateEmbedding(embeddingText);

        // Prepare record for upsert
        const record: DatevOrderForRAG = {
          ...order,
          client_name: clientName,
          embedding_text: embeddingText,
        };

        // Upsert to Supabase
        const { error } = await supabase.from("datev_orders").upsert(
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
            client_name: record.client_name,
            completion_status: order.completion_status,
            billing_status: order.billing_status,
            date_completion_status: order.date_completion_status || null,
            date_billing_status: order.date_billing_status || null,
            embedding_text: record.embedding_text,
            embedding: embedding as unknown as string,
            synced_at: new Date().toISOString(),
          },
          {
            onConflict: "creation_year,order_number",
          }
        );

        if (error) {
          console.error(`Error syncing order ${order.order_name}:`, error);
          errors++;
        } else {
          synced++;
        }
      } catch (err) {
        console.error(`Error processing order ${order.order_name}:`, err);
        errors++;
      }
    }

    console.log(`✅ Synced ${synced} orders (${errors} errors)`);
    return { synced, errors };
  }

  /**
   * Run full sync: clients + orders for specified year
   */
  async sync(orderYear: number = 2025): Promise<DatevSyncResult> {
    const startTime = Date.now();
    console.log(`🚀 Starting DATEV sync (orders for year ${orderYear})...`);
    console.log(`📡 Using adapter: ${this.adapter.getAdapterName()}`);

    try {
      // Step 1: Authenticate
      await this.adapter.authenticate();

      // Step 2: Fetch clients
      const clients = await this.adapter.getClients();

      // Step 3: Fetch orders for specified year
      const orders = []; // TODO add this once the API is working: await this.adapter.getOrders(orderYear);

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
      console.log(`✅ DATEV sync completed in ${duration}ms`);

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
      console.error("❌ DATEV sync failed:", error);

      return {
        success: false,
        clients: { fetched: 0, synced: 0, errors: 0 },
        orders: { fetched: 0, synced: 0, errors: 0 },
        duration_ms: duration,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// ============================================
// Singleton and Factory
// ============================================

let syncServiceInstance: DatevSyncService | null = null;

/**
 * Get the singleton sync service instance
 */
export function getDatevSyncService(): DatevSyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new DatevSyncService();
  }
  return syncServiceInstance;
}
