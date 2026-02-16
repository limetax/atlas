import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, type TRPCLink, TRPCClientError } from '@trpc/client';
import { observable } from '@trpc/server/observable';
import type { AppRouter } from '@atlas/api/@generated';
import { env } from '@/config/env';
import { router } from '@/router';
import { STORAGE_KEYS, API_ENDPOINTS, ROUTES } from '@/constants';

// Re-export for convenience
export type { AppRouter };

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
 * Custom tRPC link that intercepts UNAUTHORIZED errors and navigates
 * to the login page using TanStack Router instead of window.location.href.
 * Preserves React state (draft messages, form data) by avoiding full page reload.
 */
const authErrorLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      const unsubscribe = next(op).subscribe({
        next(value) {
          observer.next(value);
        },
        error(err) {
          observer.error(err);
          if (isTrpcUnauthorized(err) && !isOnLoginPage()) {
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            router.navigate({ to: ROUTES.LOGIN, replace: true });
          }
        },
        complete() {
          observer.complete();
        },
      });
      return unsubscribe;
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
