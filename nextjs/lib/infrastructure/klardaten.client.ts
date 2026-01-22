/**
 * Klardaten Client - DATEV Adapter Implementation
 *
 * Implements IDATEVAdapter using Klardaten Gateway to access DATEV data.
 * Handles authentication, client fetching, and order fetching via DATEVconnect proxy.
 *
 * Environment Variables:
 * - KLARDATEN_EMAIL: Login email for Klardaten
 * - KLARDATEN_PASSWORD: Login password for Klardaten
 * - KLARDATEN_INSTANCE_ID: Client instance ID for DATEVconnect
 */

import { IDATEVAdapter } from "@/lib/adapters/datev.adapter";
import { DatevClient, DatevOrder, KlardatenAuthResponse } from "@/types/datev";

/**
 * Raw client response from DATEV Master Data API
 * Field names differ from our internal DatevClient type
 */
interface DatevClientApiResponse {
  id: string;
  number: number;
  name: string;
  differing_name?: string;
  type: "natural_person" | "individual_enterprise" | "legal_person";
  status: "active" | "inactive";
  client_since?: string;
  client_to?: string;
  legal_person_id?: string;
  natural_person_id?: string;
  organization_id?: string;
  organization_name?: string;
  organization_number?: number;
  establishment_id?: string;
  establishment_name?: string;
  establishment_number?: number;
  establishment_short_name?: string;
  functional_area_id?: string;
  functional_area_name?: string;
  functional_area_short_name?: string;
  timestamp?: string;
}

/**
 * Map DATEV API client type to our internal type
 */
function mapClientType(type: string): 1 | 2 | 3 {
  switch (type) {
    case "natural_person":
      return 1;
    case "individual_enterprise":
      return 2;
    case "legal_person":
      return 3;
    default:
      return 3; // Default to legal person
  }
}

/**
 * Transform raw DATEV API response to our internal DatevClient type
 */
function transformClient(raw: DatevClientApiResponse): DatevClient {
  return {
    client_id: raw.id,
    client_number: raw.number,
    client_name: raw.name,
    differing_name: raw.differing_name,
    client_type: mapClientType(raw.type),
    client_status: raw.status === "active" ? "1" : "0",
    status: raw.status === "active" ? "aktiv" : "inaktiv",
    client_from: raw.client_since,
    client_until: raw.client_to,
    updated_at: raw.timestamp,
  };
}

const KLARDATEN_BASE_URL = "https://api.klardaten.com";

/**
 * Klardaten Adapter - Fetches DATEV data via Klardaten Gateway
 */
export class KlardatenAdapter implements IDATEVAdapter {
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private instanceId: string;
  private email: string;
  private password: string;

  constructor() {
    // Load credentials from environment
    this.email = process.env.KLARDATEN_EMAIL ?? "";
    this.password = process.env.KLARDATEN_PASSWORD ?? "";
    this.instanceId = process.env.KLARDATEN_INSTANCE_ID ?? "";

    if (!this.email || !this.password || !this.instanceId) {
      console.warn(
        "⚠️ Klardaten credentials not fully configured. Set KLARDATEN_EMAIL, KLARDATEN_PASSWORD, KLARDATEN_INSTANCE_ID"
      );
    }
  }

  getAdapterName(): string {
    return "KlardatenAdapter";
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null && Date.now() < this.tokenExpiresAt;
  }

  /**
   * Authenticate with Klardaten API
   */
  async authenticate(): Promise<void> {
    if (this.isAuthenticated()) {
      console.log("🔑 Already authenticated with Klardaten");
      return;
    }

    console.log("🔐 Authenticating with Klardaten...");

    const response = await fetch(`${KLARDATEN_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: this.email,
        password: this.password,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Klardaten authentication failed: ${response.status} - ${errorText}`
      );
    }

    const authData: KlardatenAuthResponse = await response.json();
    this.accessToken = authData.access_token;
    // Set expiry with 60 second buffer
    this.tokenExpiresAt =
      Date.now() + (authData.access_token_expires_in - 60) * 1000;

    console.log("✅ Authenticated with Klardaten");
  }

  /**
   * Make an authenticated request to Klardaten/DATEVconnect
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.isAuthenticated()) {
      await this.authenticate();
    }

    const url = `${KLARDATEN_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this.accessToken}`,
        "x-client-instance-id": this.instanceId,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Klardaten request failed: ${response.status} - ${errorText}`
      );
    }

    return response.json();
  }

  /**
   * Fetch all clients (Mandanten) from DATEV via Klardaten
   * Uses DATEVconnect Master Data V1 API
   * Note: DATEV API returns all clients in one response (no pagination params)
   */
  async getClients(): Promise<DatevClient[]> {
    console.log("📥 Fetching clients from DATEV via Klardaten...");

    const endpoint = `/datevconnect/master-data/v1/clients`;
    const rawClients = await this.makeRequest<DatevClientApiResponse[]>(
      endpoint
    );

    const clients = rawClients.map(transformClient);
    console.log(`✅ Fetched ${clients.length} clients from DATEV`);
    return clients;
  }

  /**
   * Fetch orders (Aufträge) for a specific year from DATEV via Klardaten
   * Uses the DATEVconnect order-management API
   */
  async getOrders(year: number): Promise<DatevOrder[]> {
    console.log(
      `📥 Fetching orders for year ${year} from DATEV via Klardaten...`
    );

    const allOrders: DatevOrder[] = [];
    let skip = 0;
    const top = 100;
    let hasMore = true;

    while (hasMore) {
      // DATEVconnect Order Management V1 proxy endpoint
      const endpoint = `/datevconnect/order-management/v1/orders?filter=creation_year eq ${year}&top=${top}&skip=${skip}`;
      const response = await this.makeRequest<DatevOrder[]>(endpoint);

      if (Array.isArray(response)) {
        allOrders.push(...response);
        hasMore = response.length === top;
        skip += top;
      } else {
        hasMore = false;
      }
    }

    console.log(`✅ Fetched ${allOrders.length} orders for year ${year}`);
    return allOrders;
  }
}

// ============================================
// Singleton and Factory
// ============================================

let klardatenAdapterInstance: KlardatenAdapter | null = null;

/**
 * Get the singleton Klardaten adapter instance
 */
export function getKlardatenAdapter(): KlardatenAdapter {
  if (!klardatenAdapterInstance) {
    klardatenAdapterInstance = new KlardatenAdapter();
  }
  return klardatenAdapterInstance;
}
