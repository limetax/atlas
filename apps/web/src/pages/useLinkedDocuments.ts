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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    { chatId: currentSessionId! },
    { enabled: !!currentSessionId }
  );

  const linkMutation = trpc.document.linkDocumentToChat.useMutation({
    onError: () => {
      toast.error('Dokument konnte nicht hinzugefügt werden');
    },
    onSettled: (_data, _err, { chatId }) => {
      void utils.document.getDocumentsByChatId.invalidate({ chatId });
    },
  });

  // Called when user selects docs from the picker:
  // - existing chat → mutate (onMutate handles optimistic update)
  // - new chat (no session) → queue locally until chat_created fires
  const handleDocumentSelect = useCallback(
    (docs: Document[]) => {
      if (currentSessionId) {
        void Promise.all(
          docs.map((doc) =>
            linkMutation.mutateAsync({ chatId: currentSessionId, documentId: doc.id })
          )
        ).then(() => {
          const count = docs.length;
          toast.success(count === 1 ? 'Dokument hinzugefügt' : `${count} Dokumente hinzugefügt`);
        });
      } else {
        setPendingDocuments((prev) => {
          const existingIds = new Set(prev.map((d) => d.id));
          return [...prev, ...docs.filter((d) => !existingIds.has(d.id))];
        });
      }
    },
    [currentSessionId, linkMutation]
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

      setPendingDocuments([]);
      // Seed cache immediately so docs appear the moment pendingDocuments is cleared,
      // without waiting for the server round-trip. onSettled will refetch for consistency.
      utils.document.getDocumentsByChatId.setData({ chatId: newChatId }, docs);

      await Promise.all(
        docs.map((doc) => linkMutation.mutateAsync({ chatId: newChatId, documentId: doc.id }))
      );
    },
    [linkMutation, utils]
  );

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
