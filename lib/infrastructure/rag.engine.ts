import { TaxDocument, Citation } from "@/types";
import { TaxDocumentMatch } from "@/types/database";
import { DatevClientMatch, DatevOrderMatch } from "@/types/datev";
import { generateEmbedding } from "@/lib/infrastructure/embeddings";
import { createSupabaseAdminClient } from "@/lib/infrastructure/supabase.server";

/**
 * RAG Engine - Semantic search for tax documents and DATEV data using pgvector
 *
 * Uses Supabase pgvector for semantic similarity search on:
 * - Tax law documents (AO, UStG, EStG, etc.)
 * - DATEV clients (Mandanten) from Klardaten sync
 * - DATEV orders (Aufträge) from Klardaten sync
 */
export class RAGEngine {
  constructor() {
    // No initialization needed - all data comes from Supabase
  }

  // ============================================
  // DATEV Client Search (Vector)
  // ============================================

  /**
   * Search DATEV clients using semantic vector search
   */
  async searchDatevClients(
    query: string,
    maxResults: number = 5
  ): Promise<{
    clients: DatevClientMatch[];
    context: string;
  }> {
    try {
      const queryEmbedding = await generateEmbedding(query);
      const supabase = createSupabaseAdminClient();

      const { data, error } = await supabase.rpc("match_datev_clients", {
        query_embedding: queryEmbedding,
        match_threshold: 0.3,
        match_count: maxResults,
      });

      if (error) {
        console.error("DATEV client search error:", error);
        return { clients: [], context: "" };
      }

      if (!data || data.length === 0) {
        return { clients: [], context: "" };
      }

      const clients = data as DatevClientMatch[];
      const context = this.formatDatevClientsContext(clients);

      return { clients, context };
    } catch (err) {
      console.error("DATEV client search failed:", err);
      return { clients: [], context: "" };
    }
  }

  /**
   * Search DATEV orders using semantic vector search
   */
  async searchDatevOrders(
    query: string,
    maxResults: number = 5
  ): Promise<{
    orders: DatevOrderMatch[];
    context: string;
  }> {
    try {
      const queryEmbedding = await generateEmbedding(query);
      const supabase = createSupabaseAdminClient();

      const { data, error } = await supabase.rpc("match_datev_orders", {
        query_embedding: queryEmbedding,
        match_threshold: 0.3,
        match_count: maxResults,
      });

      if (error) {
        console.error("DATEV order search error:", error);
        return { orders: [], context: "" };
      }

      if (!data || data.length === 0) {
        return { orders: [], context: "" };
      }

      const orders = data as DatevOrderMatch[];
      const context = this.formatDatevOrdersContext(orders);

      return { orders, context };
    } catch (err) {
      console.error("DATEV order search failed:", err);
      return { orders: [], context: "" };
    }
  }

  /**
   * Format DATEV clients as context string
   */
  private formatDatevClientsContext(clients: DatevClientMatch[]): string {
    if (clients.length === 0) return "";

    const clientTypeNames: Record<number, string> = {
      1: "Natürliche Person",
      2: "Einzelunternehmen",
      3: "Juristische Person",
    };

    return clients
      .map((client) => {
        const parts = [
          `Mandant: ${client.client_name} (Nr. ${client.client_number})`,
        ];
        if (client.company_form) {
          parts.push(`Rechtsform: ${client.company_form}`);
        }
        parts.push(
          `Typ: ${clientTypeNames[client.client_type] || "Unbekannt"}`
        );
        if (client.industry_description) {
          parts.push(`Branche: ${client.industry_description}`);
        }
        if (client.correspondence_city) {
          parts.push(`Standort: ${client.correspondence_city}`);
        }
        parts.push(`(${Math.round(client.similarity * 100)}% relevant)`);
        return parts.join(" | ");
      })
      .join("\n");
  }

  /**
   * Format DATEV orders as context string
   */
  private formatDatevOrdersContext(orders: DatevOrderMatch[]): string {
    if (orders.length === 0) return "";

    return orders
      .map((order) => {
        const parts = [
          `Auftrag: ${order.order_name}`,
          `Mandant: ${order.client_name}`,
          `Jahr: ${order.creation_year}`,
          `Nr: ${order.order_number}`,
          `Typ: ${order.ordertype}`,
          `Status: ${order.completion_status}`,
          `Abrechnung: ${order.billing_status}`,
          `(${Math.round(order.similarity * 100)}% relevant)`,
        ];
        return parts.join(" | ");
      })
      .join("\n");
  }

  // ============================================
  // Tax Law Search (Vector)
  // ============================================

  /**
   * Search tax law documents using semantic vector search (pgvector)
   * Errors propagate to caller - proper error handling via TEC-13
   */
  async searchTaxLaw(
    query: string,
    maxResults: number = 3
  ): Promise<{
    documents: TaxDocument[];
    citations: Citation[];
  }> {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Query Supabase using the match_tax_documents function
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc("match_tax_documents", {
      query_embedding: queryEmbedding,
      match_threshold: 0.3, // Lower threshold for German legal text
      match_count: maxResults,
    });

    if (error) {
      throw new Error(`Vector search failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return { documents: [], citations: [] };
    }

    // Convert database results to TaxDocument format
    const documents: TaxDocument[] = (data as TaxDocumentMatch[]).map(
      (match) => ({
        id: match.id,
        citation: match.citation,
        title: match.title,
        content: match.content,
        category: match.law_type as TaxDocument["category"],
      })
    );

    // Create citations with similarity scores
    const citations: Citation[] = (data as TaxDocumentMatch[]).map((match) => ({
      id: match.id,
      source: match.citation,
      title: `${match.title} (${Math.round(match.similarity * 100)}% relevant)`,
      content: match.content,
    }));

    return { documents, citations };
  }

  /**
   * Build context for RAG-augmented prompt
   * Includes tax law documents and DATEV client/order data from vector search
   */
  async buildContext(query: string): Promise<{
    taxContext: string;
    datevContext: string;
    citations: Citation[];
  }> {
    // Search tax law documents (vector search)
    const { documents: taxDocs, citations } = await this.searchTaxLaw(query);
    const taxContext = this.formatTaxContext(taxDocs);

    // Search DATEV data (vector search)
    const [datevClientsResult, datevOrdersResult] = await Promise.all([
      this.searchDatevClients(query, 3),
      this.searchDatevOrders(query, 5),
    ]);

    // Combine DATEV context
    const datevParts: string[] = [];
    if (datevClientsResult.context) {
      datevParts.push("=== DATEV Mandanten ===\n" + datevClientsResult.context);
    }
    if (datevOrdersResult.context) {
      datevParts.push("=== DATEV Aufträge ===\n" + datevOrdersResult.context);
    }
    const datevContext = datevParts.join("\n\n");

    return {
      taxContext,
      datevContext,
      citations,
    };
  }

  /**
   * Format tax documents as context string
   */
  private formatTaxContext(documents: TaxDocument[]): string {
    if (documents.length === 0) return "";

    return documents
      .map((doc) => `${doc.citation} - ${doc.title}:\n${doc.content}\n`)
      .join("\n");
  }
}

// Singleton instance
let ragEngineInstance: RAGEngine | null = null;

export function getRAGEngine(): RAGEngine {
  if (!ragEngineInstance) {
    ragEngineInstance = new RAGEngine();
  }
  return ragEngineInstance;
}
