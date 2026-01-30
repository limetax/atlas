import { Injectable, Logger } from '@nestjs/common';
import {
  IVectorStore,
  type DatevClientMatch,
  type DatevOrderMatch,
} from '@rag/domain/vector-store.interface';
import { type Citation, type TaxDocument } from '@rag/domain/citation.entity';
import { IEmbeddingsProvider } from '@llm/domain/embeddings-provider.interface';

/**
 * RAG Service - Application layer for Retrieval-Augmented Generation
 * Contains business logic for semantic search and context building
 * Depends on domain interfaces, not concrete implementations
 */
@Injectable()
export class RAGService {
  private readonly logger = new Logger(RAGService.name);

  constructor(
    private readonly vectorStore: IVectorStore,
    private readonly embeddingsProvider: IEmbeddingsProvider
  ) {}

  /**
   * Search for relevant context based on user query
   * Returns formatted context and citations
   */
  async searchContext(query: string): Promise<{
    context: string;
    citations: Citation[];
  }> {
    const { taxContext, datevContext, citations } = await this.buildContext(query);

    // Combine contexts
    let combinedContext = '';

    if (taxContext) {
      combinedContext += `=== STEUERRECHTLICHE GRUNDLAGEN ===\n\n${taxContext}\n\n`;
    }

    if (datevContext) {
      combinedContext += `=== DATEV DATEN ===\n\n${datevContext}\n\n`;
    }

    if (!combinedContext) {
      combinedContext = 'Keine spezifischen Dokumente oder Mandanten-Daten gefunden.';
    }

    return {
      context: combinedContext,
      citations,
    };
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

    // Search DATEV data (vector search) - Phase 1.1: Added addressees
    const [datevClientsResult, datevAddresseesResult, datevOrdersResult] = await Promise.all([
      this.searchDatevClients(query, 3),
      this.searchDatevAddressees(query, 3),
      this.searchDatevOrders(query, 5),
    ]);

    // Combine DATEV context
    const datevParts: string[] = [];
    if (datevClientsResult.context) {
      datevParts.push('=== DATEV Mandanten ===\n' + datevClientsResult.context);
    }
    if (datevAddresseesResult.context) {
      datevParts.push('=== DATEV Kontaktpersonen ===\n' + datevAddresseesResult.context);
    }
    if (datevOrdersResult.context) {
      datevParts.push('=== DATEV Aufträge ===\n' + datevOrdersResult.context);
    }
    const datevContext = datevParts.join('\n\n');

    return {
      taxContext,
      datevContext,
      citations,
    };
  }

  /**
   * Search tax law documents using semantic vector search
   */
  async searchTaxLaw(
    query: string,
    maxResults: number = 3
  ): Promise<{
    documents: TaxDocument[];
    citations: Citation[];
  }> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.embeddingsProvider.generateEmbedding(query);

      // Query vector store
      const matches = await this.vectorStore.searchTaxDocuments(
        queryEmbedding,
        0.3, // Lower threshold for German legal text
        maxResults
      );

      if (!matches || matches.length === 0) {
        return { documents: [], citations: [] };
      }

      // Convert to domain entities
      const documents: TaxDocument[] = matches.map((match) => ({
        id: match.id,
        citation: match.citation,
        title: match.title,
        content: match.content,
        category: match.law_type as TaxDocument['category'],
      }));

      // Create citations with similarity scores
      const citations: Citation[] = matches.map((match) => ({
        id: match.id,
        source: match.citation,
        title: `${match.title} (${Math.round(match.similarity * 100)}% relevant)`,
        content: match.content,
      }));

      return { documents, citations };
    } catch (err) {
      this.logger.error('Tax law search failed:', err);
      return { documents: [], citations: [] };
    }
  }

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
      const queryEmbedding = await this.embeddingsProvider.generateEmbedding(query);

      const clients = await this.vectorStore.searchDatevClients(queryEmbedding, 0.3, maxResults);

      if (!clients || clients.length === 0) {
        return { clients: [], context: '' };
      }

      const context = this.formatDatevClientsContext(clients);
      return { clients, context };
    } catch (err) {
      this.logger.error('DATEV client search failed:', err);
      return { clients: [], context: '' };
    }
  }

  /**
   * Search DATEV addressees using semantic vector search
   * Phase 1.1: New method for finding contact persons, managing directors
   */
  async searchDatevAddressees(
    query: string,
    maxResults: number = 3
  ): Promise<{
    addressees: import('@rag/domain/vector-store.interface').DatevAddresseeMatch[];
    context: string;
  }> {
    try {
      const queryEmbedding = await this.embeddingsProvider.generateEmbedding(query);

      const addressees = await this.vectorStore.searchDatevAddressees(
        queryEmbedding,
        0.3,
        maxResults
      );

      if (!addressees || addressees.length === 0) {
        return { addressees: [], context: '' };
      }

      const context = this.formatDatevAddresseesContext(addressees);
      return { addressees, context };
    } catch (err) {
      this.logger.error('DATEV addressee search failed:', err);
      return { addressees: [], context: '' };
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
      const queryEmbedding = await this.embeddingsProvider.generateEmbedding(query);

      const orders = await this.vectorStore.searchDatevOrders(queryEmbedding, 0.3, maxResults);

      if (!orders || orders.length === 0) {
        return { orders: [], context: '' };
      }

      const context = this.formatDatevOrdersContext(orders);
      return { orders, context };
    } catch (err) {
      this.logger.error('DATEV order search failed:', err);
      return { orders: [], context: '' };
    }
  }

  /**
   * Format tax documents as context string
   */
  private formatTaxContext(documents: TaxDocument[]): string {
    if (documents.length === 0) return '';

    return documents.map((doc) => `${doc.citation} - ${doc.title}:\n${doc.content}\n`).join('\n');
  }

  /**
   * Format DATEV clients as context string
   */
  private formatDatevClientsContext(clients: DatevClientMatch[]): string {
    if (clients.length === 0) return '';

    const clientTypeNames: Record<number, string> = {
      1: 'Natürliche Person',
      2: 'Einzelunternehmen',
      3: 'Juristische Person',
    };

    return clients
      .map((client) => {
        const parts = [`Mandant: ${client.client_name} (Nr. ${client.client_number})`];
        if (client.company_form) {
          parts.push(`Rechtsform: ${client.company_form}`);
        }
        if (client.client_type !== null) {
          parts.push(`Typ: ${clientTypeNames[client.client_type] ?? 'Unbekannt'}`);
        }
        // Managing director info (Phase 1.1 enrichment)
        if (client.managing_director_name) {
          const directorParts = [client.managing_director_name];
          if (client.managing_director_email) directorParts.push(client.managing_director_email);
          if (client.managing_director_phone) directorParts.push(client.managing_director_phone);
          parts.push(`Geschäftsführer/Partner: ${directorParts.join(', ')}`);
        }
        if (client.industry_description) {
          parts.push(`Branche: ${client.industry_description}`);
        }
        if (client.correspondence_city) {
          parts.push(`Standort: ${client.correspondence_city}`);
        }
        if (client.main_email) {
          parts.push(`Email: ${client.main_email}`);
        }
        if (client.main_phone) {
          parts.push(`Tel: ${client.main_phone}`);
        }
        if (client.organization_name) {
          parts.push(`Organisation: ${client.organization_name}`);
        }
        parts.push(`(${Math.round(client.similarity * 100)}% relevant)`);
        return parts.join(' | ');
      })
      .join('\n');
  }

  /**
   * Format DATEV addressees as context string
   * Phase 1.1: New formatter for contact persons/managing directors
   */
  private formatDatevAddresseesContext(
    addressees: import('@rag/domain/vector-store.interface').DatevAddresseeMatch[]
  ): string {
    if (addressees.length === 0) return '';

    const typeNames: Record<number, string> = {
      1: 'Natürliche Person',
      2: 'Juristische Person',
    };

    return addressees
      .map((addressee) => {
        const parts = [`${addressee.full_name}`];
        if (addressee.addressee_type) {
          parts.push(`(${typeNames[addressee.addressee_type] ?? 'Unbekannt'})`);
        }
        if (addressee.company_entity_type) {
          parts.push(`Rechtsform: ${addressee.company_entity_type}`);
        }
        if (addressee.is_legal_representative_of_company) {
          parts.push(`Geschäftsführer`);
        }
        if (addressee.main_email) {
          parts.push(`Email: ${addressee.main_email}`);
        }
        if (addressee.main_phone) {
          parts.push(`Tel: ${addressee.main_phone}`);
        }
        if (addressee.correspondence_city) {
          parts.push(`Standort: ${addressee.correspondence_city}`);
        }
        parts.push(`(${Math.round(addressee.similarity * 100)}% relevant)`);
        return parts.join(' | ');
      })
      .join('\n');
  }

  /**
   * Format DATEV orders as context string
   */
  private formatDatevOrdersContext(orders: DatevOrderMatch[]): string {
    if (orders.length === 0) return '';

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
        return parts.join(' | ');
      })
      .join('\n');
  }
}
