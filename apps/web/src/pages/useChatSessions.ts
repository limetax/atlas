/**
 * useChatSessions Hook
 * Manages chat sessions via tRPC (server-side persistence)
 *
 * Architecture:
 * - Server state (sessions, messages) → TanStack Query is the single source of truth
 * - Streaming state (optimistic messages during SSE) → local useState overlay
 * - Final messages = streaming overlay when active, otherwise query data
 * - NO useEffect syncing — eliminates race conditions entirely
 */

import { useState, useCallback, useMemo } from 'react';
import { ChatSession, Message, ChatContext, ChatMessageMetadata } from '@atlas/shared';
import { trpc } from '@/lib/trpc';
import { logger } from '@/utils/logger';

export type UseChatSessionsReturn = {
  sessions: ChatSession[];
  currentSessionId: string | undefined;
  currentSession: ChatSession | undefined;
  messages: Message[];
  isLoadingSessions: boolean;
  isFetchingSessions: boolean;
  isLoadingMessages: boolean;
  handleNewChat: () => void;
  handleSessionSelect: (sessionId: string) => void;
  handleDeleteSession: (sessionId: string) => void;
  updateCurrentSessionMessages: (messages: Message[]) => void;
  clearStreamingMessages: () => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  updateSessionContext: (sessionId: string, context: ChatContext) => void;
  getSessionById: (sessionId: string) => ChatSession | undefined;
  setCurrentSessionById: (sessionId: string) => void;
  setCurrentSessionId: (sessionId: string | undefined) => void;
  invalidateAfterStream: (chatIdOverride?: string, finalMessages?: Message[]) => void;
};

/**
 * Maps a server chat to the ChatSession shape used by the UI.
 */
function mapServerChatToSession(chat: {
  id: string;
  title: string;
  context: ChatContext;
  createdAt: string;
  updatedAt: string;
}): ChatSession {
  return {
    id: chat.id,
    title: chat.title,
    messages: [],
    createdAt: new Date(chat.createdAt),
    updatedAt: new Date(chat.updatedAt),
    context: chat.context,
  };
}

/**
 * Maps a server persisted message to the UI Message shape.
 * Restores toolCalls from the metadata JSONB column so they survive page reload.
 */
function mapPersistedToMessage(msg: {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata: ChatMessageMetadata;
  createdAt: string;
}): Message {
  return {
    id: msg.id,
    role: msg.role,
    content: msg.content,
    toolCalls: msg.metadata?.toolCalls,
    timestamp: msg.createdAt,
  };
}

export function useChatSessions(): UseChatSessionsReturn {
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();

  // Streaming overlay: non-null only during active SSE streaming.
  // When set, overrides query data for display. Set to null to fall back to query data.
  const [streamingMessages, setStreamingMessages] = useState<Message[] | null>(null);

  const utils = trpc.useUtils();

  // ─── Server State (TanStack Query = single source of truth) ────────────

  const sessionsQuery = trpc.chat.listChats.useQuery(undefined, {
    staleTime: 30_000,
  });

  const sessions: ChatSession[] = useMemo(
    () => (sessionsQuery.data ?? []).map(mapServerChatToSession),
    [sessionsQuery.data]
  );

  const messagesQuery = trpc.chat.getChatMessages.useQuery(
    { chatId: currentSessionId! },
    { enabled: !!currentSessionId, staleTime: 10_000 }
  );

  // ─── Derived State (no useEffect, no sync) ────────────────────────────

  const serverMessages = useMemo(
    () => (messagesQuery.data ?? []).map(mapPersistedToMessage),
    [messagesQuery.data]
  );

  // Streaming overlay takes precedence; otherwise query data is the source of truth.
  // When currentSessionId is undefined (new chat mode), both are empty → empty array.
  const messages: Message[] = currentSessionId
    ? (streamingMessages ?? serverMessages)
    : (streamingMessages ?? []);

  const currentSession = useMemo(
    () => sessions.find((s) => s.id === currentSessionId),
    [sessions, currentSessionId]
  );

  // ─── Mutations ─────────────────────────────────────────────────────────

  const deleteChatMutation = trpc.chat.deleteChat.useMutation({
    onSuccess: () => utils.chat.listChats.invalidate(),
    onError: (error) => logger.error('Failed to delete chat:', error),
  });
  const updateTitleMutation = trpc.chat.updateChatTitle.useMutation({
    onSuccess: () => utils.chat.listChats.invalidate(),
    onError: (error) => logger.error('Failed to update chat title:', error),
  });
  const updateContextMutation = trpc.chat.updateChatContext.useMutation({
    onSuccess: () => utils.chat.listChats.invalidate(),
    onError: (error) => logger.error('Failed to update chat context:', error),
  });

  // ─── Actions ───────────────────────────────────────────────────────────

  // New chat: clear selection. No DB call — chat is created lazily on first message.
  const handleNewChat = useCallback(() => {
    setCurrentSessionId(undefined);
    setStreamingMessages(null);
  }, []);

  const handleSessionSelect = useCallback(
    (sessionId: string) => {
      if (sessionId === currentSessionId) return;
      setCurrentSessionId(sessionId);
      setStreamingMessages(null);
    },
    [currentSessionId]
  );

  const handleDeleteSession = useCallback(
    (sessionId: string) => {
      deleteChatMutation.mutate({ chatId: sessionId });

      if (currentSessionId === sessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId);
        setCurrentSessionId(remaining.length > 0 ? remaining[0].id : undefined);
        setStreamingMessages(null);
      }
    },
    [currentSessionId, sessions, deleteChatMutation]
  );

  // Set streaming messages overlay (called during SSE streaming for optimistic UI)
  const updateCurrentSessionMessages = useCallback((newMessages: Message[]) => {
    setStreamingMessages(newMessages);
  }, []);

  // Clear streaming overlay — query data becomes visible again
  const clearStreamingMessages = useCallback(() => {
    setStreamingMessages(null);
  }, []);

  const updateSessionTitle = useCallback(
    (sessionId: string, title: string) => {
      updateTitleMutation.mutate({ chatId: sessionId, title });
    },
    [updateTitleMutation]
  );

  const updateSessionContext = useCallback(
    (sessionId: string, context: ChatContext) => {
      updateContextMutation.mutate({ chatId: sessionId, context });
    },
    [updateContextMutation]
  );

  const getSessionById = useCallback(
    (sessionId: string): ChatSession | undefined => {
      return sessions.find((s) => s.id === sessionId);
    },
    [sessions]
  );

  // Trust the URL as source of truth — set unconditionally.
  // Validation happens via the error guard in ChatPage (checks sessions.length > 0 && !currentSession).
  const setCurrentSessionById = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    setStreamingMessages(null);
  }, []);

  // After stream completes: seed cache with final messages, clear overlay, then
  // invalidate in the background for eventual consistency with server state.
  // Cache seeding via setData prevents flicker (overlay clears but cache already
  // has content-identical data, so serverMessages is immediately populated).
  const invalidateAfterStream = useCallback(
    (chatIdOverride?: string, finalMessages?: Message[]) => {
      const targetChatId = chatIdOverride ?? currentSessionId;

      // Seed cache so there's no visual gap when overlay clears
      if (targetChatId && finalMessages) {
        const persistedShape = finalMessages.map((msg) => ({
          id: msg.id ?? crypto.randomUUID(),
          chatId: targetChatId,
          role: msg.role,
          content: msg.content,
          metadata: (msg.toolCalls?.length
            ? { toolCalls: msg.toolCalls }
            : {}) as ChatMessageMetadata,
          createdAt:
            typeof msg.timestamp === 'string'
              ? msg.timestamp
              : msg.timestamp instanceof Date
                ? msg.timestamp.toISOString()
                : new Date().toISOString(),
        }));
        utils.chat.getChatMessages.setData({ chatId: targetChatId }, persistedShape);
      }

      setStreamingMessages(null);

      // Background refresh for eventual consistency (server IDs, timestamps)
      utils.chat.listChats.invalidate();
      if (targetChatId) {
        utils.chat.getChatMessages.invalidate({ chatId: targetChatId });
      }
    },
    [utils, currentSessionId]
  );

  return {
    sessions,
    currentSessionId,
    currentSession,
    messages,
    isLoadingSessions: sessionsQuery.isLoading,
    isFetchingSessions: sessionsQuery.isFetching,
    isLoadingMessages: messagesQuery.isLoading,
    handleNewChat,
    handleSessionSelect,
    handleDeleteSession,
    updateCurrentSessionMessages,
    clearStreamingMessages,
    updateSessionTitle,
    updateSessionContext,
    getSessionById,
    setCurrentSessionById,
    setCurrentSessionId,
    invalidateAfterStream,
  };
}
