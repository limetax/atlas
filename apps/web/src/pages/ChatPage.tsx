import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Header } from '@/components/layouts/Header';
import { Sidebar } from '@/components/layouts/Sidebar';
import { ChatInterface } from '@/components/features/chat/ChatInterface';
import { Message } from '@atlas/shared';
import { streamChatMessage } from '@/lib/chat-api';
import { useChatSessions } from './useChatSessions';
import { truncateText } from '@/utils/formatters';
import { logger } from '@/utils/logger';
import { Assistant, useAssistant } from '@/hooks/useAssistants';
import { ICON_MAP } from '@/constants/icons';
import { Bot } from 'lucide-react';
import { APP_CONFIG } from '@/constants';

export const ChatPage: React.FC = () => {
  // chatId can be undefined when on "/" route
  const params = useParams({ strict: false });
  const chatId = (params as { chatId?: string }).chatId;
  const navigate = useNavigate();

  // Get template content from localStorage if coming from template insertion
  const [templateContent] = useState<string | undefined>(() => {
    const content = localStorage.getItem('__template_content');
    if (content) {
      localStorage.removeItem('__template_content');
      return content;
    }
    return undefined;
  });

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
  } = useChatSessions();

  const [isLoading, setIsLoading] = useState(false);
  const hasCreatedInitialSession = useRef(false);

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

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
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

      // Pass assistantId to streaming API if present
      for await (const chunk of streamChatMessage(content, messages, assistantId)) {
        if (chunk.type === 'text' && chunk.content) {
          assistantContent += chunk.content;

          const streamingMessage: Message = {
            id: `msg-${Date.now()}-assistant`,
            role: 'assistant',
            content: assistantContent,
            citations,
            timestamp: new Date(),
          };

          updateCurrentSessionMessages([...updatedMessages, streamingMessage]);
        } else if (chunk.type === 'citations' && chunk.citations) {
          citations = chunk.citations;
        } else if (chunk.type === 'done') {
          const finalMessage: Message = {
            id: `msg-${Date.now()}-assistant`,
            role: 'assistant',
            content: assistantContent,
            citations,
            timestamp: new Date(),
          };

          updateCurrentSessionMessages([...updatedMessages, finalMessage]);
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error);
        }
      }
    } catch (error) {
      logger.error('Error sending message:', error);

      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: `Entschuldigung, es ist ein Fehler aufgetreten: ${
          error instanceof Error ? error.message : 'Unbekannter Fehler'
        }`,
        timestamp: new Date(),
      };

      updateCurrentSessionMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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
          isLoading={isLoading}
          systemPrompt={!assistantId ? APP_CONFIG.SYSTEM_PROMPT : undefined}
          dataSources={!assistantId ? APP_CONFIG.DATA_SOURCES : undefined}
          initialContent={templateContent}
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
