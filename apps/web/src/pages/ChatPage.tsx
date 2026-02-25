import { useCallback, useEffect, useState } from 'react';

import { ChatHeader } from '@/components/features/chat/ChatHeader';
import { ChatInterface } from '@/components/features/chat/ChatInterface';
import { TEMPLATES } from '@/data/templates';
import { useChatStream } from '@/hooks/useChatStream';
import { ChatContext } from '@atlas/shared';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';

import { useChatSessions } from './useChatSessions';
import { useLinkedDocuments } from './useLinkedDocuments';

export const ChatPage = () => {
  // Since ChatPage is shared between '/chat' and '/chat/$chatId', use strict: false
  const params = useParams({ strict: false });
  const chatId = params.chatId;
  const navigate = useNavigate();

  const search = useSearch({ strict: false });
  const templateId = search.templateId;
  const mandantId = search.mandantId;

  const template = templateId ? TEMPLATES.find((t) => t.id === templateId) : undefined;
  const templateContent = template?.content;

  const {
    sessions,
    currentSessionId,
    currentSession,
    messages,
    isFetchingSessions,
    handleNewChat,
    handleDeleteSession,
    updateCurrentSessionMessages,
    setCurrentSessionById,
    setCurrentSessionId,
    updateSessionContext,
    invalidateAfterStream,
  } = useChatSessions();

  // ─── Pending files (selected/dropped but not yet sent) ──────────────────
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  // Local context for new-chat mode (before a DB session exists).
  // Once the chat is created, context is persisted server-side and read from currentSession.
  const [pendingContext, setPendingContext] = useState<ChatContext>({});
  const chatContext = currentSession?.context ?? pendingContext;

  // ─── Linked documents ────────────────────────────────────────────────────
  const {
    linkedDocuments,
    pendingDocuments,
    handleDocumentSelect,
    linkPendingToNewChat,
    handleDocumentsUploaded,
    clearPendingDocuments,
  } = useLinkedDocuments(currentSessionId);

  // ─── Streaming ──────────────────────────────────────────────────────────
  const handleChatCreated = useCallback(
    (newChatId: string) => {
      navigate({ to: '/chat/$chatId', params: { chatId: newChatId } });
      void linkPendingToNewChat(newChatId);
    },
    [navigate, linkPendingToNewChat]
  );

  const { isLoading, activeToolCalls, streamingStatus, handleSendMessage, handleCancelRequest } =
    useChatStream({
      messages,
      currentSessionId,
      chatContext,
      pendingDocumentIds: pendingDocuments.map((d) => d.id),
      updateCurrentSessionMessages,
      setCurrentSessionId,
      invalidateAfterStream,
      onChatCreated: handleChatCreated,
      onContextPersisted: () => {
        setPendingContext({});
      },
      onDocumentsUploaded: handleDocumentsUploaded,
    });

  // Sync URL → hook state. The URL is the source of truth for which chat is active.
  // This only runs when the URL chatId changes (route navigation).
  useEffect(() => {
    if (chatId) {
      if (chatId !== currentSessionId) {
        setCurrentSessionById(chatId);
      }
    } else {
      if (currentSessionId) {
        handleNewChat();
      }
      setPendingContext({});
      setPendingFiles([]);
      clearPendingDocuments();
    }
    // Only react to URL changes. The hook's currentSessionId is intentionally
    // excluded to avoid a feedback loop where hook state re-triggers this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // Pre-select client from URL search param (e.g. navigating from client detail page)
  useEffect(() => {
    if (mandantId && !chatId) {
      setPendingContext((prev) => ({ ...prev, mandant: mandantId }));
    }
  }, [mandantId, chatId]);

  // Pre-apply template's default context (e.g. pre-select research sources)
  useEffect(() => {
    if (template?.defaultContext && !chatId) {
      setPendingContext((prev) => ({ ...template.defaultContext, ...prev }));
    }
  }, [template, chatId]);

  // ─── Context ────────────────────────────────────────────────────────────
  const handleContextChange = useCallback(
    (newContext: ChatContext) => {
      if (currentSessionId) {
        updateSessionContext(currentSessionId, newContext);
      } else {
        setPendingContext(newContext);
      }
    },
    [currentSessionId, updateSessionContext]
  );

  // ─── File handlers ──────────────────────────────────────────────────────
  const handleAddFiles = useCallback((files: File[]) => {
    setPendingFiles((prev) => [...prev, ...files]);
  }, []);

  const handleRemovePendingFile = useCallback((index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ─── Chat actions ───────────────────────────────────────────────────────
  const handleDeleteCurrentChat = (): void => {
    if (!currentSessionId) return;

    handleDeleteSession(currentSessionId);
    updateCurrentSessionMessages([]);
    setPendingFiles([]);
    navigate({ to: '/chat' });
  };

  const handleNewChatClick = (): void => {
    handleNewChat();
    setPendingContext({});
    setPendingFiles([]);
    clearPendingDocuments();

    if (chatId) {
      navigate({ to: '/chat' });
    }
  };

  const onSendMessage = useCallback(
    (content: string) => {
      const filesToSend = [...pendingFiles];
      setPendingFiles([]);
      handleSendMessage(content, filesToSend);
    },
    [pendingFiles, handleSendMessage]
  );

  // ─── Error guard ────────────────────────────────────────────────────────
  if (
    chatId &&
    currentSessionId &&
    !currentSession &&
    sessions.length > 0 &&
    !isLoading &&
    !isFetchingSessions
  ) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Chat nicht gefunden</p>
          <button onClick={() => navigate({ to: '/' })} className="text-primary hover:underline">
            Zurück zur Startseite
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ChatHeader onDeleteCurrent={handleDeleteCurrentChat} onNewChat={handleNewChatClick} />

      <ChatInterface
        messages={messages}
        sessionId={currentSessionId}
        onSendMessage={onSendMessage}
        onCancelRequest={handleCancelRequest}
        isLoading={isLoading}
        activeToolCalls={activeToolCalls}
        streamingStatus={streamingStatus}
        initialContent={templateContent}
        context={chatContext}
        onContextChange={handleContextChange}
        pendingFiles={pendingFiles}
        onAddFiles={handleAddFiles}
        onRemovePendingFile={handleRemovePendingFile}
        linkedDocuments={linkedDocuments}
        pendingDocuments={pendingDocuments}
        onDocumentSelect={handleDocumentSelect}
      />
    </>
  );
};
