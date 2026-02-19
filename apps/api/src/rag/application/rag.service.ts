import { EmbeddingsAdapter } from '@llm/domain/embeddings.adapter';
import { Injectable, Logger } from '@nestjs/common';
import {
  type Citation,
  type TaxDocument,
  type LawPublisherDocument,
} from '@rag/domain/citation.entity';
import {
  type DatevClientMatch,
  type DatevOrderMatch,
  type ChatDocumentChunkMatch,
  VectorStoreAdapter,
} from '@rag/domain/vector-store.adapter';
import { type ResearchSource } from '@atlas/shared';

/**
 * RAG Service - Application layer for Retrieval-Augmented Generation
 * Contains business logic for semantic search and context building
 * Depends on domain interfaces, not concrete implementations
 */
@Injectable()
export class RAGService {
  private readonly logger = new Logger(RAGService.name);

  constructor(
    private readonly vectorStoreAdapter: VectorStoreAdapter,
    private readonly embeddingsAdapter: EmbeddingsAdapter
  ) {}

  /**
   * Search for relevant context based on user query with optional client filtering
   * Returns formatted context and citations
   */
  async searchContext(
    query: string,
    clientIdFilter?: string,
    researchSources?: ResearchSource[],
    chatId?: string
  ): Promise<{
    context: string;
    citations: Citation[];
  }> {
    const { taxContext, datevContext, lawPublisherContext, uploadedDocContext, citations } =
      await this.buildContext(query, clientIdFilter, researchSources, chatId);

    // Combine contexts
    let combinedContext = '';

    if (taxContext) {
      combinedContext += `=== STEUERRECHTLICHE GRUNDLAGEN ===\n\n${taxContext}\n\n`;
    }

    // Law publisher section - only add if results found
    if (lawPublisherContext) {
      combinedContext += `=== RECHTSPRECHUNG & KOMMENTARE ===\n\n${lawPublisherContext}\n\n`;
    }

    if (uploadedDocContext) {
      combinedContext += `=== HOCHGELADENE DOKUMENTE ===\n\n${uploadedDocContext}\n\n`;
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
   * Build context for RAG-augmented prompt with optional client filtering
   * Includes tax law documents and DATEV client/order data from vector search
   */
  async buildContext(
    query: string,
    clientIdFilter?: string,
    researchSources?: ResearchSource[],
    chatId?: string
  ): Promise<{
    taxContext: string;
    datevContext: string;
    lawPublisherContext: string;
    uploadedDocContext: string;
    citations: Citation[];
  }> {
    // Search tax law documents (vector search)
    const { documents: taxDocs, citations } = await this.searchTaxLaw(query);
    const taxContext = this.formatTaxContext(taxDocs);

    // Search law publisher documents (vector search) - Phase TEC-55
    // Only search if law_publishers is included in researchSources
    let lawPublisherContext = '';
    let lawPublisherCitations: Citation[] = [];

    if (researchSources?.includes('law_publishers')) {
      const { documents: lawPublisherDocs, citations: lawPubCitations } =
        await this.searchLawPublisherDocuments(query);
      lawPublisherContext = this.formatLawPublisherContext(lawPublisherDocs);
      lawPublisherCitations = lawPubCitations;
    }

    // Search uploaded documents for this chat (vector search)
    let uploadedDocContext = '';
    let uploadedDocCitations: Citation[] = [];

    if (chatId) {
      const { context: uploadCtx, citations: uploadCits } = await this.searchUploadedDocuments(
        query,
        chatId
      );
      uploadedDocContext = uploadCtx;
      uploadedDocCitations = uploadCits;
    }

    // Search DATEV data (vector search) - Phase 1.2: Extended with tax, analytics, HR
    const [
      datevClientsResult,
      datevAddresseesResult,
      datevOrdersResult,
      datevCorpTaxResult,
      datevTradeTaxResult,
      datevAnalyticsResult,
      datevHrResult,
    ] = await Promise.all([
      // Fetch selected client directly by ID, or search semantically if no client is selected
      clientIdFilter ? this.getDatevClientById(clientIdFilter) : this.searchDatevClients(query, 3),
      this.searchDatevAddressees(query, 3, clientIdFilter),
      this.searchDatevOrders(query, 5), // add clientId filter after we enabled datev orders
      this.searchDatevCorpTax(query, 5, clientIdFilter),
      this.searchDatevTradeTax(query, 5, clientIdFilter),
      this.searchDatevAnalytics(query, 5, clientIdFilter),
      this.searchDatevHrEmployees(query, 5, clientIdFilter),
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
    if (datevCorpTaxResult.context) {
      datevParts.push('=== Körperschaftssteuer ===\n' + datevCorpTaxResult.context);
    }
    if (datevTradeTaxResult.context) {
      datevParts.push('=== Gewerbesteuer ===\n' + datevTradeTaxResult.context);
    }
    if (datevAnalyticsResult.context) {
      datevParts.push('=== Analytics ===\n' + datevAnalyticsResult.context);
    }
    if (datevHrResult.context) {
      datevParts.push('=== Mitarbeiter ===\n' + datevHrResult.context);
    }
    const datevContext = datevParts.join('\n\n');

    // Combine all citations
    const allCitations = [...citations, ...lawPublisherCitations, ...uploadedDocCitations];

    return {
      taxContext,
      datevContext,
      lawPublisherContext,
      uploadedDocContext,
      citations: allCitations,
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
      const queryEmbedding = await this.embeddingsAdapter.generateEmbedding(query);

      // Query vector store
      const matches = await this.vectorStoreAdapter.searchTaxDocuments(
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
   * Search law publisher documents using semantic vector search
   * Phase TEC-55: Case law, commentaries, and articles
   */
  async searchLawPublisherDocuments(
    query: string,
    maxResults: number = 3
  ): Promise<{
    documents: LawPublisherDocument[];
    citations: Citation[];
  }> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.embeddingsAdapter.generateEmbedding(query);

      // Query vector store
      const matches = await this.vectorStoreAdapter.searchLawPublisherDocuments(
        queryEmbedding,
        0.3, // Lower threshold for German legal text
        maxResults
      );

      if (!matches || matches.length === 0) {
        return { documents: [], citations: [] };
      }

      // Convert to domain entities (camelCase)
      const documents: LawPublisherDocument[] = matches.map((match) => ({
        id: match.id,
        title: match.title,
        citation: match.citation,
        documentType: match.document_type,
        content: match.content,
        summary: match.summary,
        publisher: match.publisher,
        source: match.source,
        lawReference: match.law_reference,
        court: match.court,
        caseNumber: match.case_number,
        decisionDate: match.decision_date,
        publicationDate: match.publication_date,
        author: match.author,
        tags: match.tags,
      }));

      // Create citations
      const citations: Citation[] = matches.map((match) => {
        let citationTitle = match.title;

        if (match.document_type === 'case_law' && match.court && match.case_number) {
          citationTitle = `${match.court} ${match.case_number}: ${match.title}`;
        } else if (match.document_type === 'commentary' && match.author) {
          citationTitle = `${match.author}: ${match.title}`;
        }

        return {
          id: match.id,
          source: match.citation ?? match.publisher ?? 'Rechtsverlage',
          title: `${citationTitle} (${Math.round(match.similarity * 100)}% relevant)`,
          content: match.summary ?? match.content,
        };
      });

      return { documents, citations };
    } catch (err) {
      this.logger.error('Law publisher document search failed:', err);
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
      const queryEmbedding = await this.embeddingsAdapter.generateEmbedding(query);

      const clients = await this.vectorStoreAdapter.searchDatevClients(
        queryEmbedding,
        0.3,
        maxResults
      );

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
   * Get a specific DATEV client by ID
   * Used when a client is selected via filter to provide full context
   */
  async getDatevClientById(clientId: string): Promise<{
    clients: DatevClientMatch[];
    context: string;
  }> {
    try {
      const client = await this.vectorStoreAdapter.getDatevClientById(clientId);

      if (!client) {
        return { clients: [], context: '' };
      }

      const context = this.formatDatevClientsContext([client]);
      return { clients: [client], context };
    } catch (err) {
      this.logger.error('DATEV client by ID fetch failed:', err);
      return { clients: [], context: '' };
    }
  }

  /**
   * Search DATEV addressees using semantic vector search
   * Phase 1.1: New method for finding contact persons, managing directors
   */
  async searchDatevAddressees(
    query: string,
    maxResults: number = 3,
    clientIdFilter?: string
  ): Promise<{
    addressees: import('@rag/domain/vector-store.adapter').DatevAddresseeMatch[];
    context: string;
  }> {
    try {
      const queryEmbedding = await this.embeddingsAdapter.generateEmbedding(query);

      const filters = clientIdFilter ? { client_id: clientIdFilter } : undefined;

      const addressees = await this.vectorStoreAdapter.searchDatevAddressees(
        queryEmbedding,
        0.3,
        maxResults,
        filters
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
      const queryEmbedding = await this.embeddingsAdapter.generateEmbedding(query);

      const orders = await this.vectorStoreAdapter.searchDatevOrders(
        queryEmbedding,
        0.3,
        maxResults
      );

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
   * Format law publisher documents as context string
   * Phase TEC-55: Case law, commentaries, and articles
   */
  private formatLawPublisherContext(documents: LawPublisherDocument[]): string {
    if (documents.length === 0) return '';

    const documentTypeLabels: Record<string, string> = {
      case_law: 'Rechtsprechung',
      commentary: 'Kommentar',
      article: 'Fachartikel',
    };

    return documents
      .map((doc) => {
        const parts: string[] = [];

        const typeLabel = documentTypeLabels[doc.documentType] ?? doc.documentType;
        parts.push(`[${typeLabel}] ${doc.title}`);

        // Case law metadata
        if (doc.documentType === 'case_law') {
          const caseParts: string[] = [];
          if (doc.court) caseParts.push(doc.court);
          if (doc.caseNumber) caseParts.push(doc.caseNumber);
          if (doc.decisionDate) caseParts.push(`vom ${doc.decisionDate}`);
          if (caseParts.length > 0) parts.push(caseParts.join(' '));
        }

        // Commentary/article metadata
        if (doc.documentType === 'commentary' || doc.documentType === 'article') {
          const metaParts: string[] = [];
          if (doc.author) metaParts.push(`Autor: ${doc.author}`);
          if (doc.publisher) metaParts.push(`Quelle: ${doc.publisher}`);
          if (metaParts.length > 0) parts.push(metaParts.join(' | '));
        }

        if (doc.lawReference) parts.push(`Bezug: ${doc.lawReference}`);
        if (doc.citation) parts.push(`Fundstelle: ${doc.citation}`);

        const contentToShow = doc.summary ?? doc.content;
        parts.push(`\n${contentToShow}\n`);

        return parts.join('\n');
      })
      .join('\n---\n\n');
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
    addressees: import('@rag/domain/vector-store.adapter').DatevAddresseeMatch[]
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

  // ============================================
  // Phase 1.2: Additional Search Methods
  // ============================================

  /**
   * Search DATEV corporate tax returns using semantic vector search
   * Phase 1.2: Tax data search
   */
  async searchDatevCorpTax(
    query: string,
    maxResults: number = 5,
    clientIdFilter?: string
  ): Promise<{
    corpTax: import('@rag/domain/vector-store.adapter').DatevCorpTaxMatch[];
    context: string;
  }> {
    try {
      const queryEmbedding = await this.embeddingsAdapter.generateEmbedding(query);

      const filters = clientIdFilter ? { client_id: clientIdFilter } : undefined;

      const corpTax = await this.vectorStoreAdapter.searchDatevCorpTax(
        queryEmbedding,
        0.3,
        maxResults,
        filters
      );

      if (!corpTax || corpTax.length === 0) {
        return { corpTax: [], context: '' };
      }

      const context = corpTax
        .map((tax) => {
          const parts = [
            `${tax.client_name} - Jahr ${tax.year}`,
            // Only show human-readable transmission_status (numeric status is not a status code)
            tax.transmission_status ? `Status: ${tax.transmission_status}` : '',
            `(${Math.round(tax.similarity * 100)}% relevant)`,
          ];
          return parts.filter(Boolean).join(' | ');
        })
        .join('\n');

      return { corpTax, context };
    } catch (err) {
      this.logger.error('DATEV corp tax search failed:', err);
      return { corpTax: [], context: '' };
    }
  }

  /**
   * Search DATEV trade tax returns using semantic vector search
   * Phase 1.2: Tax data search
   */
  async searchDatevTradeTax(
    query: string,
    maxResults: number = 5,
    clientIdFilter?: string
  ): Promise<{
    tradeTax: import('@rag/domain/vector-store.adapter').DatevTradeTaxMatch[];
    context: string;
  }> {
    try {
      const queryEmbedding = await this.embeddingsAdapter.generateEmbedding(query);

      const filters = clientIdFilter ? { client_id: clientIdFilter } : undefined;

      const tradeTax = await this.vectorStoreAdapter.searchDatevTradeTax(
        queryEmbedding,
        0.3,
        maxResults,
        filters
      );

      if (!tradeTax || tradeTax.length === 0) {
        return { tradeTax: [], context: '' };
      }

      const context = tradeTax
        .map((tax) => {
          const parts = [
            `${tax.client_name} - Jahr ${tax.year}`,
            // Only show human-readable transmission_status (numeric status is not a status code)
            tax.transmission_status ? `Status: ${tax.transmission_status}` : '',
            `(${Math.round(tax.similarity * 100)}% relevant)`,
          ];
          return parts.filter(Boolean).join(' | ');
        })
        .join('\n');

      return { tradeTax, context };
    } catch (err) {
      this.logger.error('DATEV trade tax search failed:', err);
      return { tradeTax: [], context: '' };
    }
  }

  /**
   * Search DATEV analytics order values using semantic vector search
   * Phase 1.2: Business intelligence search
   */
  async searchDatevAnalytics(
    query: string,
    maxResults: number = 5,
    clientIdFilter?: string
  ): Promise<{
    analytics: import('@rag/domain/vector-store.adapter').DatevAnalyticsOrderValuesMatch[];
    context: string;
  }> {
    try {
      const queryEmbedding = await this.embeddingsAdapter.generateEmbedding(query);

      const filters = clientIdFilter ? { client_id: clientIdFilter } : undefined;

      const analytics = await this.vectorStoreAdapter.searchDatevAnalyticsOrderValues(
        queryEmbedding,
        0.3,
        maxResults,
        filters
      );

      if (!analytics || analytics.length === 0) {
        return { analytics: [], context: '' };
      }

      const context = analytics
        .map((item) => {
          const avgValue = item.order_count > 0 ? item.order_value / item.order_count : 0;
          return [
            `${item.client_name} - ${item.year}/${item.month}`,
            `Volumen: ${item.order_value.toLocaleString('de-DE')} EUR`,
            `Aufträge: ${item.order_count}`,
            `Ø: ${avgValue.toLocaleString('de-DE')} EUR`,
            `(${Math.round(item.similarity * 100)}% relevant)`,
          ].join(' | ');
        })
        .join('\n');

      return { analytics, context };
    } catch (err) {
      this.logger.error('DATEV analytics search failed:', err);
      return { analytics: [], context: '' };
    }
  }

  /**
   * Search DATEV HR employees using semantic vector search
   * Phase 1.2: Employee search
   */
  async searchDatevHrEmployees(
    query: string,
    maxResults: number = 5,
    clientIdFilter?: string
  ): Promise<{
    employees: import('@rag/domain/vector-store.adapter').DatevHrEmployeeMatch[];
    context: string;
  }> {
    try {
      const queryEmbedding = await this.embeddingsAdapter.generateEmbedding(query);

      const filters = clientIdFilter ? { client_id: clientIdFilter } : undefined;

      const employees = await this.vectorStoreAdapter.searchDatevHrEmployees(
        queryEmbedding,
        0.3,
        maxResults,
        filters
      );

      if (!employees || employees.length === 0) {
        return { employees: [], context: '' };
      }

      const context = employees
        .map((emp) => {
          const parts = [
            emp.full_name,
            `Position: ${emp.position}`,
            emp.department ? `Abteilung: ${emp.department}` : '',
            emp.email ? `Email: ${emp.email}` : '',
            `Status: ${emp.is_active ? 'aktiv' : 'inaktiv'}`,
            `(${Math.round(emp.similarity * 100)}% relevant)`,
          ];
          return parts.filter(Boolean).join(' | ');
        })
        .join('\n');

      return { employees, context };
    } catch (err) {
      this.logger.error('DATEV HR employees search failed:', err);
      return { employees: [], context: '' };
    }
  }

  /**
   * Search uploaded document chunks for a specific chat
   */
  private async searchUploadedDocuments(
    query: string,
    chatId: string
  ): Promise<{
    context: string;
    citations: Citation[];
  }> {
    try {
      const queryEmbedding = await this.embeddingsAdapter.generateEmbedding(query);
      const matches = await this.vectorStoreAdapter.searchChatDocumentChunks(
        queryEmbedding,
        chatId,
        0.3,
        5
      );

      if (!matches || matches.length === 0) {
        return { context: '', citations: [] };
      }

      const context = this.formatUploadedDocContext(matches);
      const citations: Citation[] = matches.map((match) => ({
        id: match.id,
        source: 'upload',
        title: `${match.file_name} (Seite ${match.page_number ?? '?'}) (${Math.round(match.similarity * 100)}% relevant)`,
        content: match.content,
      }));

      return { context, citations };
    } catch (err) {
      this.logger.error('Uploaded document search failed:', err);
      return { context: '', citations: [] };
    }
  }

  /**
   * Format uploaded document chunks as context string
   */
  private formatUploadedDocContext(chunks: ChatDocumentChunkMatch[]): string {
    if (chunks.length === 0) return '';

    return chunks
      .map((c) => `[${c.file_name}, Seite ${c.page_number ?? '?'}]\n${c.content}`)
      .join('\n---\n');
  }
}
