/**
 * AuthContext
 * Centralized authentication state and token management.
 *
 * Combines user/advisor data (via tRPC queries) with token lifecycle
 * (localStorage) into a single context. All components that need auth
 * state should consume this context via useAuthContext().
 *
 * Note: Route-level auth guards (beforeLoad) still read localStorage
 * directly since they run outside the React tree.
 */

import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { trpc } from '@/lib/trpc';
import { STORAGE_KEYS, ROUTES } from '@/constants';
import { isTokenExpired } from '@/utils/validators';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Advisor } from '@atlas/shared';

export type AuthContextValue = {
  user: SupabaseUser | null | undefined;
  advisor: Advisor | null | undefined;
  isLoading: boolean;
  setToken: (token: string) => void;
  removeToken: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();

  const { data: user, isLoading: isUserLoading } = trpc.auth.getUser.useQuery();
  const { data: advisor } = trpc.auth.getAdvisor.useQuery(undefined, {
    enabled: !!user,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      navigate({ to: ROUTES.LOGIN });
    },
  });

  const setToken = useCallback((token: string) => {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }, []);

  const removeToken = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }, []);

  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  const value: AuthContextValue = {
    user,
    advisor,
    isLoading: isUserLoading,
    setToken,
    removeToken,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
