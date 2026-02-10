import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearch } from '@tanstack/react-router';
import { Header } from '@/components/layouts/Header';
import { Sidebar } from '@/components/layouts/Sidebar';
import { ChatInterface } from '@/components/features/chat/ChatInterface';
import { Message, ChatContext } from '@atlas/shared';
import { streamChatMessage } from '@/lib/chat-api';
import { useChatSessions } from './useChatSessions';
import { logger } from '@/utils/logger';
import { generateMessageId } from '@/utils/id-generator';
import { TEMPLATES } from '@/data/templates';

export const ChatPage: React.FC = () => {
  // Since ChatPage is shared between '/' and '/chat/$chatId', use strict: false
  const params = useParams({ strict: false });
  const chatId = params.chatId;
  const navigate = useNavigate();

  const search = useSearch({ strict: false });
  const templateId = search.templateId;

  const templateContent = templateId
    ? TEMPLATES.find((t) => t.id === templateId)?.content
    : undefined;

  const {
    sessions,
    currentSessionId,
    currentSession,
    messages,
    isFetchingSessions,
    handleNewChat,
    handleSessionSelect,
    handleDeleteSession,
    updateCurrentSessionMessages,
    setCurrentSessionById,
    setCurrentSessionId,
    updateSessionContext,
    invalidateAfterStream,
  } = useChatSessions();

  const [isLoading, setIsLoading] = useState(false);
  const [activeToolCalls, setActiveToolCalls] = useState<
    Array<{ name: string; status: 'started' | 'completed' }>
  >([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Local context for new-chat mode (before a DB session exists).
  // Once the chat is created, context is persisted server-side and read from currentSession.
  const [pendingContext, setPendingContext] = useState<ChatContext>({});
  const chatContext = currentSession?.context ?? pendingContext;

  // Sync URL → hook state. The URL is the source of truth for which chat is active.
  // This only runs when the URL chatId changes (route navigation).
  useEffect(() => {
    if (chatId) {
      // URL has a chatId — ensure the hook is pointing to this session
      if (chatId !== currentSessionId) {
        setCurrentSessionById(chatId);
      }
    } else {
      // URL is "/" (new chat mode) — ensure hook state is cleared
      if (currentSessionId) {
        handleNewChat();
      }
    }
    // Only react to URL changes. The hook's currentSessionId is intentionally
    // excluded to avoid a feedback loop where hook state re-triggers this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // Clear state eagerly + navigate. Both the direct call and the useEffect([chatId])
  // clear state, but the direct call prevents a flash of stale content on the first render.
  const handleNewChatWithNavigation = () => {
    handleNewChat();
    setPendingContext({});
    navigate({ to: '/' });
  };

  // Select session eagerly + navigate (same reasoning as above)
  const handleSessionSelectWithNavigation = (sessionId: string) => {
    handleSessionSelect(sessionId);
    navigate({ to: '/chat/$chatId', params: { chatId: sessionId } });
  };

  const handleContextChange = useCallback(
    (newContext: ChatContext) => {
      if (currentSessionId) {
        updateSessionContext(currentSessionId, newContext);
      } else {
        // New chat mode — store locally until first message creates the session
        setPendingContext(newContext);
      }
    },
    [currentSessionId, updateSessionContext]
  );

  const handleSendMessage = async (content: string) => {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const userMessage: Message = {
      id: generateMessageId(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    updateCurrentSessionMessages(updatedMessages);

    setIsLoading(true);

    // Track the chatId for this stream — may be updated by chat_created chunk
    let streamChatId = currentSessionId;

    try {
      let assistantContent = '';
      let citations: Message['citations'] = [];
      let collectedToolCalls: Message['toolCalls'] = [];

      for await (const chunk of streamChatMessage(
        content,
        messages,
        chatContext,
        abortController.signal,
        currentSessionId
      )) {
        if (chunk.type === 'chat_created' && chunk.chatId) {
          // Backend created a new chat — update local tracker and state
          streamChatId = chunk.chatId;
          setCurrentSessionId(chunk.chatId);
          setPendingContext({}); // Context now persisted on server
          navigate({ to: '/chat/$chatId', params: { chatId: chunk.chatId } });
        } else if (chunk.type === 'text' && chunk.content) {
          assistantContent += chunk.content;

          if (assistantContent.trim()) {
            const streamingMessage: Message = {
              id: generateMessageId(),
              role: 'assistant',
              content: assistantContent,
              citations,
              toolCalls: collectedToolCalls,
              timestamp: new Date(),
            };

            updateCurrentSessionMessages([...updatedMessages, streamingMessage]);
          }
        } else if (chunk.type === 'citations' && chunk.citations) {
          citations = chunk.citations;
        } else if (chunk.type === 'tool_call' && chunk.toolCall) {
          const existingIdx = collectedToolCalls.findIndex(
            (tc) => tc.name === chunk.toolCall!.name
          );
          if (existingIdx >= 0) {
            collectedToolCalls[existingIdx] = chunk.toolCall;
          } else {
            collectedToolCalls = [...collectedToolCalls, chunk.toolCall];
          }

          setActiveToolCalls((prev) => {
            const existing = prev.findIndex((tc) => tc.name === chunk.toolCall!.name);
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = chunk.toolCall!;
              return updated;
            }
            return [...prev, chunk.toolCall!];
          });
        } else if (chunk.type === 'done') {
          setActiveToolCalls([]);
          const finalMessage: Message = {
            id: generateMessageId(),
            role: 'assistant',
            content: assistantContent,
            citations,
            toolCalls: collectedToolCalls,
            timestamp: new Date(),
          };

          const allMessages = [...updatedMessages, finalMessage];
          updateCurrentSessionMessages(allMessages);

          // Sync with server: seed query cache with final messages (prevents flicker),
          // then invalidate in the background for eventual consistency.
          invalidateAfterStream(streamChatId, allMessages);
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('cancelled')) {
        logger.info('Stream cancelled by user');
        return;
      }

      logger.error('Error sending message:', error);

      const errorMessage: Message = {
        id: generateMessageId(),
        role: 'assistant',
        content: `Entschuldigung, es ist ein Fehler aufgetreten: ${
          error instanceof Error ? error.message : 'Unbekannter Fehler'
        }`,
        timestamp: new Date(),
      };

      updateCurrentSessionMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
      setActiveToolCalls([]);
      abortControllerRef.current = null;
    }
  };

  // Cleanup: abort any running stream on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleCancelRequest = () => {
    abortControllerRef.current?.abort();
  };

  // If a specific chatId was requested but not found in loaded sessions, show error.
  // Skip during streaming (isLoading) — the sessions list is stale while a new chat is being created.
  // Skip while sessions are refetching (isFetchingSessions) — invalidate() after stream may not
  // have completed yet, so the new chat isn't in the sessions list yet.
  // Skip during transitional states where currentSessionId is cleared eagerly.
  if (
    chatId &&
    currentSessionId &&
    !currentSession &&
    sessions.length > 0 &&
    !isLoading &&
    !isFetchingSessions
  ) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Chat nicht gefunden</p>
          <button onClick={() => navigate({ to: '/' })} className="text-orange-600 hover:underline">
            Zurück zur Startseite
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSessionSelect={handleSessionSelectWithNavigation}
        onNewChat={handleNewChatWithNavigation}
        onDeleteSession={handleDeleteSession}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          onCancelRequest={handleCancelRequest}
          isLoading={isLoading}
          activeToolCalls={activeToolCalls}
          initialContent={templateContent}
          context={chatContext}
          onContextChange={handleContextChange}
        />
      </div>
    </div>
  );
};
