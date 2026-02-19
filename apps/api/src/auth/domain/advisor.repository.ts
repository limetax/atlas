import type { Advisor, AdvisorWithAdvisory } from './advisor.entity';

/**
 * Advisor Repository - Domain contract for advisor data access
 *
 * Abstract class (not interface) so it can be used directly as injection token.
 * No I-prefix following modern TypeScript conventions.
 */
export abstract class AdvisorRepository {
  /**
   * Find advisor by user ID
   * @param userId - User ID
   * @returns Advisor or null
   */
  abstract findById(userId: string): Promise<Advisor | null>;

  /**
   * Find advisor with advisory information
   * @param userId - User ID
   * @returns Advisor with advisory or null
   */
  abstract findByIdWithAdvisory(userId: string): Promise<AdvisorWithAdvisory | null>;
}
