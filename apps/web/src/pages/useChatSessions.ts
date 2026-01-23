/**
 * useChatSessions Hook
 * Component-specific hook for managing chat sessions
 * Colocated with HomePage as it's only used there
 */

import { useState } from 'react';
import { ChatSession, Message } from '@atlas/shared';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS } from '@/constants';

export interface UseChatSessionsReturn {
  sessions: ChatSession[];
  currentSessionId: string | undefined;
  messages: Message[];
  handleNewChat: () => void;
  handleSessionSelect: (sessionId: string) => void;
  handleDeleteSession: (sessionId: string) => void;
  updateCurrentSessionMessages: (messages: Message[]) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
}

export function useChatSessions(): UseChatSessionsReturn {
  const [sessions, setSessions] = useLocalStorage<ChatSession[]>(STORAGE_KEYS.CHAT_SESSIONS, []);

  // Get initial session and messages from loaded sessions
  const initialSession = sessions.length > 0 ? sessions[0] : null;

  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(initialSession?.id);
  const [messages, setMessages] = useState<Message[]>(initialSession?.messages || []);

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

  const updateCurrentSessionMessages = (newMessages: Message[]) => {
    setMessages(newMessages);

    if (currentSessionId) {
      setSessions(
        sessions.map((session) => {
          if (session.id === currentSessionId) {
            return {
              ...session,
              messages: newMessages,
              updatedAt: new Date(),
            };
          }
          return session;
        })
      );
    }
  };

  const updateSessionTitle = (sessionId: string, title: string) => {
    setSessions(
      sessions.map((session) => {
        if (session.id === sessionId) {
          return {
            ...session,
            title,
            updatedAt: new Date(),
          };
        }
        return session;
      })
    );
  };

  return {
    sessions,
    currentSessionId,
    messages,
    handleNewChat,
    handleSessionSelect,
    handleDeleteSession,
    updateCurrentSessionMessages,
    updateSessionTitle,
  };
}
