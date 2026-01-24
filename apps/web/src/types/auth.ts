/**
 * Authentication-related types
 */

import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Advisor } from '@atlas/shared';

export interface AuthState {
  user: SupabaseUser | null | undefined;
  advisor: Advisor | null | undefined;
  isLoading: boolean;
}

export interface AuthToken {
  token: string;
  expiresAt: number;
}
