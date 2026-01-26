import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@atlas/api/@generated';
import { env } from '@/config/env';
import { STORAGE_KEYS, API_ENDPOINTS, ROUTES } from '@/constants';

// Re-export for convenience
export type { AppRouter };

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: env.apiUrl + API_ENDPOINTS.TRPC,
      headers: () => {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
      // Handle 401 responses by clearing token and reloading page
      fetch(url, options) {
        return fetch(url, options).then(async (response) => {
          if (response.status === 401) {
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            window.location.href = ROUTES.LOGIN;
          }
          return response;
        });
      },
    }),
  ],
});
