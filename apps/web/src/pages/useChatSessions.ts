/**
 * useChatSessions Hook
 * Component-specific hook for managing chat sessions
 * Supports optional assistantId for assistant-based chats
 */

import { useState, useCallback } from 'react';
import { ChatSession, Message, ChatContext } from '@atlas/shared';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS } from '@/constants';
import { generateSessionId } from '@/utils/id-generator';

export interface UseChatSessionsReturn {
  sessions: ChatSession[];
  currentSessionId: string | undefined;
  currentSession: ChatSession | undefined;
  messages: Message[];
  handleNewChat: () => string;
  handleNewChatWithAssistant: (assistantId: string) => string;
  handleSessionSelect: (sessionId: string) => void;
  handleDeleteSession: (sessionId: string) => void;
  updateCurrentSessionMessages: (messages: Message[]) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  updateSessionContext: (sessionId: string, context: ChatContext) => void;
  getSessionById: (sessionId: string) => ChatSession | undefined;
  setCurrentSessionById: (sessionId: string) => void;
}

export function useChatSessions(): UseChatSessionsReturn {
  const [sessions, setSessions] = useLocalStorage<ChatSession[]>(STORAGE_KEYS.CHAT_SESSIONS, []);

  // Get initial session and messages from loaded sessions
  const initialSession = sessions.length > 0 ? sessions[0] : null;

  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(initialSession?.id);
  const [messages, setMessages] = useState<Message[]>(initialSession?.messages || []);

  // Get current session object
  const currentSession = sessions.find((s) => s.id === currentSessionId);

  // Get session by ID
  const getSessionById = useCallback(
    (sessionId: string): ChatSession | undefined => {
      return sessions.find((s) => s.id === sessionId);
    },
    [sessions]
  );

  // Set current session by ID (for route-based navigation)
  const setCurrentSessionById = useCallback(
    (sessionId: string) => {
      const session = sessions.find((s) => s.id === sessionId);
      if (session) {
        setCurrentSessionId(sessionId);
        setMessages(session.messages);
      }
    },
    [sessions]
  );

  // Create new chat without assistant - returns session ID
  const handleNewChat = useCallback((): string => {
    const newSession: ChatSession = {
      id: generateSessionId(),
      title: 'Neuer Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      context: {},
    };
    // Use functional update to avoid stale closure
    setSessions((prevSessions) => [newSession, ...prevSessions]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
    return newSession.id;
  }, [setSessions]);

  // Create new chat WITH assistant - returns session ID
  const handleNewChatWithAssistant = useCallback(
    (assistantId: string): string => {
      const newSession: ChatSession = {
        id: generateSessionId(),
        title: 'Neuer Chat',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        assistantId,
        context: {},
      };
      // Use functional update to avoid stale closure
      setSessions((prevSessions) => [newSession, ...prevSessions]);
      setCurrentSessionId(newSession.id);
      setMessages([]);
      return newSession.id;
    },
    [setSessions]
  );

  const handleSessionSelect = useCallback(
    (sessionId: string) => {
      const session = sessions.find((s) => s.id === sessionId);
      if (session) {
        setCurrentSessionId(sessionId);
        setMessages(session.messages);
      }
    },
    [sessions]
  );

  const handleDeleteSession = useCallback(
    (sessionId: string) => {
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
    },
    [sessions, setSessions, currentSessionId]
  );

  const updateCurrentSessionMessages = useCallback(
    (newMessages: Message[]) => {
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
    },
    [currentSessionId, sessions, setSessions]
  );

  const updateSessionTitle = useCallback(
    (sessionId: string, title: string) => {
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
    },
    [sessions, setSessions]
  );

  const updateSessionContext = useCallback(
    (sessionId: string, context: ChatContext) => {
      setSessions(
        sessions.map((session) => {
          if (session.id === sessionId) {
            return {
              ...session,
              context,
              updatedAt: new Date(),
            };
          }
          return session;
        })
      );
    },
    [sessions, setSessions]
  );

  return {
    sessions,
    currentSessionId,
    currentSession,
    messages,
    handleNewChat,
    handleNewChatWithAssistant,
    handleSessionSelect,
    handleDeleteSession,
    updateCurrentSessionMessages,
    updateSessionTitle,
    updateSessionContext,
    getSessionById,
    setCurrentSessionById,
  };
}
