import React, { useState, useEffect } from 'react';
import { Header } from '../views/Header';
import { Sidebar } from '../views/Sidebar';
import { ChatInterface } from '../views/ChatInterface';
import { Message, ChatSession } from '@lime-gpt/shared';
import { streamChatMessage } from '../lib/chat-api';

const SYSTEM_PROMPT = 'System prompt placeholder';
const DATA_SOURCES = ['AO', 'UStG', 'EStG'];

export const HomePage: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load sessions from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('limetax-sessions');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed);
      if (parsed.length > 0) {
        setCurrentSessionId(parsed[0].id);
        setMessages(parsed[0].messages);
      }
    }
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('limetax-sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'Neuer Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
  };

  const handleSessionSelect = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter((s) => s.id !== sessionId);
    setSessions(updatedSessions);

    if (currentSessionId === sessionId) {
      if (updatedSessions.length > 0) {
        setCurrentSessionId(updatedSessions[0].id);
        setMessages(updatedSessions[0].messages);
      } else {
        setCurrentSessionId(undefined);
        setMessages([]);
      }
    }
  };

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
    setMessages(updatedMessages);

    // Update session title if it's the first message
    let updatedSessions = sessions;
    if (currentSessionId) {
      updatedSessions = sessions.map((session) => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            title: session.messages.length === 0 ? content.slice(0, 50) : session.title,
            messages: updatedMessages,
            updatedAt: new Date(),
          };
        }
        return session;
      });
      setSessions(updatedSessions);
    } else {
      // Create new session if none exists
      const newSession: ChatSession = {
        id: `session-${Date.now()}`,
        title: content.slice(0, 50),
        messages: updatedMessages,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      updatedSessions = [newSession, ...sessions];
      setSessions(updatedSessions);
      setCurrentSessionId(newSession.id);
    }

    // Call streaming API
    setIsLoading(true);

    try {
      let assistantContent = '';
      let citations: Message['citations'] = [];

      // Stream from API using SSE
      for await (const chunk of streamChatMessage(content, updatedMessages.slice(0, -1))) {
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

          setMessages([...updatedMessages, streamingMessage]);
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

          const finalMessages = [...updatedMessages, finalMessage];
          setMessages(finalMessages);

          // Update session
          setSessions(
            updatedSessions.map((session) => {
              if (session.id === currentSessionId) {
                return {
                  ...session,
                  messages: finalMessages,
                  updatedAt: new Date(),
                };
              }
              return session;
            })
          );
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Show error message
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: `Entschuldigung, es ist ein Fehler aufgetreten: ${
          error instanceof Error ? error.message : 'Unbekannter Fehler'
        }`,
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
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
          systemPrompt={SYSTEM_PROMPT}
          dataSources={DATA_SOURCES}
        />
      </div>
    </div>
  );
};
