/**
 * Hook return types
 */

export interface UseAuthTokenReturn {
  getToken: () => string | null;
  setToken: (token: string) => void;
  removeToken: () => void;
  isExpired: () => boolean;
}

export interface UseLocalStorageReturn<T> {
  value: T;
  setValue: (value: T | ((val: T) => T)) => void;
  removeValue: () => void;
}
