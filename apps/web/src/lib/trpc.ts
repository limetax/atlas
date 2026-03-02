import { createTRPCReact, createTRPCClient } from '@trpc/react-query';
import { httpBatchLink, type TRPCLink, TRPCClientError } from '@trpc/client';
import { observable } from '@trpc/server/observable';
import type { AppRouter } from '@atlas/api/@generated';
import { env } from '@/config/env';
import { router } from '@/router';
import { STORAGE_KEYS, API_ENDPOINTS, ROUTES } from '@/constants';

// Re-export for convenience
export type { AppRouter };

/**
 * Vanilla tRPC client for use outside the React tree (route guards, authErrorLink).
 * Does not include the authErrorLink to avoid circular refresh loops.
 */
export const trpcVanilla = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: env.apiUrl + API_ENDPOINTS.TRPC,
      headers: () => {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});

/**
 * In-flight refresh promise — shared across concurrent 401s so only one
 * refresh request is made to Supabase regardless of how many calls failed.
 */
let refreshPromise: Promise<void> | null = null;

/**
 * Exchanges the stored refresh token for a new access/refresh token pair.
 * Concurrent callers share the same in-flight promise (deduplication).
 * Throws if no refresh token is stored or if Supabase rejects the token.
 */
export const refreshTokens = (): Promise<void> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) throw new Error('No refresh token available');

    const result = await trpcVanilla.auth.refresh.mutate({ refreshToken });
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, result.token);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, result.refreshToken);
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

/**
 * Type guard to check if an error is a tRPC UNAUTHORIZED error.
 * Checks both the tRPC error code and HTTP status for completeness.
 */
export const isTrpcUnauthorized = (error: unknown): error is TRPCClientError<AppRouter> => {
  if (!(error instanceof TRPCClientError)) {
    return false;
  }
  // Check tRPC error code (primary check)
  if (error.data?.code === 'UNAUTHORIZED') {
    return true;
  }
  // Fallback: check HTTP status (for edge cases where code isn't set)
  const data = error.data as Record<string, unknown> | undefined;
  return data?.httpStatus === 401;
};

/**
 * Checks if we're already on the login page to prevent duplicate navigations.
 * More robust than a timeout-based flag since it checks actual router state.
 */
const isOnLoginPage = (): boolean => router.state.location.pathname === ROUTES.LOGIN;

/**
 * Custom tRPC link that intercepts UNAUTHORIZED errors. Attempts a silent
 * token refresh before falling back to navigating to the login page.
 * Preserves React state (draft messages, form data) by avoiding full page reload.
 */
const authErrorLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      // Mutable ref so the cleanup always cancels whichever subscription is
      // currently active — the original request or the post-refresh retry.
      let currentUnsubscribe = next(op).subscribe({
        next(value) {
          observer.next(value);
        },
        error(err) {
          if (isTrpcUnauthorized(err) && !isOnLoginPage()) {
            refreshTokens()
              .then(() => {
                currentUnsubscribe = next(op).subscribe(observer);
              })
              .catch(() => {
                localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
                localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
                router.navigate({ to: ROUTES.LOGIN, replace: true });
                observer.error(err);
              });
          } else {
            observer.error(err);
          }
        },
        complete() {
          observer.complete();
        },
      });
      return () => currentUnsubscribe.unsubscribe();
    });
  };
};

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    authErrorLink,
    httpBatchLink({
      url: env.apiUrl + API_ENDPOINTS.TRPC,
      headers: () => {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});
