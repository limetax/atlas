import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@atlas/shared';

/**
 * Supabase Service - Infrastructure layer for Supabase access
 * Server-side only with service role key
 */
@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private client!: SupabaseClient<Database>;

  onModuleInit() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required'
      );
    }

    // Initialize with service role key (server-side only)
    this.client = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.logger.log('✅ Supabase client initialized');
  }

  // Expose Supabase database client
  get db() {
    return this.client;
  }

  // Auth methods
  async getUser(token: string) {
    return this.client.auth.getUser(token);
  }

  async signInWithPassword(credentials: { email: string; password: string }) {
    return this.client.auth.signInWithPassword(credentials);
  }

  async signOut() {
    return this.client.auth.signOut();
  }
}
