/**
 * useAssistants Hook
 * Centralized assistant data management
 * Provides access to assistant list and individual assistant lookup
 *
 * Note: Assistant type should match PublicAssistant from backend assistant.router.ts
 * Once tRPC types flow correctly, this can use inferRouterOutputs
 */

import { trpc } from '@/lib/trpc';

// Matches PublicAssistant from apps/api/src/assistant/assistant.router.ts
export interface Assistant {
  id: string;
  name: string;
  description: string;
  icon: string;
  isBuiltIn: boolean;
}

export const useAssistants = () => {
  const { data: assistants, isLoading } = trpc.assistant.list.useQuery();

  return {
    assistants,
    isLoading,
  };
};

/**
 * Hook for fetching a single assistant by ID
 * Uses the list query and filters - efficient due to React Query caching
 */
export const useAssistant = (assistantId: string | undefined) => {
  const { data: assistant, isLoading } = trpc.assistant.get.useQuery(
    { id: assistantId! },
    { enabled: !!assistantId }
  );

  return {
    assistant,
    isLoading,
  };
};
