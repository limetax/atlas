import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, splitLink, unstable_httpSubscriptionLink } from '@trpc/client';
import type { AppRouterType } from '../../../api/src/app.router';

// Import the actual router type from backend
export type AppRouter = AppRouterType;

export const trpc = createTRPCReact<AppRouter>();

// Get API URL from environment
const getApiUrl = (): string => {
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
};

export const trpcClient = trpc.createClient({
  links: [
    splitLink({
      condition: (op) => op.type === 'subscription',
      // Use subscription link for subscriptions
      true: unstable_httpSubscriptionLink({
        url: getApiUrl() + '/api/trpc',
        connectionParams: () => {
          const token = localStorage.getItem('supabase_token');
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
      // Use batch link for queries and mutations
      false: httpBatchLink({
        url: getApiUrl() + '/api/trpc',
        headers: () => {
          const token = localStorage.getItem('supabase_token');
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    }),
  ],
});
