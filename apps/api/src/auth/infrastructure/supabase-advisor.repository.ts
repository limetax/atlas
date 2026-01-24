import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '@shared/infrastructure/supabase.service';
import { IAdvisorRepository, Advisor, AdvisorWithAdvisory } from '@auth/domain/advisor.entity';

/**
 * Supabase Advisor Repository - Infrastructure implementation for advisor data access
 * Implements IAdvisorRepository interface using Supabase client
 */
@Injectable()
export class SupabaseAdvisorRepository implements IAdvisorRepository {
  private readonly logger = new Logger(SupabaseAdvisorRepository.name);

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Find advisor by user ID
   * @param userId - User ID
   * @returns Advisor or null
   */
  async findById(userId: string): Promise<Advisor | null> {
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
   * Find advisor with advisory information
   * @param userId - User ID
   * @returns Advisor with advisory or null
   */
  async findByIdWithAdvisory(userId: string): Promise<AdvisorWithAdvisory | null> {
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
}
