import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Supabase Browser Client - Infrastructure layer for client-side Supabase access
 * Uses singleton pattern for consistent client instance across the app
 *
 * Self-hosted Supabase at: supabase.limetax.de
 */

let supabaseClientInstance: SupabaseClient<Database> | null = null;

/**
 * Get the Supabase browser client (singleton)
 * Use this in client components for auth state and data fetching
 */
export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  supabaseClientInstance = createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  );

  return supabaseClientInstance;
}

/**
 * Create a fresh Supabase browser client
 * Use this when you need a new client instance (e.g., for testing)
 */
export function createSupabaseBrowserClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
