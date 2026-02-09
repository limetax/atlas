import { QueryClient } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';

function hasTrpcHttpStatus(error: TRPCClientError<unknown>, statuses: number[]): boolean {
  const data: unknown = error.data;
  if (typeof data === 'object' && data !== null && 'httpStatus' in data) {
    const { httpStatus } = data;
    return typeof httpStatus === 'number' && statuses.includes(httpStatus);
  }
  return false;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry auth errors — tRPC link already redirects on 401
        if (error instanceof TRPCClientError && hasTrpcHttpStatus(error, [401, 403])) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false, // Mutations should not retry automatically
    },
  },
});
