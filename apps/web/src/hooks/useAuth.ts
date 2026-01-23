/**
 * useAuth Hook
 * Centralized authentication state management
 * This hook consolidates user and advisor queries in one place
 */

import { trpc } from '@/lib/trpc';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Advisor } from '@lime-gpt/shared';

export interface UseAuthReturn {
  user: SupabaseUser | null | undefined;
  advisor: Advisor | null | undefined;
  isLoading: boolean;
}

export function useAuth(): UseAuthReturn {
  const { data: user, isLoading: userLoading } = trpc.auth.getUser.useQuery();
  const { data: advisor } = trpc.auth.getAdvisor.useQuery(undefined, {
    enabled: !!user,
  });

  return {
    user,
    advisor,
    isLoading: userLoading,
  };
}
