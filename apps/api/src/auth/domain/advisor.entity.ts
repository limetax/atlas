/**
 * Advisor Entity - Domain representation of an advisor
 *
 * This represents our business concept of an advisor,
 * independent of how it's stored in the database
 */
export interface Advisor {
  id: string;
  email: string | null;
  full_name: string | null;
  advisory_id: string | null;
  role: 'user' | 'admin';
  created_at: string;
}

/**
 * Advisor with Advisory - Extended advisor with advisory information
 */
export interface AdvisorWithAdvisory extends Advisor {
  advisory: Advisory | null;
}

/**
 * Advisory Entity - Domain representation of an advisory firm
 */
export interface Advisory {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

/**
 * Advisor Repository - Domain contract for advisor data access
 *
 * Abstract class (not interface) so it can be used directly as injection token
 */
export abstract class IAdvisorRepository {
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
