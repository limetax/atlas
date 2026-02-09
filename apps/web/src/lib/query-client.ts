import { QueryClient } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry auth errors — tRPC link already redirects on 401
        if (error instanceof TRPCClientError) {
          const httpStatus = (error.data as { httpStatus?: number } | undefined)?.httpStatus;
          if (httpStatus === 401 || httpStatus === 403) return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false, // Mutations should not retry automatically
    },
  },
});
