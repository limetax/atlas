import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, type TRPCLink } from '@trpc/client';
import { observable } from '@trpc/server/observable';
import type { AppRouter } from '@atlas/api/@generated';
import { env } from '@/config/env';
import { router } from '@/router';
import { STORAGE_KEYS, API_ENDPOINTS, ROUTES } from '@/constants';

// Re-export for convenience
export type { AppRouter };

/**
 * Prevents multiple concurrent 401 responses (common with httpBatchLink)
 * from triggering repeated navigations.
 */
let isRedirecting = false;

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
          if (err?.data?.code === 'UNAUTHORIZED' && !isRedirecting) {
            isRedirecting = true;
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            router.navigate({ to: ROUTES.LOGIN, replace: true });
            setTimeout(() => {
              isRedirecting = false;
            }, 1000);
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
