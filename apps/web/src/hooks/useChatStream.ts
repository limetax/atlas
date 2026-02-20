/**
 * useChatStream Hook
 * Encapsulates the SSE streaming lifecycle for chat messages.
 *
 * Responsibilities:
 * - Sending messages via SSE (streamChatMessage)
 * - Managing loading / abort state
 * - Tracking active tool calls during streaming
 * - Building optimistic messages during the stream
 * - Seeding the query cache on stream completion
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Message, ChatContext } from '@atlas/shared';
import { streamChatMessage } from '@/lib/chat-api';
import { generateMessageId } from '@/utils/id-generator';
import { logger } from '@/utils/logger';

export type ToolCallState = {
  name: string;
  status: 'started' | 'completed';
};

type UseChatStreamParams = {
  messages: Message[];
  currentSessionId: string | undefined;
  chatContext: ChatContext;
  pendingDocumentIds?: string[];
  updateCurrentSessionMessages: (messages: Message[]) => void;
  setCurrentSessionId: (id: string | undefined) => void;
  invalidateAfterStream: (chatIdOverride?: string, finalMessages?: Message[]) => void;
  onChatCreated?: (chatId: string) => void;
  onContextPersisted?: () => void;
  onDocumentsUploaded?: (chatId: string) => void;
};

export type UseChatStreamReturn = {
  isLoading: boolean;
  activeToolCalls: ToolCallState[];
  handleSendMessage: (content: string, pendingFiles?: File[]) => Promise<void>;
  handleCancelRequest: () => void;
};

export const useChatStream = ({
  messages,
  currentSessionId,
  chatContext,
  pendingDocumentIds,
  updateCurrentSessionMessages,
  setCurrentSessionId,
  invalidateAfterStream,
  onChatCreated,
  onContextPersisted,
  onDocumentsUploaded,
}: UseChatStreamParams): UseChatStreamReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeToolCalls, setActiveToolCalls] = useState<ToolCallState[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup: abort any running stream on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleCancelRequest = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleSendMessage = useCallback(
    async (content: string, pendingFiles?: File[]) => {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const filesToSend = pendingFiles ?? [];

      const userMessage: Message = {
        id: generateMessageId(),
        role: 'user',
        content,
        attachedFiles:
          filesToSend.length > 0
            ? filesToSend.map((f) => ({ name: f.name, size: f.size }))
            : undefined,
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
          currentSessionId,
          filesToSend.length > 0 ? filesToSend : undefined,
          !currentSessionId ? pendingDocumentIds : undefined
        )) {
          if (chunk.type === 'chat_created' && chunk.chatId) {
            streamChatId = chunk.chatId;
            setCurrentSessionId(chunk.chatId);
            onContextPersisted?.();
            onChatCreated?.(chunk.chatId);
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
            const toolCall = chunk.toolCall;
            const existingIdx = collectedToolCalls.findIndex((tc) => tc.name === toolCall.name);
            if (existingIdx >= 0) {
              collectedToolCalls[existingIdx] = toolCall;
            } else {
              collectedToolCalls = [...collectedToolCalls, toolCall];
            }

            setActiveToolCalls((prev) => {
              const existing = prev.findIndex((tc) => tc.name === toolCall.name);
              if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = toolCall;
                return updated;
              }
              return [...prev, toolCall];
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

            invalidateAfterStream(streamChatId, allMessages);
            if (filesToSend.length > 0 && streamChatId) {
              onDocumentsUploaded?.(streamChatId);
            }
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
    },
    [
      messages,
      currentSessionId,
      chatContext,
      pendingDocumentIds,
      updateCurrentSessionMessages,
      setCurrentSessionId,
      invalidateAfterStream,
      onChatCreated,
      onContextPersisted,
      onDocumentsUploaded,
    ]
  );

  return {
    isLoading,
    activeToolCalls,
    handleSendMessage,
    handleCancelRequest,
  };
};
