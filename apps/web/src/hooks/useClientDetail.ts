import { trpc } from '@/lib/trpc';

export const useClientDetail = (clientId: string) => {
  const clientQuery = trpc.datev.getClient.useQuery({ clientId }, { staleTime: 5 * 60 * 1000 });

  return {
    client: clientQuery.data ?? null,
    isLoading: clientQuery.isLoading,
    isError: clientQuery.isError,
    error: clientQuery.error,
  };
};
