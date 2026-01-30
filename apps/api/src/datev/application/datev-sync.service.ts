import { Injectable, Logger } from '@nestjs/common';
import {
  DatevClient,
  DatevAddressee,
  DatevPosting,
  DatevSusa,
  DatevDocument,
  DatevSyncResult,
} from '@atlas/shared';
import { IDatevAdapter } from '@datev/domain/datev-adapter.interface';
import { IEmbeddingsProvider } from '@llm/domain/embeddings-provider.interface';
import { SupabaseService } from '@shared/infrastructure/supabase.service';
import { KlardatenClient } from '@datev/infrastructure/klardaten.client';
import pLimit from 'p-limit';

/**
 * DATEV Sync Service - Phase 1.1 Klardaten Core Tables
 *
 * Orchestrates synchronization of DATEV data from Klardaten API to Supabase Vector DB.
 *
 * Sync Flow:
 * 1. Authenticate with Klardaten
 * 2. Sync addressees (for client enrichment)
 * 3. Sync clients with addressee denormalization
 * 4. Per-client: Sync postings + SUSA + documents (batched to prevent timeouts)
 * 5. Generate embeddings for all records
 *
 * Data Filter: 2025-01-01+ only
 * Dependencies: KlardatenClient (not IDatevAdapter - direct Klardaten API access)
 */
@Injectable()
export class DatevSyncService {
  private readonly logger = new Logger(DatevSyncService.name);
  private readonly concurrencyLimit = pLimit(5); // Max 5 concurrent operations

  constructor(
    private readonly klardatenClient: KlardatenClient,
    private readonly embeddingsProvider: IEmbeddingsProvider,
    private readonly supabase: SupabaseService
  ) {}

  /**
   * Run full Klardaten sync: addressees, clients, postings, susa, documents
   * Phase 1.1: Core tables only, 2025+ data
   */
  async sync(fiscalYear: number = 2025): Promise<DatevSyncResult> {
    const startTime = Date.now();
    this.logger.log(`🚀 Starting Klardaten sync (fiscal year ${fiscalYear})...`);
    this.logger.log(`📅 Date filter: 2025-01-01 onwards`);

    try {
      // Step 1: Authenticate
      await this.klardatenClient.authenticate();

      // Step 2: Sync addressees first (needed for client enrichment)
      const addresseeResult = await this.syncAddressees();

      // Step 3: Sync clients with addressee enrichment
      const clientResult = await this.syncClients();

      // Phase 1.1: Accounting sync DISABLED (API issues - see comments below)
      // Postings: 403 Forbidden - requires different Klardaten plan
      // SUSA: Returns empty arrays - no data available
      // Documents: Data quality issues - many required fields are null
      // Will be enabled in Phase 1.2 after resolving with Klardaten support

      /* COMMENTED OUT - Phase 1.2
      // Step 4: Get client list for per-client accounting sync
      const { data: clients, error: clientListError } = await this.supabase.db
        .from('datev_clients')
        .select('client_id, client_name, client_status')
        .eq('client_status', '1'); // Only active clients

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/98926b89-5c75-4f32-b935-5d5bdd473e40', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'datev-sync.service.ts:100',
          message: 'Client list query result',
          data: {
            clientCount: clients?.length ?? 0,
            hasError: !!clientListError,
            errorMsg: clientListError?.message,
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          hypothesisId: 'C',
        }),
      }).catch(() => {});
      // #endregion

      if (clientListError) {
        throw new Error(`Failed to get client list: ${clientListError.message}`);
      }

      this.logger.log(
        `📋 Found ${clients?.length ?? 0} active clients for accounting sync (limited to 3 for debugging)`
      );

      // Step 5: Sync accounting data per client (sequential to avoid overwhelming DB)
      let totalPostings = 0;
      let totalSusa = 0;
      let totalDocuments = 0;
      let postingErrors = 0;
      let susaErrors = 0;
      let documentErrors = 0;

      for (const client of clients || []) {
        this.logger.log(`\n📊 Syncing accounting data for ${client.client_name}...`);

        try {
          // Postings (high volume)
          const postingResult = await this.syncClientPostings(
            client.client_id,
            client.client_name,
            fiscalYear
          );
          totalPostings += postingResult.synced;
          postingErrors += postingResult.errors;

          // SUSA (aggregated, lower volume)
          const susaResult = await this.syncClientSusa(
            client.client_id,
            client.client_name,
            fiscalYear
          );
          totalSusa += susaResult.synced;
          susaErrors += susaResult.errors;

          // Documents (metadata only)
          const documentResult = await this.syncClientDocuments(
            client.client_id,
            client.client_name
          );
          totalDocuments += documentResult.synced;
          documentErrors += documentResult.errors;

          // Small delay to prevent API rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          this.logger.error(`Error syncing accounting data for ${client.client_name}:`, error);
        }
      }

      */ // End of commented accounting sync

      // Phase 1.1: Hardcode zeros for accounting data
      const totalPostings = 0;
      const totalSusa = 0;
      const totalDocuments = 0;
      const postingErrors = 0;
      const susaErrors = 0;
      const documentErrors = 0;

      const duration = Date.now() - startTime;
      this.logger.log(`\n✅ Klardaten sync completed in ${duration}ms`);
      this.logger.log(`   📊 Summary (Phase 1.1 - Master Data Only):`);
      this.logger.log(`      - Addressees: ${addresseeResult.synced}/${addresseeResult.fetched}`);
      this.logger.log(`      - Clients: ${clientResult.synced}/${clientResult.fetched}`);
      this.logger.log(`      - Postings: Skipped (API returns 403 Forbidden)`);
      this.logger.log(`      - SUSA: Skipped (API returns empty arrays)`);
      this.logger.log(`      - Documents: Skipped (data quality issues)`);

      return {
        success: true,
        addressees: {
          fetched: addresseeResult.fetched,
          synced: addresseeResult.synced,
          errors: addresseeResult.errors,
        },
        clients: {
          fetched: clientResult.fetched,
          synced: clientResult.synced,
          errors: clientResult.errors,
        },
        postings: {
          fetched: totalPostings + postingErrors,
          synced: totalPostings,
          errors: postingErrors,
        },
        susa: {
          fetched: totalSusa + susaErrors,
          synced: totalSusa,
          errors: susaErrors,
        },
        documents: {
          fetched: totalDocuments + documentErrors,
          synced: totalDocuments,
          errors: documentErrors,
        },
        duration_ms: duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('❌ Klardaten sync failed:', error);

      return {
        success: false,
        addressees: { fetched: 0, synced: 0, errors: 0 },
        clients: { fetched: 0, synced: 0, errors: 0 },
        postings: { fetched: 0, synced: 0, errors: 0 },
        susa: { fetched: 0, synced: 0, errors: 0 },
        documents: { fetched: 0, synced: 0, errors: 0 },
        duration_ms: duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sync addressees from Klardaten to Supabase
   * These are used to enrich client data with managing director info
   */
  private async syncAddressees(): Promise<{ fetched: number; synced: number; errors: number }> {
    this.logger.log(`\n📥 Syncing addressees with batched embeddings...`);

    const addressees = await this.klardatenClient.getAddressees();
    let synced = 0;
    let errors = 0;

    // Process in batches of 50 for parallel embedding generation
    const batchSize = 50;

    for (let i = 0; i < addressees.length; i += batchSize) {
      const batch = addressees.slice(i, i + batchSize);

      // Generate embeddings for entire batch in parallel
      const embeddedBatch = await Promise.all(
        batch.map(async (addressee) => {
          try {
            const embeddingText = this.generateAddresseeEmbeddingText(addressee);
            const embedding = await this.embeddingsProvider.generateEmbedding(embeddingText);

            return {
              addressee_id: addressee.addressee_id,
              addressee_type: addressee.addressee_type,
              full_name: addressee.full_name,
              updated_at: addressee.updated_at,
              addressee_status: addressee.addressee_status ?? null,
              status: addressee.status ?? null,
              birth_date: addressee.birth_date ?? null,
              age: addressee.age ?? null,
              noble_title: addressee.noble_title ?? null,
              academic_title: addressee.academic_title ?? null,
              salutation: addressee.salutation ?? null,
              gender: addressee.gender ?? null,
              alias_name: addressee.alias_name ?? null,
              main_email: addressee.main_email ?? null,
              main_phone: addressee.main_phone ?? null,
              main_fax: addressee.main_fax ?? null,
              correspondence_street: addressee.correspondence_street ?? null,
              correspondence_city: addressee.correspondence_city ?? null,
              correspondence_zip_code: addressee.correspondence_zip_code ?? null,
              tax_number_vat: addressee.tax_number_vat ?? null,
              identification_number: addressee.identification_number ?? null,
              vat_id: addressee.vat_id ?? null,
              company_entity_type: addressee.company_entity_type ?? null,
              company_object: addressee.company_object ?? null,
              foundation_date: addressee.foundation_date ?? null,
              industry_description: addressee.industry_description ?? null,
              is_client: addressee.is_client ?? null,
              is_legal_representative_of_person:
                addressee.is_legal_representative_of_person ?? null,
              is_legal_representative_of_company:
                addressee.is_legal_representative_of_company ?? null,
              is_shareholder: addressee.is_shareholder ?? null,
              is_business_owner: addressee.is_business_owner ?? null,
              embedding_text: embeddingText,
              embedding: embedding,
              metadata: {
                addressee_type: addressee.addressee_type,
                is_legal_representative: addressee.is_legal_representative_of_company ?? 0,
              },
              synced_at: new Date().toISOString(),
            };
          } catch (error) {
            this.logger.error(`Error processing addressee ${addressee.full_name}:`, error);
            errors++;
            return null;
          }
        })
      );

      // Filter out failed embeddings
      const validBatch = embeddedBatch.filter((item) => item !== null);

      // Batch upsert to Supabase (all 50 at once)
      if (validBatch.length > 0) {
        const { error } = await this.supabase.db.from('datev_addressees').upsert(validBatch, {
          onConflict: 'addressee_id',
        });

        if (error) {
          this.logger.error(`Error upserting addressee batch:`, error);
          errors += validBatch.length;
        } else {
          synced += validBatch.length;
        }
      }

      // Progress feedback
      if (i % 500 === 0 && i > 0) {
        this.logger.log(`  → Processed ${i}/${addressees.length} addressees...`);
      }
    }

    this.logger.log(`✅ Synced ${synced}/${addressees.length} addressees (${errors} errors)`);
    return { fetched: addressees.length, synced, errors };
  }

  /**
   * Sync clients from Klardaten with addressee enrichment and batched embeddings
   */
  private async syncClients(): Promise<{ fetched: number; synced: number; errors: number }> {
    this.logger.log(`\n📥 Syncing clients with addressee enrichment (batched)...`);

    const clients = await this.klardatenClient.getClients();

    // Create addressee map for quick lookups
    const { data: addressees } = await this.supabase.db.from('datev_addressees').select('*');
    const addresseeMap = new Map(addressees?.map((a) => [a.addressee_id, a]) ?? []);

    let synced = 0;
    let errors = 0;

    // Process in batches of 50 for parallel embedding generation
    const batchSize = 50;

    for (let i = 0; i < clients.length; i += batchSize) {
      const batch = clients.slice(i, i + batchSize);

      // Generate embeddings for entire batch in parallel
      const embeddedBatch = await Promise.all(
        batch.map(async (client) => {
          try {
            // Lookup managing director from addressee
            const managingDirectorRow = client.natural_person_id
              ? addresseeMap.get(client.natural_person_id)
              : client.legal_person_id
                ? addresseeMap.get(client.legal_person_id)
                : null;

            // Convert to DatevAddressee type for embedding generation
            const managingDirector: DatevAddressee | null = managingDirectorRow
              ? {
                  addressee_id: managingDirectorRow.addressee_id,
                  addressee_type: managingDirectorRow.addressee_type,
                  full_name: managingDirectorRow.full_name,
                  updated_at: managingDirectorRow.updated_at,
                  main_email: managingDirectorRow.main_email ?? undefined,
                  main_phone: managingDirectorRow.main_phone ?? undefined,
                  main_fax: managingDirectorRow.main_fax ?? undefined,
                  correspondence_street: managingDirectorRow.correspondence_street ?? undefined,
                  correspondence_city: managingDirectorRow.correspondence_city ?? undefined,
                  correspondence_zip_code: managingDirectorRow.correspondence_zip_code ?? undefined,
                  academic_title: managingDirectorRow.academic_title ?? undefined,
                  company_entity_type: managingDirectorRow.company_entity_type ?? undefined,
                }
              : null;

            // Generate enriched embedding text
            const embeddingText = this.generateClientEmbeddingText(client, managingDirector);

            // Generate embedding vector
            const embedding = await this.embeddingsProvider.generateEmbedding(embeddingText);

            return {
              client_id: client.client_id,
              client_number: client.client_number,
              client_name: client.client_name,
              client_status: client.client_status,
              status: client.status,
              updated_at: client.updated_at,
              is_online: client.is_online,
              differing_name: client.differing_name ?? null,
              client_type: client.client_type ?? null,
              client_from: client.client_from ?? null,
              client_until: client.client_until ?? null,
              natural_person_id: client.natural_person_id ?? null,
              legal_person_id: client.legal_person_id ?? null,
              organization_id: client.organization_id ?? null,
              establishment_id: client.establishment_id ?? null,
              area_id: client.area_id ?? null,
              establishment_number: client.establishment_number ?? null,
              establishment_name: client.establishment_name ?? null,
              organization_number: client.organization_number ?? null,
              organization_name: client.organization_name ?? null,
              functional_area_name: client.functional_area_name ?? null,
              main_email: client.main_email ?? null,
              main_phone: client.main_phone ?? null,
              main_fax: client.main_fax ?? null,
              correspondence_street: client.correspondence_street ?? null,
              correspondence_city: client.correspondence_city ?? null,
              correspondence_zip_code: client.correspondence_zip_code ?? null,
              tax_number_vat: client.tax_number_vat ?? null,
              identification_number: client.identification_number ?? null,
              company_form: client.company_form ?? null,
              industry_description: client.industry_description ?? null,
              managing_director_name: managingDirector?.full_name ?? null,
              managing_director_email: managingDirector?.main_email ?? null,
              managing_director_phone: managingDirector?.main_phone ?? null,
              managing_director_title: managingDirector?.academic_title ?? null,
              embedding_text: embeddingText,
              embedding: embedding,
              metadata: {
                natural_person_id: client.natural_person_id ?? null,
                legal_person_id: client.legal_person_id ?? null,
                organization_id: client.organization_id ?? null,
                establishment_id: client.establishment_id ?? null,
                area_id: client.area_id ?? null,
                client_type: client.client_type ?? null,
              },
              synced_at: new Date().toISOString(),
            };
          } catch (error) {
            this.logger.error(`Error processing client ${client.client_name}:`, error);
            errors++;
            return null;
          }
        })
      );

      // Filter out failed embeddings
      const validBatch = embeddedBatch.filter((item) => item !== null);

      // Batch upsert to Supabase (all 50 at once)
      if (validBatch.length > 0) {
        const { error } = await this.supabase.db.from('datev_clients').upsert(validBatch, {
          onConflict: 'client_id',
        });

        if (error) {
          this.logger.error(`Error upserting client batch:`, error);
          errors += validBatch.length;
        } else {
          synced += validBatch.length;
        }
      }

      // Progress feedback
      if (i % 500 === 0 && i > 0) {
        this.logger.log(`  → Processed ${i}/${clients.length} clients...`);
      }
    }

    this.logger.log(`✅ Synced ${synced}/${clients.length} clients (${errors} errors)`);
    return { fetched: clients.length, synced, errors };
  }

  /* CLIENTS OLD SEQUENTIAL CODE - REPLACED WITH BATCHED VERSION ABOVE
  private async syncClients_OLD(): Promise<{ fetched: number; synced: number; errors: number }> {
    const clients = await this.klardatenClient.getClients();
    const { data: addressees } = await this.supabase.db.from('datev_addressees').select('*');
    const addresseeMap = new Map(addressees?.map((a) => [a.addressee_id, a]) ?? []);
    let synced = 0;
    let errors = 0;

    for (const client of clients) {
      try {
        const managingDirectorRow = client.natural_person_id
          ? addresseeMap.get(client.natural_person_id)
          : client.legal_person_id
            ? addresseeMap.get(client.legal_person_id)
            : null;
        const managingDirector: DatevAddressee | null = managingDirectorRow
          ? {
              addressee_id: managingDirectorRow.addressee_id,
              addressee_type: managingDirectorRow.addressee_type,
              full_name: managingDirectorRow.full_name,
              updated_at: managingDirectorRow.updated_at,
              main_email: managingDirectorRow.main_email ?? undefined,
              main_phone: managingDirectorRow.main_phone ?? undefined,
              main_fax: managingDirectorRow.main_fax ?? undefined,
              correspondence_street: managingDirectorRow.correspondence_street ?? undefined,
              correspondence_city: managingDirectorRow.correspondence_city ?? undefined,
              correspondence_zip_code: managingDirectorRow.correspondence_zip_code ?? undefined,
              academic_title: managingDirectorRow.academic_title ?? undefined,
              company_entity_type: managingDirectorRow.company_entity_type ?? undefined,
            }
          : null;
        const embeddingText = this.generateClientEmbeddingText(client, managingDirector);
        const embedding = await this.embeddingsProvider.generateEmbedding(embeddingText);
        const { error } = await this.supabase.db.from('datev_clients').upsert(
  */

  /**
   * Sync accounting postings for a specific client
   * Uses batching to prevent timeouts (postings can be 100k+ per client)
   */
  private async syncClientPostings(
    clientId: string,
    clientName: string,
    fiscalYear: number
  ): Promise<{ synced: number; errors: number }> {
    let synced = 0;
    let errors = 0;

    try {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/98926b89-5c75-4f32-b935-5d5bdd473e40', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'datev-sync.service.ts:401',
          message: 'Before getAccountingPostings API call',
          data: { clientId, clientName, fiscalYear },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          hypothesisId: 'B',
        }),
      }).catch(() => {});
      // #endregion

      // Fetch postings (already filtered for 2025+ by KlardatenClient)
      const postings = await this.klardatenClient.getAccountingPostings(clientId, fiscalYear);

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/98926b89-5c75-4f32-b935-5d5bdd473e40', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'datev-sync.service.ts:410',
          message: 'After getAccountingPostings API call',
          data: { clientName, postingCount: postings.length, fiscalYear },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          hypothesisId: 'A,D',
        }),
      }).catch(() => {});
      // #endregion

      if (postings.length === 0) {
        this.logger.debug(`  → No postings found for ${clientName}`);
        return { synced: 0, errors: 0 };
      }

      this.logger.log(`  → Processing ${postings.length} postings for ${clientName}...`);

      // Process in batches of 100 (balance embedding generation speed vs progress feedback)
      const batchSize = 100;
      for (let i = 0; i < postings.length; i += batchSize) {
        const batch = postings.slice(i, i + batchSize);

        // Generate embeddings for batch (parallel)
        const embeddedBatch = await Promise.all(
          batch.map(async (posting) => {
            try {
              const embeddingText = this.generatePostingEmbeddingText(posting);
              const embedding = await this.embeddingsProvider.generateEmbedding(embeddingText);

              return {
                client_id: clientId,
                client_name: clientName,
                date: posting.date,
                account_number: posting.account_number,
                account_name: posting.account_name ?? null,
                contra_account_number: posting.contra_account_number,
                posting_description: posting.posting_description,
                tax_rate: posting.tax_rate,
                document_field_1: posting.document_field_1,
                document_field_2: posting.document_field_2,
                amount: posting.amount,
                debit_credit_indicator: posting.debit_credit_indicator,
                currency_code: posting.currency_code,
                exchange_rate: posting.exchange_rate,
                record_type: posting.record_type,
                accounting_transaction_key: posting.accounting_transaction_key,
                general_reversal: posting.general_reversal,
                document_link: posting.document_link,
                fiscal_year: posting.fiscal_year,
                embedding_text: embeddingText,
                embedding: embedding,
                metadata: {
                  client_id: clientId,
                  fiscal_year: posting.fiscal_year,
                  account_number: posting.account_number,
                  posting_date: posting.date,
                },
                synced_at: new Date().toISOString(),
              };
            } catch (error) {
              this.logger.error(`Error processing posting:`, error);
              errors++;
              return null;
            }
          })
        );

        // Filter out failed embeddings
        const validBatch = embeddedBatch.filter((p) => p !== null);

        // Batch upsert
        if (validBatch.length > 0) {
          const { error } = await this.supabase.db
            .from('datev_accounting_postings')
            .upsert(validBatch);

          if (error) {
            this.logger.error(`Error upserting posting batch:`, error);
            errors += validBatch.length;
          } else {
            synced += validBatch.length;
          }
        }

        // Progress feedback for large datasets
        if (postings.length > 1000 && (i + batchSize) % 1000 === 0) {
          this.logger.log(`    → Processed ${i + batchSize}/${postings.length} postings...`);
        }
      }

      this.logger.log(`  ✅ Synced ${synced} postings for ${clientName}`);
    } catch (error) {
      this.logger.error(`Failed to sync postings for ${clientName}:`, error);
    }

    return { synced, errors };
  }

  /**
   * Sync SUSA (trial balance) for a specific client
   */
  private async syncClientSusa(
    clientId: string,
    clientName: string,
    fiscalYear: number
  ): Promise<{ synced: number; errors: number }> {
    let synced = 0;
    let errors = 0;

    try {
      const susaEntries = await this.klardatenClient.getSusa(clientId, fiscalYear);

      if (susaEntries.length === 0) {
        this.logger.debug(`  → No SUSA data for ${clientName}`);
        return { synced: 0, errors: 0 };
      }

      for (const susa of susaEntries) {
        try {
          // Generate embedding text
          const embeddingText = this.generateSusaEmbeddingText(susa, clientName);

          // Generate embedding vector
          const embedding = await this.embeddingsProvider.generateEmbedding(embeddingText);

          // Upsert to Supabase
          const { error } = await this.supabase.db.from('datev_susa').upsert(
            {
              client_id: clientId,
              client_name: clientName,
              fiscal_year: fiscalYear,
              month: susa.month ?? null,
              account_number: susa.account_number,
              label: susa.label ?? null,
              debit_total: susa.debit_total,
              credit_total: susa.credit_total,
              current_month_debit: susa.current_month_debit,
              current_month_credit: susa.current_month_credit,
              debit_credit_code: susa.debit_credit_code,
              balance: susa.balance,
              transaction_count: susa.transaction_count,
              current_month_transaction_count: susa.current_month_transaction_count ?? null,
              embedding_text: embeddingText,
              embedding: embedding,
              metadata: {
                client_id: clientId,
                fiscal_year: fiscalYear,
                month: susa.month,
                account_number: susa.account_number,
              },
              synced_at: new Date().toISOString(),
            },
            {
              onConflict: 'client_id,fiscal_year,month,account_number',
            }
          );

          if (error) {
            this.logger.error(`Error syncing SUSA entry:`, error);
            errors++;
          } else {
            synced++;
          }
        } catch (err) {
          this.logger.error(`Error processing SUSA entry:`, err);
          errors++;
        }
      }

      this.logger.log(`  ✅ Synced ${synced} SUSA entries for ${clientName}`);
    } catch (error) {
      this.logger.error(`Failed to sync SUSA for ${clientName}:`, error);
    }

    return { synced, errors };
  }

  /**
   * Sync document metadata for a specific client
   * Note: NO FILE CONTENT - only metadata. S3 integration in Phase 1.2
   */
  private async syncClientDocuments(
    clientId: string,
    clientName: string
  ): Promise<{ synced: number; errors: number }> {
    let synced = 0;
    let errors = 0;

    try {
      const documents = await this.klardatenClient.getDocuments(clientId);

      if (documents.length === 0) {
        this.logger.debug(`  → No documents for ${clientName}`);
        return { synced: 0, errors: 0 };
      }

      for (const doc of documents) {
        try {
          // Generate embedding text
          const embeddingText = this.generateDocumentEmbeddingText(doc, clientName);

          // Generate embedding vector
          const embedding = await this.embeddingsProvider.generateEmbedding(embeddingText);

          // Map Klardaten API fields to our DB schema
          // API uses: id, number, description, extension, case_number
          // DB uses: document_id, document_number, description, extension, case_number
          const documentData = doc as {
            id?: string;
            document_id?: string;
            number?: number;
            document_number?: number;
            description?: string;
            extension?: string;
            case_number?: string;
            correspondence_partner_firm_number?: number;
            folder_id?: number;
            folder_name?: string;
            year?: number;
            month?: number;
            keywords?: string;
            import_date_time?: string;
            create_date_time?: string;
            change_date_time?: string;
            file_name?: string;
            file_size_bytes?: number;
            priority?: string;
            archived?: boolean;
            read_only?: number;
          };

          // Validate required field
          const docId = documentData.id ?? documentData.document_id;
          if (!docId) {
            this.logger.warn(`Document missing ID, skipping`);
            errors++;
            continue;
          }

          // Upsert to Supabase
          const { error } = await this.supabase.db.from('datev_documents').upsert(
            {
              document_id: docId,
              document_number: documentData.number ?? documentData.document_number ?? null,
              description: documentData.description ?? '',
              extension: documentData.extension ?? '',
              case_number: documentData.case_number ?? null,
              client_id: clientId,
              client_number: documentData.correspondence_partner_firm_number ?? 0,
              folder_id: doc.folder_id ?? null,
              folder_name: doc.folder_name ?? null,
              year: doc.year ?? null,
              month: doc.month ?? null,
              keywords: doc.keywords ?? null,
              import_date_time: doc.import_date_time ?? null,
              create_date_time: doc.create_date_time ?? null,
              change_date_time: doc.change_date_time ?? null,
              file_name: doc.file_name ?? null,
              file_size_bytes: doc.file_size_bytes ?? null,
              priority: doc.priority ?? null,
              archived: doc.archived ?? null,
              read_only: doc.read_only ?? 0,
              // S3 fields remain NULL for Phase 1.1
              s3_bucket: null,
              s3_key: null,
              s3_url: null,
              embedding_text: embeddingText,
              embedding: embedding,
              metadata: {
                client_id: clientId,
                extension: doc.extension,
                year: doc.year,
                import_date: doc.import_date_time,
              },
              synced_at: new Date().toISOString(),
            },
            {
              onConflict: 'document_id',
            }
          );

          if (error) {
            this.logger.error(`Error syncing document ${doc.document_id}:`, error);
            errors++;
          } else {
            synced++;
          }
        } catch (err) {
          this.logger.error(`Error processing document ${doc.document_id}:`, err);
          errors++;
        }
      }

      this.logger.log(`  ✅ Synced ${synced} documents for ${clientName}`);
    } catch (error) {
      this.logger.error(`Failed to sync documents for ${clientName}:`, error);
    }

    return { synced, errors };
  }

  /**
   * Generate embedding text for addressee
   */
  private generateAddresseeEmbeddingText(addressee: DatevAddressee): string {
    const parts: string[] = [];

    // Name with titles
    const titleParts: string[] = [];
    if (addressee.academic_title) titleParts.push(addressee.academic_title);
    if (addressee.noble_title) titleParts.push(addressee.noble_title);
    const nameWithTitle =
      titleParts.length > 0
        ? `${titleParts.join(' ')} ${addressee.full_name}`
        : addressee.full_name;

    parts.push(`Addressat: ${nameWithTitle}`);

    // Type
    const typeText = addressee.addressee_type === 1 ? 'Natürliche Person' : 'Juristische Person';
    parts.push(`(${typeText})`);

    // Gender/Salutation for natural persons
    if (addressee.addressee_type === 1 && addressee.gender) {
      const genderText =
        addressee.gender === 'M' ? 'männlich' : addressee.gender === 'F' ? 'weiblich' : '';
      if (genderText) parts.push(`- ${genderText}`);
    }

    // Company info for legal persons
    if (addressee.addressee_type === 2) {
      if (addressee.company_entity_type)
        parts.push(`- Rechtsform: ${addressee.company_entity_type}`);
      if (addressee.company_object)
        parts.push(`- Unternehmensgegenstand: ${addressee.company_object}`);
    }

    // Roles
    const roles: string[] = [];
    if (addressee.is_legal_representative_of_company) roles.push('Geschäftsführer');
    if (addressee.is_shareholder) roles.push('Gesellschafter');
    if (addressee.is_business_owner) roles.push('Betriebsinhaber');
    if (roles.length > 0) parts.push(`- Rolle: ${roles.join(', ')}`);

    // Contact
    if (addressee.main_email) parts.push(`- Email: ${addressee.main_email}`);
    if (addressee.main_phone) parts.push(`- Telefon: ${addressee.main_phone}`);

    // Location
    if (addressee.correspondence_city) {
      const address = [
        addressee.correspondence_street,
        addressee.correspondence_zip_code,
        addressee.correspondence_city,
      ]
        .filter(Boolean)
        .join(', ');
      parts.push(`- Standort: ${address}`);
    }

    // Age/Birth for natural persons
    if (addressee.addressee_type === 1 && addressee.age) {
      parts.push(`- Alter: ${addressee.age} Jahre`);
    }

    // Industry
    if (addressee.industry_description) {
      parts.push(`- Branche: ${addressee.industry_description}`);
    }

    return parts.join(' ');
  }

  /**
   * Generate enriched embedding text for client (includes addressee context)
   */
  private generateClientEmbeddingText(
    client: DatevClient,
    managingDirector?: DatevAddressee | null
  ): string {
    const parts: string[] = [];

    // Client name and number
    parts.push(`Mandant: ${client.client_name} (Mandantennummer: ${client.client_number})`);

    // Company form
    if (client.company_form) {
      parts.push(`- Rechtsform: ${client.company_form}`);
    }

    // Client type
    const typeDescriptions: Record<number, string> = {
      1: 'Natürliche Person',
      2: 'Einzelunternehmen',
      3: 'Juristische Person',
    };
    if (client.client_type) {
      parts.push(`- ${typeDescriptions[client.client_type]}`);
    }

    // Managing director (denormalized from addressee)
    if (managingDirector) {
      const directorParts: string[] = [managingDirector.full_name];
      if (managingDirector.main_email) directorParts.push(managingDirector.main_email);
      if (managingDirector.main_phone) directorParts.push(managingDirector.main_phone);
      parts.push(`- Geschäftsführer: ${directorParts.join(', ')}`);
    }

    // Industry
    if (client.industry_description) {
      parts.push(`- Branche: ${client.industry_description}`);
    }

    // Location
    if (client.correspondence_city) {
      const address = [
        client.correspondence_street,
        client.correspondence_zip_code,
        client.correspondence_city,
      ]
        .filter(Boolean)
        .join(', ');
      parts.push(`- Standort: ${address}`);
    }

    // Organization
    if (client.organization_name) {
      parts.push(`- Organisation: ${client.organization_name}`);
    }

    // Status and dates
    const statusText = client.status === 'aktiv' ? 'aktiv' : 'inaktiv';
    if (client.client_from) {
      parts.push(`- Status: ${statusText} seit ${client.client_from.split('T')[0]}`);
    } else {
      parts.push(`- Status: ${statusText}`);
    }

    return parts.join(' ');
  }

  /**
   * Generate embedding text for accounting posting
   */
  private generatePostingEmbeddingText(posting: DatevPosting): string {
    const parts: string[] = [];

    // Client and date
    parts.push(`Buchung für Mandant ${posting.client_name}`);
    parts.push(`- Datum: ${posting.date.split('T')[0]}`);

    // Account info
    const direction = posting.debit_credit_indicator === 'S' ? 'Soll' : 'Haben';
    parts.push(
      `- Konto ${posting.account_number}${posting.account_name ? ` (${posting.account_name})` : ''} → Konto ${posting.contra_account_number}`
    );
    parts.push(
      `- ${direction}: ${posting.amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${posting.currency_code}`
    );

    // Posting text
    if (posting.posting_description) {
      parts.push(`- Buchungstext: ${posting.posting_description}`);
    }

    // Document reference
    if (posting.document_field_1) {
      parts.push(`- Beleg: ${posting.document_field_1}`);
    }

    return parts.join(' ');
  }

  /**
   * Generate embedding text for SUSA entry
   */
  private generateSusaEmbeddingText(susa: DatevSusa, clientName: string): string {
    const parts: string[] = [];

    // Client and period
    const periodText = susa.month
      ? `Jahr ${susa.fiscal_year}, Monat ${susa.month.toString().padStart(2, '0')}`
      : `Jahr ${susa.fiscal_year} (Jahres-SUSA)`;
    parts.push(`Summen und Salden für ${clientName} - ${periodText}`);

    // Account
    parts.push(`- Konto ${susa.account_number}${susa.label ? ` (${susa.label})` : ''}`);

    // Calculate opening balance (closing - movements)
    const openingBalance = susa.balance - susa.current_month_debit + susa.current_month_credit;

    // Balances
    parts.push(`- Anfangsbestand: ${this.formatAmount(openingBalance)}`);
    parts.push(`- Zugänge (Soll): ${this.formatAmount(susa.debit_total)}`);
    parts.push(`- Abgänge (Haben): ${this.formatAmount(susa.credit_total)}`);
    parts.push(`- Endbestand: ${this.formatAmount(susa.balance)}`);

    // Transaction count
    parts.push(`- Anzahl Buchungen: ${susa.transaction_count}`);

    return parts.join(' ');
  }

  /**
   * Generate embedding text for document metadata
   */
  private generateDocumentEmbeddingText(doc: DatevDocument, clientName: string): string {
    const parts: string[] = [];

    // Document name and client
    const docName = doc.file_name || doc.description || `Dokument ${doc.document_number}`;
    parts.push(`Dokument für ${clientName}: ${docName}`);

    // Type
    if (doc.extension) {
      parts.push(`- Typ: ${doc.extension.toUpperCase()}`);
    }

    // Size
    if (doc.file_size_bytes) {
      const sizeMB = (doc.file_size_bytes / (1024 * 1024)).toFixed(2);
      parts.push(`- Größe: ${sizeMB} MB`);
    }

    // Date
    if (doc.import_date_time) {
      parts.push(`- Hochgeladen: ${doc.import_date_time.split('T')[0]}`);
    }

    // Year/Month
    if (doc.year) {
      const period = doc.month
        ? `${doc.year}-${doc.month.toString().padStart(2, '0')}`
        : `${doc.year}`;
      parts.push(`- Periode: ${period}`);
    }

    // Keywords/Tags
    if (doc.keywords) {
      parts.push(`- Schlagwörter: ${doc.keywords}`);
    }

    // Folder
    if (doc.folder_name) {
      parts.push(`- Ordner: ${doc.folder_name}`);
    }

    return parts.join(' ');
  }

  /**
   * Helper: Format amount for German locale
   */
  private formatAmount(amount: number): string {
    return `${amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`;
  }
}
