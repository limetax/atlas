import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';
import { router } from '@/router';
import { STORAGE_KEYS, ROUTES } from '@/constants';

const hasTrpcHttpStatus = (error: TRPCClientError<unknown>, statuses: number[]): boolean => {
  const data: unknown = error.data;
  if (typeof data === 'object' && data !== null && 'httpStatus' in data) {
    const { httpStatus } = data;
    return typeof httpStatus === 'number' && statuses.includes(httpStatus);
  }
  return false;
};

const isTrpcUnauthorized = (error: unknown): boolean =>
  error instanceof TRPCClientError && hasTrpcHttpStatus(error, [401]);

/**
 * Safety-net handler: if a 401 somehow bypasses the tRPC authErrorLink
 * (e.g. non-tRPC queries added in the future), redirect to login.
 */
const handleUnauthorized = (error: unknown): void => {
  if (isTrpcUnauthorized(error)) {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    router.navigate({ to: ROUTES.LOGIN, replace: true });
  }
};

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleUnauthorized,
  }),
  mutationCache: new MutationCache({
    onError: handleUnauthorized,
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry auth errors — authErrorLink already redirects on 401
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
