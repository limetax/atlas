import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, splitLink, unstable_httpSubscriptionLink } from '@trpc/client';
import type { AppRouterType } from '../../../api/src/app.router';
import { env } from '@/config/env';
import { STORAGE_KEYS, API_ENDPOINTS, ROUTES } from '@/constants';

// Import the actual router type from backend
export type AppRouter = AppRouterType;

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    splitLink({
      condition: (op) => op.type === 'subscription',
      // Use subscription link for subscriptions
      true: unstable_httpSubscriptionLink({
        url: env.apiUrl + API_ENDPOINTS.TRPC,
        connectionParams: () => {
          const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
      // Use batch link for queries and mutations
      false: httpBatchLink({
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
    }),
  ],
});
