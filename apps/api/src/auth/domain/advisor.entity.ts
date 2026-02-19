/**
 * Advisor Entity - Domain representation of an advisor
 *
 * This represents our business concept of an advisor,
 * independent of how it's stored in the database
 */
export type Advisor = {
  id: string;
  email: string | null;
  full_name: string | null;
  advisory_id: string | null;
  role: 'user' | 'admin';
  created_at: string;
  image_url: string | null;
};

/**
 * Advisor with Advisory - Extended advisor with advisory information
 */
export type AdvisorWithAdvisory = Advisor & {
  advisory: Advisory | null;
};

/**
 * Advisory Entity - Domain representation of an advisory firm
 */
export type Advisory = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};
