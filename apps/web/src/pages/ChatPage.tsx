import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearch } from '@tanstack/react-router';
import { Header } from '@/components/layouts/Header';
import { Sidebar } from '@/components/layouts/Sidebar';
import { ChatInterface } from '@/components/features/chat/ChatInterface';
import { Message, ChatContext } from '@atlas/shared';
import { streamChatMessage } from '@/lib/chat-api';
import { useChatSessions } from './useChatSessions';
import { truncateText } from '@/utils/formatters';
import { logger } from '@/utils/logger';
import { generateMessageId } from '@/utils/id-generator';
import { Assistant, useAssistant } from '@/hooks/useAssistants';
import { ICON_MAP } from '@/constants/icons';
import { Bot } from 'lucide-react';
import { TEMPLATES } from '@/data/templates';

export const ChatPage: React.FC = () => {
  // Since ChatPage is shared between '/' and '/chat/$chatId', use strict: false
  // This gives us a union of all possible params/search across both routes
  const params = useParams({ strict: false });
  const chatId = params.chatId;
  const navigate = useNavigate();

  // Get search params - strict: false for shared component
  const search = useSearch({ strict: false });
  const templateId = search.templateId;

  // Find template content by ID
  const templateContent = templateId
    ? TEMPLATES.find((t) => t.id === templateId)?.content
    : undefined;

  const {
    sessions,
    currentSessionId,
    currentSession,
    messages,
    handleNewChat,
    handleSessionSelect,
    handleDeleteSession,
    updateCurrentSessionMessages,
    updateSessionTitle,
    setCurrentSessionById,
    updateSessionContext,
  } = useChatSessions();

  const [isLoading, setIsLoading] = useState(false);
  const [activeToolCalls, setActiveToolCalls] = useState<
    Array<{ name: string; status: 'started' | 'completed' }>
  >([]);
  const hasCreatedInitialSession = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Derive context from session instead of maintaining duplicate state
  const chatContext = currentSession?.context ?? {};

  // Set current session based on URL param or create first session
  useEffect(() => {
    if (chatId && chatId !== currentSessionId) {
      // Route has chatId - switch to that session
      setCurrentSessionById(chatId);
    } else if (!chatId && !currentSessionId && !hasCreatedInitialSession.current) {
      // On home route without session - create first session
      hasCreatedInitialSession.current = true;
      handleNewChat();
    }
    // handleNewChat intentionally omitted to prevent re-render loop (stable via ref)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, currentSessionId, setCurrentSessionById]);

  // Get assistantId from current session
  const assistantId = currentSession?.assistantId;

  // Fetch assistant details if this chat has an assistant
  const { assistant } = useAssistant(assistantId);

  // Handle new chat - navigate to new chat URL
  const handleNewChatWithNavigation = () => {
    const newSessionId = handleNewChat();
    navigate({ to: '/chat/$chatId', params: { chatId: newSessionId } });
  };

  // Handle session select - navigate to chat URL
  const handleSessionSelectWithNavigation = (sessionId: string) => {
    handleSessionSelect(sessionId);
    navigate({ to: '/chat/$chatId', params: { chatId: sessionId } });
  };

  // Handle context changes from ChatInterface
  const handleContextChange = useCallback(
    (newContext: ChatContext) => {
      if (currentSessionId) {
        updateSessionContext(currentSessionId, newContext);
      }
    },
    [currentSessionId, updateSessionContext]
  );

  const handleSendMessage = async (content: string) => {
    // Create abort controller for this request
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

    // Update session title if it's the first message
    if (currentSessionId && messages.length === 0) {
      const title = assistant
        ? `${assistant.name}: ${truncateText(content, 30)}`
        : truncateText(content, 50);
      updateSessionTitle(currentSessionId, title);
    }

    setIsLoading(true);

    try {
      let assistantContent = '';
      let citations: Message['citations'] = [];
      let collectedToolCalls: Message['toolCalls'] = [];

      // Pass assistantId, context, and abort signal to streaming API
      for await (const chunk of streamChatMessage(
        content,
        messages,
        assistantId,
        chatContext,
        abortController.signal
      )) {
        if (chunk.type === 'text' && chunk.content) {
          assistantContent += chunk.content;

          // Only show the assistant bubble once there's visible text
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
          // Update local collection for persisting on message
          const existingIdx = collectedToolCalls?.findIndex(
            (tc) => tc.name === chunk.toolCall!.name
          );
          if (existingIdx !== undefined && existingIdx >= 0 && collectedToolCalls) {
            collectedToolCalls[existingIdx] = chunk.toolCall;
          } else {
            collectedToolCalls = [...(collectedToolCalls || []), chunk.toolCall];
          }

          // Update state for streaming indicator
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

          updateCurrentSessionMessages([...updatedMessages, finalMessage]);
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error);
        }
      }
    } catch (error) {
      // Don't show error message if stream was cancelled by user
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

  // Handle cancel request from UI
  const handleCancelRequest = () => {
    abortControllerRef.current?.abort();
  };

  // If session not found, redirect to home
  if (chatId && !currentSession && sessions.length > 0) {
    // Session doesn't exist - could redirect or show error
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

        {/* Assistant indicator - only show if chat has an assistant */}
        {assistant && <AssistantIndicator assistant={assistant} />}

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

const AssistantIndicator = ({ assistant }: { assistant: Assistant }) => {
  const Icon = ICON_MAP[assistant.icon] ?? Bot;

  return (
    <div className="bg-orange-50 border-b border-orange-200 px-4 py-2">
      <div className="max-w-4xl mx-auto flex items-center gap-2">
        <Icon className="w-4 h-4 text-orange-600" />
        <span className="text-sm font-medium text-orange-800">{assistant.name}</span>
      </div>
    </div>
  );
};
