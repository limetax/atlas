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

import { createContext, type ReactNode, useCallback, useContext } from 'react';

import { ROUTES, STORAGE_KEYS } from '@/constants';
import { useAuthToken } from '@/hooks/useAuthToken';
import { trpc } from '@/lib/trpc';
import type { Advisor } from '@atlas/shared';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useNavigate } from '@tanstack/react-router';

export type AuthContextValue = {
  user: SupabaseUser | null | undefined;
  advisor: Advisor | null | undefined;
  isLoading: boolean;
  getToken: () => string | null;
  setToken: (token: string) => void;
  removeToken: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const { removeToken: removeAuthToken, removeRefreshToken } = useAuthToken();

  const { data: user, isLoading: isUserLoading } = trpc.auth.getUser.useQuery();
  const { data: advisor } = trpc.auth.getAdvisor.useQuery(undefined, {
    enabled: !!user,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      removeAuthToken();
      removeRefreshToken();
      navigate({ to: ROUTES.LOGIN });
    },
  });

  const getToken = useCallback(() => localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN), []);

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
    getToken,
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
