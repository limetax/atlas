import { useCallback, useEffect, useRef, useState } from 'react';

import { toast } from 'sonner';

import { trpc } from '@/lib/trpc';
import { type Document } from '@atlas/shared';

export const useLinkedDocuments = (currentSessionId: string | undefined) => {
  const utils = trpc.useUtils();

  const [pendingDocuments, setPendingDocuments] = useState<Document[]>([]);
  const pendingDocumentsRef = useRef<Document[]>([]);

  // Keep ref in sync so stable callbacks (linkPendingToNewChat) always see the latest value
  useEffect(() => {
    pendingDocumentsRef.current = pendingDocuments;
  }, [pendingDocuments]);

  const { data: linkedDocuments = [] } = trpc.document.getDocumentsByChatId.useQuery(
    { chatId: currentSessionId! },
    { enabled: !!currentSessionId }
  );

  const linkMutation = trpc.document.linkDocumentToChat.useMutation();

  // Called when user selects docs from the picker:
  // - existing chat → link immediately
  // - new chat (no session) → queue locally until chat_created fires
  const handleDocumentSelect = useCallback(
    (docs: Document[]) => {
      if (currentSessionId) {
        void Promise.all(
          docs.map((doc) =>
            linkMutation.mutateAsync({ chatId: currentSessionId, documentId: doc.id })
          )
        )
          .then(() => {
            const count = docs.length;
            toast.success(count === 1 ? 'Dokument hinzugefügt' : `${count} Dokumente hinzugefügt`);
            void utils.document.getDocumentsByChatId.invalidate({ chatId: currentSessionId });
          })
          .catch(() => {
            toast.error('Dokument konnte nicht hinzugefügt werden');
          });
      } else {
        setPendingDocuments((prev) => {
          const existingIds = new Set(prev.map((d) => d.id));
          return [...prev, ...docs.filter((d) => !existingIds.has(d.id))];
        });
      }
    },
    [currentSessionId, linkMutation, utils]
  );

  const handleRemovePendingDocument = useCallback((documentId: string) => {
    setPendingDocuments((prev) => prev.filter((d) => d.id !== documentId));
  }, []);

  // Link all pending docs to a newly created chat.
  // Uses a ref so this callback stays stable regardless of pendingDocuments changes.
  const linkPendingToNewChat = useCallback(
    async (newChatId: string): Promise<void> => {
      const docs = pendingDocumentsRef.current;
      if (docs.length === 0) return;
      await Promise.all(
        docs.map((doc) => linkMutation.mutateAsync({ chatId: newChatId, documentId: doc.id }))
      );
      setPendingDocuments([]);
      void utils.document.getDocumentsByChatId.invalidate({ chatId: newChatId });
    },
    [linkMutation, utils]
  );

  // Invalidate the library list after a new file is uploaded via chat
  const handleDocumentsUploaded = useCallback(() => {
    void utils.document.listDocuments.invalidate();
  }, [utils]);

  const clearPendingDocuments = useCallback(() => {
    setPendingDocuments([]);
  }, []);

  return {
    linkedDocuments,
    pendingDocuments,
    handleDocumentSelect,
    handleRemovePendingDocument,
    linkPendingToNewChat,
    handleDocumentsUploaded,
    clearPendingDocuments,
  };
};
