import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '@shared/infrastructure/supabase.service';
import type { Advisor, AdvisorWithAdvisory } from '@auth/domain/advisor.entity';
import { AdvisorRepository } from '@auth/domain/advisor.repository';

/**
 * Supabase Advisor Repository - Infrastructure implementation for advisor data access
 * Extends AdvisorRepository using Supabase client
 */
@Injectable()
export class SupabaseAdvisorRepository extends AdvisorRepository {
  private readonly logger = new Logger(SupabaseAdvisorRepository.name);

  constructor(private readonly supabase: SupabaseService) {
    super();
  }

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
