import { Injectable } from '@nestjs/common';
import type { User, Session } from '@supabase/supabase-js';
import { AuthAdapter } from '@auth/domain/auth.adapter';
import { AdvisorRepository } from '@auth/domain/advisor.repository';
import { type Advisor, type AdvisorWithAdvisory } from '@auth/domain/advisor.entity';

/**
 * Auth Service - Application layer for authentication business logic
 * Depends on domain interfaces, not concrete implementations
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly authAdapter: AuthAdapter,
    private readonly advisorRepository: AdvisorRepository
  ) {}

  /**
   * Sign in with email and password
   * @param email - User email
   * @param password - User password
   * @returns User, session, and token
   */
  async login(
    email: string,
    password: string
  ): Promise<{
    user: User;
    session: Session;
    token: string;
  }> {
    try {
      const { user, session } = await this.authAdapter.signInWithPassword(email, password);

      return {
        user,
        session,
        token: session.access_token,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(this.translateError(message));
    }
  }

  /**
   * Get advisor profile by user ID
   * @param userId - User ID
   * @returns Advisor or null
   */
  async getAdvisor(userId: string): Promise<Advisor | null> {
    return await this.advisorRepository.findById(userId);
  }

  /**
   * Get advisor with advisory info
   * @param userId - User ID
   * @returns Advisor with advisory or null
   */
  async getAdvisorWithAdvisory(userId: string): Promise<AdvisorWithAdvisory | null> {
    return await this.advisorRepository.findByIdWithAdvisory(userId);
  }

  /**
   * Get user by JWT token
   * @param token - JWT access token
   * @returns User or null
   */
  async getUserByToken(token: string): Promise<User | null> {
    return await this.authAdapter.getUser(token);
  }

  /**
   * Sign out the current user
   */
  async logout(): Promise<void> {
    await this.authAdapter.signOut();
  }

  /**
   * Translate auth errors to German
   * @param message - Error message
   * @returns Translated error message
   */
  private translateError(message: string): string {
    const errors: Record<string, string> = {
      'Invalid login credentials':
        'Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort.',
      'Email not confirmed': 'E-Mail-Adresse nicht bestätigt. Bitte überprüfen Sie Ihr Postfach.',
      'User not found': 'Benutzer nicht gefunden.',
      'Invalid email': 'Ungültige E-Mail-Adresse.',
      'Signup disabled': 'Registrierung ist deaktiviert. Bitte kontaktieren Sie den Administrator.',
      'Email rate limit exceeded':
        'Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut.',
    };
    return errors[message] || `Anmeldefehler: ${message}`;
  }
}
