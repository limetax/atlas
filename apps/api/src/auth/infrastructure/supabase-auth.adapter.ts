import { Injectable, Logger } from '@nestjs/common';
import type { User, Session } from '@supabase/supabase-js';
import { SupabaseService } from '@shared/infrastructure/supabase.service';
import { IAuthAdapter } from '@auth/domain/auth-adapter.interface';

/**
 * Supabase Auth Adapter - Infrastructure implementation for Supabase authentication
 * Implements IAuthAdapter interface using Supabase client
 */
@Injectable()
export class SupabaseAuthAdapter implements IAuthAdapter {
  private readonly logger = new Logger(SupabaseAuthAdapter.name);

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Sign in with email and password
   * @param email - User email
   * @param password - User password
   * @returns User and session information
   */
  async signInWithPassword(
    email: string,
    password: string
  ): Promise<{
    user: User;
    session: Session;
  }> {
    const { data, error } = await this.supabase.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
      this.logger.error('Supabase sign in error:', error);
      throw new Error(error?.message || 'Authentication failed');
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  /**
   * Get user by JWT token
   * @param token - JWT access token
   * @returns User information or null
   */
  async getUser(token: string): Promise<User | null> {
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.getUser(token);

      if (error) {
        this.logger.warn('Token validation failed:', error);
        return null;
      }

      return user;
    } catch (error) {
      this.logger.error('Get user error:', error);
      return null;
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    const { error } = await this.supabase.signOut();
    if (error) {
      this.logger.error('Sign out error:', error);
      throw new Error('Sign out failed');
    }
  }
}
