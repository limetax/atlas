import type { User, Session } from '@supabase/supabase-js';

/**
 * Auth Adapter - Domain contract for authentication providers
 *
 * Abstract class (not interface) so it can be used directly as injection token.
 * No I-prefix following modern TypeScript conventions.
 */
export abstract class AuthAdapter {
  /**
   * Sign in with email and password
   * @param email - User email
   * @param password - User password
   * @returns User and session information
   */
  abstract signInWithPassword(
    email: string,
    password: string
  ): Promise<{
    user: User;
    session: Session;
  }>;

  /**
   * Get user by JWT token
   * @param token - JWT access token
   * @returns User information or null
   */
  abstract getUser(token: string): Promise<User | null>;

  /**
   * Sign out the current user
   */
  abstract signOut(): Promise<void>;

  /**
   * Refresh the session using a refresh token
   * @param refreshToken - Supabase refresh token
   * @returns New user and session information
   */
  abstract refreshSession(refreshToken: string): Promise<{
    user: User;
    session: Session;
  }>;
}
