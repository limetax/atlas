import axios, { type AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { isAfter, parseISO } from 'date-fns';

import {
  DatevAddressee,
  DatevAnalyticsExpenses,
  DatevAnalyticsFees,
  DatevAnalyticsOrderValues,
  DatevAnalyticsProcessingStatus,
  DatevClient,
  DatevClientService,
  DatevCorpTax,
  DatevDocument,
  DatevHrEmployee,
  DatevHrTransaction,
  DatevPosting,
  DatevRelationship,
  DatevSusa,
  DatevTradeTax,
  KlardatenAuthResponse,
} from '@atlas/shared';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Klardaten Client - HTTP client for Klardaten Gateway API
 * Uses axios with automatic retry logic for resilient API communication
 *
 * Environment Variables:
 * - KLARDATEN_EMAIL: Login email for Klardaten
 * - KLARDATEN_PASSWORD: Login password for Klardaten
 * - KLARDATEN_INSTANCE_ID: Client instance ID for API access
 *
 * Phase 1.1 Features:
 * - Axios HTTP client with exponential backoff retry
 * - 2025-01-01+ date filtering for all data
 * - Pagination for high-volume endpoints (postings)
 * - Comprehensive error handling with logging
 */

const KLARDATEN_BASE_URL = 'https://api.klardaten.com';
const DATE_FILTER_FROM = '2025-01-01'; // Only sync data from 2025 onwards

@Injectable()
export class KlardatenClient {
  private readonly logger = new Logger(KlardatenClient.name);
  private readonly httpClient: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private readonly instanceId: string;
  private readonly email: string;
  private readonly password: string;

  constructor() {
    // Load credentials from environment
    this.email = process.env.KLARDATEN_EMAIL ?? '';
    this.password = process.env.KLARDATEN_PASSWORD ?? '';
    this.instanceId = process.env.KLARDATEN_INSTANCE_ID ?? '';

    if (!this.email || !this.password || !this.instanceId) {
      this.logger.warn(
        '⚠️ Klardaten credentials not fully configured. Set KLARDATEN_EMAIL, KLARDATEN_PASSWORD, KLARDATEN_INSTANCE_ID'
      );
    }

    // Initialize axios client with retry logic
    this.httpClient = axios.create({
      baseURL: KLARDATEN_BASE_URL,
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Configure automatic retry with exponential backoff
    axiosRetry(this.httpClient, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        // Retry on network errors or 5xx server errors
        return (
          axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          (error.response?.status ?? 0) >= 500
        );
      },
      onRetry: (retryCount, error) => {
        this.logger.warn(`Retry attempt ${retryCount} for ${error.config?.url}: ${error.message}`);
      },
    });

    // Request interceptor for authentication
    this.httpClient.interceptors.request.use(
      async (config) => {
        // Skip auth for login endpoint
        if (config.url?.includes('/auth/login')) {
          return config;
        }

        // Ensure authenticated
        if (!this.isAuthenticated()) {
          await this.authenticate();
        }

        // Add auth headers
        config.headers.Authorization = `Bearer ${this.accessToken}`;
        config.headers['x-client-instance-id'] = this.instanceId;

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for logging
    this.httpClient.interceptors.response.use(
      (response) => {
        this.logger.debug(
          `✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`
        );
        return response;
      },
      (error) => {
        if (error.response) {
          this.logger.error(
            `❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response.status}: ${error.response.data}`
          );
        } else {
          this.logger.error(
            `❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.message}`
          );
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check if currently authenticated
   */
  isAuthenticated(): boolean {
    return this.accessToken !== null && Date.now() < this.tokenExpiresAt;
  }

  /**
   * Authenticate with Klardaten API using axios
   */
  async authenticate(): Promise<void> {
    if (this.isAuthenticated()) {
      this.logger.log('🔑 Already authenticated with Klardaten');
      return;
    }

    this.logger.log('🔐 Authenticating with Klardaten...');

    try {
      const response = await axios.post<KlardatenAuthResponse>(
        `${KLARDATEN_BASE_URL}/api/auth/login`,
        {
          email: this.email,
          password: this.password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const authData = response.data;
      this.accessToken = authData.access_token;
      // Set expiry with 60 second buffer
      this.tokenExpiresAt = Date.now() + (authData.access_token_expires_in - 60) * 1000;

      this.logger.log('✅ Authenticated with Klardaten');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Klardaten authentication failed: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`
        );
      }
      throw error;
    }
  }

  /**
   * Fetch all clients (Mandanten) from Klardaten API with pagination
   * Uses Klardaten /api/master-data/clients (NOT DATEVconnect)
   * Returns raw client data - will be transformed in sync service
   */
  async getClients(): Promise<DatevClient[]> {
    this.logger.log('📥 Fetching clients from Klardaten API with pagination...');

    try {
      const allClients: DatevClient[] = [];
      let skip = 0;
      const top = 100; // Page size

      while (true) {
        const page = Math.floor(skip / top) + 1;
        const response = await this.httpClient.get<DatevClient[]>('/api/master-data/clients', {
          params: {
            page: page,
            page_size: top,
          },
        });

        const batch = response.data;

        if (!batch || batch.length === 0) {
          break;
        }

        allClients.push(...batch);

        // If we got less than the page size, we're done
        if (batch.length < top) {
          break;
        }

        skip += top;
        this.logger.log(`  → Fetched ${skip} clients so far...`);
      }

      this.logger.log(`✅ Fetched ${allClients.length} total clients from Klardaten`);
      return allClients;
    } catch (error) {
      this.logger.error('Failed to fetch clients:', error);
      throw error;
    }
  }

  /**
   * Fetch all addressees from Klardaten API with pagination
   * Source: /api/master-data/addressees
   * Used for client enrichment (managing directors, contact persons)
   */
  async getAddressees(): Promise<DatevAddressee[]> {
    this.logger.log('📥 Fetching addressees from Klardaten API with pagination...');

    try {
      const allAddressees: DatevAddressee[] = [];
      let skip = 0;
      const top = 100; // Page size

      while (true) {
        const page = Math.floor(skip / top) + 1;
        const response = await this.httpClient.get<DatevAddressee[]>(
          '/api/master-data/addressees',
          {
            params: {
              page: page,
              page_size: top,
            },
          }
        );

        const batch = response.data;

        if (!batch || batch.length === 0) {
          break;
        }

        allAddressees.push(...batch);

        // If we got less than the page size, we're done
        if (batch.length < top) {
          break;
        }

        skip += top;
        this.logger.log(`  → Fetched ${skip} addressees so far...`);
      }

      this.logger.log(`✅ Fetched ${allAddressees.length} total addressees from Klardaten`);
      return allAddressees;
    } catch (error) {
      this.logger.error('Failed to fetch addressees:', error);
      throw error;
    }
  }

  /**
   * Fetch accounting postings for a specific client and fiscal year
   * Source: /api/accounting/postings
   * Filters: 2025-01-01+ only
   *
   * WARNING: High volume! Can be 10k-100k+ postings per client per year
   * Uses pagination to prevent memory issues
   */
  async getAccountingPostings(clientId: string, fiscalYear: number): Promise<DatevPosting[]> {
    this.logger.log(`📥 Fetching postings for client ${clientId}, year ${fiscalYear}...`);

    try {
      const allPostings: DatevPosting[] = [];
      let skip = 0;
      const top = 1000; // Page size

      while (true) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/98926b89-5c75-4f32-b935-5d5bdd473e40', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'klardaten.client.ts:230',
            message: 'Before API call',
            data: { clientId, fiscalYear, skip, top },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            hypothesisId: 'B,D',
          }),
        }).catch(() => {});
        // #endregion

        const response = await this.httpClient.get<DatevPosting[]>('/api/accounting/postings', {
          params: {
            clientId,
            fiscalYear,
            $skip: skip,
            $top: top,
          },
        });

        const batch = response.data;

        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/98926b89-5c75-4f32-b935-5d5bdd473e40', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'klardaten.client.ts:247',
            message: 'API response received',
            data: { batchSize: batch?.length ?? 0, isArray: Array.isArray(batch), fiscalYear },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            hypothesisId: 'D',
          }),
        }).catch(() => {});
        // #endregion

        // Filter by date (2025-01-01+)
        const filtered = batch.filter((posting) => {
          try {
            const postingDate = parseISO(posting.date);
            const cutoffDate = parseISO(DATE_FILTER_FROM);
            return (
              isAfter(postingDate, cutoffDate) || postingDate.getTime() === cutoffDate.getTime()
            );
          } catch {
            return false; // Skip invalid dates
          }
        });

        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/98926b89-5c75-4f32-b935-5d5bdd473e40', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'klardaten.client.ts:264',
            message: 'After date filtering',
            data: {
              originalCount: batch?.length ?? 0,
              filteredCount: filtered.length,
              filterDate: DATE_FILTER_FROM,
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            hypothesisId: 'A',
          }),
        }).catch(() => {});
        // #endregion

        allPostings.push(...filtered);

        // Check if more pages exist
        if (!batch || batch.length < top) {
          break;
        }

        skip += top;
        this.logger.debug(`  → Fetched ${skip} postings so far...`);
      }

      this.logger.log(`✅ Fetched ${allPostings.length} postings (filtered for 2025+)`);

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/98926b89-5c75-4f32-b935-5d5bdd473e40', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'klardaten.client.ts:278',
          message: 'getAccountingPostings SUCCESS',
          data: { totalPostings: allPostings.length, clientId, fiscalYear },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          hypothesisId: 'A,D',
        }),
      }).catch(() => {});
      // #endregion

      return allPostings;
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/98926b89-5c75-4f32-b935-5d5bdd473e40', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'klardaten.client.ts:286',
          message: 'getAccountingPostings ERROR',
          data: {
            error: error instanceof Error ? error.message : String(error),
            clientId,
            isAxiosError: axios.isAxiosError(error),
            statusCode: axios.isAxiosError(error) ? error.response?.status : null,
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          hypothesisId: 'B',
        }),
      }).catch(() => {});
      // #endregion

      // Handle 403 Forbidden gracefully - accounting API may not be available
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        this.logger.warn(
          `⚠️ Accounting postings API returned 403 Forbidden for client ${clientId} - endpoint may not be available in your Klardaten plan`
        );
        return []; // Return empty array instead of throwing
      }

      this.logger.error(`Failed to fetch postings for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch trial balance (SUSA) for a specific client and fiscal year
   * Source: /api/accounting/susa/monthly/{clientId}/{year}/{month}
   * Note: Can fetch annual or monthly SUSA
   */
  async getSusa(clientId: string, fiscalYear: number): Promise<DatevSusa[]> {
    this.logger.log(`📥 Fetching SUSA for client ${clientId}, year ${fiscalYear}...`);

    try {
      // Fetch monthly SUSA for all 12 months
      const allSusa: DatevSusa[] = [];

      for (let month = 1; month <= 12; month++) {
        try {
          const response = await this.httpClient.get<DatevSusa[]>(
            `/api/accounting/susa/monthly/${clientId}/${fiscalYear}/${month}`
          );

          if (response.data && Array.isArray(response.data)) {
            allSusa.push(...response.data);
          }
        } catch {
          // Month might not have data yet - continue
          this.logger.debug(`  → No SUSA data for month ${month}`);
        }
      }

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/98926b89-5c75-4f32-b935-5d5bdd473e40', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'klardaten.client.ts:318',
          message: 'getSusa result',
          data: { totalSusa: allSusa.length, clientId, fiscalYear },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          hypothesisId: 'D',
        }),
      }).catch(() => {});
      // #endregion

      this.logger.log(`✅ Fetched ${allSusa.length} SUSA entries`);
      return allSusa;
    } catch (error) {
      this.logger.error(`Failed to fetch SUSA for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch document metadata for a specific client
   * Source: /api/master-data/documents
   * Returns metadata only - actual files stored in S3 (Phase 1.2)
   */
  async getDocuments(clientId?: string): Promise<DatevDocument[]> {
    this.logger.log(`📥 Fetching documents${clientId ? ` for client ${clientId}` : ''}...`);

    try {
      const response = await this.httpClient.get<DatevDocument[]>('/api/master-data/documents', {
        params: clientId ? { clientId } : {},
      });

      const documents = response.data;

      // Filter by import date (2025-01-01+)
      const filtered = documents.filter((doc) => {
        if (!doc.import_date_time) return true; // Include docs without import date

        try {
          const importDate = parseISO(doc.import_date_time);
          const cutoffDate = parseISO(DATE_FILTER_FROM);
          return isAfter(importDate, cutoffDate) || importDate.getTime() === cutoffDate.getTime();
        } catch {
          return true; // Include on date parse errors
        }
      });

      this.logger.log(`✅ Fetched ${filtered.length} documents (filtered for 2025+)`);
      return filtered;
    } catch (error) {
      this.logger.error('Failed to fetch documents:', error);
      throw error;
    }
  }

  // ============================================
  // PHASE 1.2: Additional API Methods
  // ============================================

  /**
   * Fetch all relationships between addressees with pagination
   * Source: /api/master-data/relationships
   * Returns: Managing directors, partners, shareholders, etc.
   */
  async getRelationships(): Promise<DatevRelationship[]> {
    this.logger.log('📥 Fetching relationships from Klardaten API with pagination...');

    try {
      const allRelationships: DatevRelationship[] = [];
      let skip = 0;
      const top = 100; // Page size

      while (true) {
        const page = Math.floor(skip / top) + 1;
        const response = await this.httpClient.get<DatevRelationship[]>(
          '/api/master-data/relationships',
          {
            params: {
              page,
              page_size: top,
            },
          }
        );

        const batch = response.data;

        if (!batch || batch.length === 0) {
          break;
        }

        allRelationships.push(...batch);

        // If we got less than the page size, we're done
        if (batch.length < top) {
          break;
        }

        skip += top;
        if (skip % 500 === 0) {
          this.logger.log(`  → Fetched ${skip} relationships so far...`);
        }
      }

      this.logger.log(`✅ Fetched ${allRelationships.length} total relationships from Klardaten`);
      return allRelationships;
    } catch (error) {
      this.logger.error('Failed to fetch relationships:', error);
      throw error;
    }
  }

  /**
   * Fetch corporate tax returns with pagination
   * Source: /api/tax/corp-tax
   */
  async getCorpTax(year?: number): Promise<DatevCorpTax[]> {
    this.logger.log(
      `📥 Fetching corporate tax returns${year ? ` for ${year}` : ''} with pagination...`
    );

    try {
      const allCorpTax: DatevCorpTax[] = [];
      let skip = 0;
      const top = 100; // Page size

      while (true) {
        const page = Math.floor(skip / top) + 1;
        const response = await this.httpClient.get<DatevCorpTax[]>('/api/tax/corp-tax', {
          params: {
            page,
            page_size: top,
            ...(year ? { year } : {}),
          },
        });

        const batch = response.data;

        if (!batch || batch.length === 0) {
          break;
        }

        allCorpTax.push(...batch);

        // If we got less than the page size, we're done
        if (batch.length < top) {
          break;
        }

        skip += top;
        this.logger.log(`  → Fetched ${skip} corporate tax returns so far...`);
      }

      this.logger.log(`✅ Fetched ${allCorpTax.length} total corporate tax returns from Klardaten`);
      return allCorpTax;
    } catch (error) {
      this.logger.error('Failed to fetch corporate tax returns:', error);
      throw error;
    }
  }

  /**
   * Fetch trade tax returns with pagination
   * Source: /api/tax/trade-tax
   */
  async getTradeTax(year?: number): Promise<DatevTradeTax[]> {
    this.logger.log(
      `📥 Fetching trade tax returns${year ? ` for ${year}` : ''} with pagination...`
    );

    try {
      const allTradeTax: DatevTradeTax[] = [];
      let skip = 0;
      const top = 100; // Page size

      while (true) {
        const page = Math.floor(skip / top) + 1;
        const response = await this.httpClient.get<DatevTradeTax[]>('/api/tax/trade-tax', {
          params: {
            page,
            page_size: top,
            ...(year ? { year } : {}),
          },
        });

        const batch = response.data;

        if (!batch || batch.length === 0) {
          break;
        }

        allTradeTax.push(...batch);

        // If we got less than the page size, we're done
        if (batch.length < top) {
          break;
        }

        skip += top;
        this.logger.log(`  → Fetched ${skip} trade tax returns so far...`);
      }

      this.logger.log(`✅ Fetched ${allTradeTax.length} total trade tax returns from Klardaten`);
      return allTradeTax;
    } catch (error) {
      this.logger.error('Failed to fetch trade tax returns:', error);
      throw error;
    }
  }

  /**
   * Fetch analytics: order values
   * Source: /api/analytics/tax-advisory/order-values
   */
  async getAnalyticsOrderValues(year?: number): Promise<DatevAnalyticsOrderValues[]> {
    this.logger.log(`📥 Fetching analytics order values${year ? ` for ${year}` : ''}...`);

    try {
      const response = await this.httpClient.get<DatevAnalyticsOrderValues[]>(
        '/api/analytics/tax-advisory/order-values',
        {
          params: year ? { year } : {},
        }
      );

      const orderValues = response.data;
      this.logger.log(`✅ Fetched ${orderValues.length} order value records`);
      return orderValues;
    } catch (error) {
      this.logger.error('Failed to fetch analytics order values:', error);
      throw error;
    }
  }

  /**
   * Fetch analytics: processing status
   * Source: /api/analytics/tax-advisory/processing-status
   */
  async getAnalyticsProcessingStatus(year?: number): Promise<DatevAnalyticsProcessingStatus[]> {
    this.logger.log(`📥 Fetching analytics processing status${year ? ` for ${year}` : ''}...`);

    try {
      const response = await this.httpClient.get<DatevAnalyticsProcessingStatus[]>(
        '/api/analytics/tax-advisory/processing-status',
        {
          params: year ? { year } : {},
        }
      );

      const processingStatus = response.data;
      this.logger.log(`✅ Fetched ${processingStatus.length} processing status records`);
      return processingStatus;
    } catch (error) {
      this.logger.error('Failed to fetch analytics processing status:', error);
      throw error;
    }
  }

  /**
   * Fetch analytics: expenses
   * Source: /api/analytics/tax-advisory/expenses
   */
  async getAnalyticsExpenses(year?: number): Promise<DatevAnalyticsExpenses[]> {
    this.logger.log(`📥 Fetching analytics expenses${year ? ` for ${year}` : ''}...`);

    try {
      const response = await this.httpClient.get<DatevAnalyticsExpenses[]>(
        '/api/analytics/tax-advisory/expenses',
        {
          params: year ? { year } : {},
        }
      );

      const expenses = response.data;
      this.logger.log(`✅ Fetched ${expenses.length} expense records`);
      return expenses;
    } catch (error) {
      this.logger.error('Failed to fetch analytics expenses:', error);
      throw error;
    }
  }

  /**
   * Fetch analytics: fees
   * Source: /api/analytics/tax-advisory/fees
   */
  async getAnalyticsFees(year?: number): Promise<DatevAnalyticsFees[]> {
    this.logger.log(`📥 Fetching analytics fees${year ? ` for ${year}` : ''}...`);

    try {
      const response = await this.httpClient.get<DatevAnalyticsFees[]>(
        '/api/analytics/tax-advisory/fees',
        {
          params: year ? { year } : {},
        }
      );

      const fees = response.data;
      this.logger.log(`✅ Fetched ${fees.length} fee records`);
      return fees;
    } catch (error) {
      this.logger.error('Failed to fetch analytics fees:', error);
      throw error;
    }
  }

  /**
   * Fetch HR/LODAS employees for a specific client
   * Source: /api/hr-lodas/clients/{clientNumber}/employees
   */
  async getHrEmployees(clientNumber: number): Promise<DatevHrEmployee[]> {
    this.logger.log(`📥 Fetching HR employees for client ${clientNumber}...`);

    try {
      const response = await this.httpClient.get<DatevHrEmployee[]>(
        `/api/hr-lodas/clients/${clientNumber}/employees`
      );

      const employees = response.data;
      this.logger.log(`✅ Fetched ${employees.length} employees for client ${clientNumber}`);
      return employees;
    } catch (error) {
      this.logger.error(`Failed to fetch HR employees for client ${clientNumber}:`, error);
      throw error;
    }
  }

  /**
   * Fetch HR/LODAS payroll transactions for a specific client
   * Source: /api/hr-lodas/clients/{clientNumber}/transaction-data/standard
   */
  async getHrTransactions(clientNumber: number, year?: number): Promise<DatevHrTransaction[]> {
    this.logger.log(
      `📥 Fetching HR transactions for client ${clientNumber}${year ? ` year ${year}` : ''}...`
    );

    try {
      const response = await this.httpClient.get<DatevHrTransaction[]>(
        `/api/hr-lodas/clients/${clientNumber}/transaction-data/standard`,
        {
          params: year ? { year } : {},
        }
      );

      const transactions = response.data;

      // Filter by date (2025-01-01+)
      const filtered = transactions.filter((txn) => {
        if (!txn.transaction_date) return true;

        try {
          const txnDate = parseISO(txn.transaction_date);
          const cutoffDate = parseISO(DATE_FILTER_FROM);
          return isAfter(txnDate, cutoffDate) || txnDate.getTime() === cutoffDate.getTime();
        } catch {
          return true;
        }
      });

      this.logger.log(
        `✅ Fetched ${filtered.length} HR transactions for client ${clientNumber} (filtered for 2025+)`
      );
      return filtered;
    } catch (error) {
      this.logger.error(`Failed to fetch HR transactions for client ${clientNumber}:`, error);
      throw error;
    }
  }

  /**
   * Authenticated HTTP request scoped to the DATEVconnect DMS v2 API.
   * Prepends the DMS base path so callers only pass the resource path (e.g. `/documents`).
   * Keeps httpClient private while giving KlardatenDmsAdapter a typed entry point.
   */
  async dmsRequest<T>(
    method: 'GET',
    resourcePath: string,
    options?: {
      params?: Record<string, string>;
      responseType?: 'arraybuffer' | 'json';
      headers?: Record<string, string>;
    }
  ): Promise<T> {
    const response = await this.httpClient.request<T>({
      method,
      url: `${DMS_BASE}${resourcePath}`,
      params: options?.params,
      responseType: options?.responseType,
      headers: options?.headers,
    });
    return response.data;
  }

  /**
   * Fetch services enabled for a specific client
   * Source: /api/master-data/clients/{clientId}/services
   */
  async getClientServices(clientId: string): Promise<DatevClientService[]> {
    this.logger.log(`📥 Fetching services for client ${clientId}...`);

    try {
      const response = await this.httpClient.get<DatevClientService[]>(
        `/api/master-data/clients/${clientId}/services`
      );

      const services = response.data;
      this.logger.log(`✅ Fetched ${services.length} services for client ${clientId}`);
      return services;
    } catch (error) {
      this.logger.error(`Failed to fetch services for client ${clientId}:`, error);
      throw error;
    }
  }
}

const DMS_BASE = '/datevconnect/dms/v2';
