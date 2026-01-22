import type {
  User,
  AuthError as SupabaseAuthError,
} from "@supabase/supabase-js";
import type { Advisor, AdvisorWithAdvisory } from "@/types/database";

/**
 * Auth Service - Business logic for authentication (Client-side only)
 * Abstracts Supabase auth operations from the rest of the application
 *
 * Note: This service is for client-side use only.
 * For server-side auth, use auth.server.ts
 */

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface LogoutResult {
  success: boolean;
  error?: string;
}

/**
 * Translate Supabase auth errors to German user-friendly messages
 */
function translateAuthError(error: SupabaseAuthError): string {
  const errorMessages: Record<string, string> = {
    "Invalid login credentials":
      "Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort.",
    "Email not confirmed":
      "E-Mail-Adresse nicht bestätigt. Bitte überprüfen Sie Ihr Postfach.",
    "User not found": "Benutzer nicht gefunden.",
    "Invalid email": "Ungültige E-Mail-Adresse.",
    "Signup disabled":
      "Registrierung ist deaktiviert. Bitte kontaktieren Sie den Administrator.",
    "Email rate limit exceeded":
      "Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut.",
  };

  return errorMessages[error.message] || `Anmeldefehler: ${error.message}`;
}

/**
 * Auth Service class (Client-side)
 * Provides authentication operations for the application
 */
export class AuthService {
  /**
   * Sign in with email and password
   */
  async login(email: string, password: string): Promise<LoginResult> {
    const { getSupabaseBrowserClient } = await import(
      "@/lib/infrastructure/supabase.client"
    );
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: translateAuthError(error),
      };
    }

    return {
      success: true,
      user: data.user,
    };
  }

  /**
   * Sign out the current user
   */
  async logout(): Promise<LogoutResult> {
    const { getSupabaseBrowserClient } = await import(
      "@/lib/infrastructure/supabase.client"
    );
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: translateAuthError(error),
      };
    }

    return { success: true };
  }

  /**
   * Get the current authenticated user (client-side)
   */
  async getUser(): Promise<User | null> {
    const { getSupabaseBrowserClient } = await import(
      "@/lib/infrastructure/supabase.client"
    );
    const supabase = getSupabaseBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  }

  /**
   * Get the advisor profile for the current user (client-side)
   */
  async getAdvisor(): Promise<Advisor | null> {
    const user = await this.getUser();
    if (!user) return null;

    const { getSupabaseBrowserClient } = await import(
      "@/lib/infrastructure/supabase.client"
    );
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("advisors")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Get advisor error:", error);
      return null;
    }

    return data;
  }

  /**
   * Get the advisor profile with advisory info (client-side)
   */
  async getAdvisorWithAdvisory(): Promise<AdvisorWithAdvisory | null> {
    const user = await this.getUser();
    if (!user) return null;

    const { getSupabaseBrowserClient } = await import(
      "@/lib/infrastructure/supabase.client"
    );
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("advisors")
      .select(
        `
        *,
        advisory:advisories(*)
      `
      )
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Get advisor with advisory error:", error);
      return null;
    }

    return data as AdvisorWithAdvisory;
  }

  /**
   * Subscribe to auth state changes (client-side only)
   */
  onAuthStateChange(
    callback: (user: User | null) => void
  ): { unsubscribe: () => void } | null {
    const {
      getSupabaseBrowserClient,
    } = require("@/lib/infrastructure/supabase.client");
    const supabase = getSupabaseBrowserClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user: User } | null) => {
        callback(session?.user ?? null);
      }
    );

    return { unsubscribe: () => subscription.unsubscribe() };
  }
}

// Singleton instance
let authServiceInstance: AuthService | null = null;

export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
  }
  return authServiceInstance;
}
