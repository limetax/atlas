import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@atlas/shared';

/**
 * Supabase Service - Infrastructure layer for Supabase access
 *
 * Two isolated clients prevent session pollution:
 * - serviceClient: storage, DB queries, token validation — always uses service_role key
 * - authClient: signInWithPassword/signOut — stores user sessions in memory,
 *   which would override the Authorization header on the service client
 *
 * @see https://supabase.com/docs/guides/troubleshooting/why-is-my-service-role-key-client-getting-rls-errors-or-not-returning-data-7_1K9z
 */
@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private serviceClient!: SupabaseClient<Database>;
  private authClient!: SupabaseClient<Database>;

  onModuleInit() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required'
      );
    }

    // Service role client — storage, DB, token validation
    // accessToken callback guarantees the service_role key is always used,
    // preventing _getAccessToken() from falling back to a cached user session.
    this.serviceClient = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: { schema: 'public' },
      global: { headers: { apikey: supabaseKey } },
      accessToken: async () => supabaseKey,
    });

    // Auth-only client — signInWithPassword saves user sessions in memory,
    // so it must be isolated from the service client.
    this.authClient = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: { schema: 'public' },
      global: { headers: { apikey: supabaseKey } },
    });

    this.logger.log('Supabase clients initialized (service-role + auth)');
  }

  /** Service role client — for storage, DB queries, and token validation */
  get db() {
    return this.serviceClient;
  }

  /** Validate a user JWT — uses authClient since accessToken option disables auth.getUser on serviceClient */
  async getUser(token: string) {
    return this.authClient.auth.getUser(token);
  }

  /** Sign in — isolated to authClient to prevent session pollution */
  async signInWithPassword(credentials: { email: string; password: string }) {
    return this.authClient.auth.signInWithPassword(credentials);
  }

  /** Sign out — isolated to authClient */
  async signOut() {
    return this.authClient.auth.signOut();
  }
}
