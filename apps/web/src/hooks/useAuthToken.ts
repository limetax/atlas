/**
 * useAuthToken Hook
 * Centralized token management with localStorage
 */

import { useCallback } from 'react';
import { STORAGE_KEYS } from '@/constants';
import { isTokenExpired } from '@/utils/validators';

export type UseAuthTokenReturn = {
  getToken: () => string | null;
  setToken: (token: string) => void;
  removeToken: () => void;
  setRefreshToken: (token: string) => void;
  removeRefreshToken: () => void;
  isExpired: () => boolean;
};

export function useAuthToken(): UseAuthTokenReturn {
  const getToken = useCallback(() => {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }, []);

  const setToken = useCallback((token: string) => {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }, []);

  const removeToken = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }, []);

  const setRefreshToken = useCallback((token: string) => {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  }, []);

  const removeRefreshToken = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }, []);

  const isExpired = useCallback(() => {
    const token = getToken();
    if (!token) return true;
    return isTokenExpired(token);
  }, [getToken]);

  return {
    getToken,
    setToken,
    removeToken,
    setRefreshToken,
    removeRefreshToken,
    isExpired,
  };
}
