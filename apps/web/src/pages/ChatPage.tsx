import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Header } from '@/components/layouts/Header';
import { Sidebar } from '@/components/layouts/Sidebar';
import { ChatInterface } from '@/components/features/chat/ChatInterface';
import { Badge } from '@/components/ui/Badge';
import { Message } from '@atlas/shared';
import { streamChatMessage } from '@/lib/chat-api';
import { useChatSessions } from './useChatSessions';
import { truncateText } from '@/utils/formatters';
import { logger } from '@/utils/logger';
import { trpc } from '@/lib/trpc';
import { Bot } from 'lucide-react';
import { APP_CONFIG } from '@/constants';

export const ChatPage: React.FC = () => {
  const { chatId } = useParams({ from: '/chat/$chatId' });
  const navigate = useNavigate();

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

  // Set current session based on URL param
  useEffect(() => {
    if (chatId && chatId !== currentSessionId) {
      setCurrentSessionById(chatId);
    }
  }, [chatId, currentSessionId, setCurrentSessionById]);

  // Get assistantId from current session
  const assistantId = currentSession?.assistantId;

  // Fetch assistant details if this chat has an assistant
  const { data: assistant } = trpc.assistant.get.useQuery(
    { id: assistantId! },
    { enabled: !!assistantId }
  );

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
          <button
            onClick={() => navigate({ to: '/' })}
            className="text-orange-600 hover:underline"
          >
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
        {assistant && (
          <div className="bg-orange-50 border-b border-orange-200 px-4 py-2">
            <div className="max-w-4xl mx-auto flex items-center gap-2">
              <Bot className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">{assistant.name}</span>
              <Badge variant="neutral" className="!text-[10px]">
                Assistent
              </Badge>
            </div>
          </div>
        )}

        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          systemPrompt={!assistantId ? APP_CONFIG.SYSTEM_PROMPT : undefined}
          dataSources={!assistantId ? APP_CONFIG.DATA_SOURCES : undefined}
        />
      </div>
    </div>
  );
};
