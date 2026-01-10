import type { User } from "@supabase/supabase-js";
import type { Advisor } from "@/types/database";
import { createSupabaseServerClient } from "@/lib/infrastructure/supabase.server";

/**
 * Auth Server Service - Server-side authentication operations
 * Use this in Server Components, Route Handlers, and Server Actions
 */

/**
 * Get the current authenticated user (server-side)
 */
export async function getServerUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * Get the advisor profile for the current user (server-side)
 */
export async function getServerAdvisor(): Promise<Advisor | null> {
  const user = await getServerUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("advisors")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Get server advisor error:", error);
    return null;
  }

  return data;
}

/**
 * Check if the current request is authenticated (server-side)
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getServerUser();
  return user !== null;
}
