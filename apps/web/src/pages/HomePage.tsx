import React, { useState } from 'react';
import { Header } from '@/components/layouts/Header';
import { Sidebar } from '@/components/layouts/Sidebar';
import { ChatInterface } from '@/components/features/chat/ChatInterface';
import { Message } from '@atlas/shared';
import { streamChatMessage } from '@/lib/chat-api';
import { useChatSessions } from './useChatSessions';
import { truncateText } from '@/utils/formatters';
import { logger } from '@/utils/logger';
import { APP_CONFIG } from '@/constants';

export const HomePage: React.FC = () => {
  const {
    sessions,
    currentSessionId,
    messages,
    handleNewChat,
    handleSessionSelect,
    handleDeleteSession,
    updateCurrentSessionMessages,
    updateSessionTitle,
  } = useChatSessions();

  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (content: string) => {
    // Create user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    // Add user message to current session
    const updatedMessages = [...messages, userMessage];
    updateCurrentSessionMessages(updatedMessages);

    // Update session title if it's the first message
    if (currentSessionId && messages.length === 0) {
      updateSessionTitle(currentSessionId, truncateText(content, 50));
    }

    // Call streaming API
    setIsLoading(true);

    try {
      let assistantContent = '';
      let citations: Message['citations'] = [];

      // Stream from API using SSE
      for await (const chunk of streamChatMessage(content, messages)) {
        if (chunk.type === 'text' && chunk.content) {
          assistantContent += chunk.content;

          // Update message in real-time
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
          // Finalize message
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

      // Show error message
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

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          systemPrompt={APP_CONFIG.SYSTEM_PROMPT}
          dataSources={APP_CONFIG.DATA_SOURCES}
        />
      </div>
    </div>
  );
};
