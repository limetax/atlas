import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../infrastructure/supabase.service';
import type { User } from '@supabase/supabase-js';
import type { Advisor, AdvisorWithAdvisory } from '@lime-gpt/shared';

/**
 * Auth Service - Business logic for authentication
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Sign in with email and password
   */
  async login(
    email: string,
    password: string
  ): Promise<{
    user: User;
    session: any;
    token: string;
  }> {
    const { data, error } = await this.supabase.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(this.translateError(error.message));
    }

    return {
      user: data.user,
      session: data.session,
      token: data.session.access_token,
    };
  }

  /**
   * Get advisor profile by user ID
   */
  async getAdvisor(userId: string): Promise<Advisor | null> {
    const { data, error } = await this.supabase.db
      .from('advisors')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      this.logger.error('Get advisor error:', error);
      return null;
    }

    return data;
  }

  /**
   * Get advisor with advisory info
   */
  async getAdvisorWithAdvisory(userId: string): Promise<AdvisorWithAdvisory | null> {
    const { data, error } = await this.supabase.db
      .from('advisors')
      .select(
        `
        *,
        advisory:advisories(*)
      `
      )
      .eq('id', userId)
      .single();

    if (error) {
      this.logger.error('Get advisor with advisory error:', error);
      return null;
    }

    return data as AdvisorWithAdvisory;
  }

  /**
   * Translate auth errors to German
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
