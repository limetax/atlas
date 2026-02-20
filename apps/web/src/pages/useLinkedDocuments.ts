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

  // Called after a new chat is created. The backend already persisted the document links
  // (they were sent with the first message). Just clear pending state and seed the cache
  // so docs appear immediately without waiting for the query to fetch from the server.
  const linkPendingToNewChat = useCallback(
    (newChatId: string): void => {
      const docs = pendingDocumentsRef.current;
      if (docs.length === 0) return;

      setPendingDocuments([]);
      utils.document.getDocumentsByChatId.setData({ chatId: newChatId }, docs);
    },
    [utils]
  );

  const handleDocumentsUploaded = useCallback(
    (chatId: string) => {
      void utils.document.listDocuments.invalidate();
      void utils.document.getDocumentsByChatId.invalidate({ chatId });
    },
    [utils]
  );

  const clearPendingDocuments = useCallback(() => {
    setPendingDocuments([]);
  }, []);

  return {
    linkedDocuments,
    pendingDocuments,
    handleDocumentSelect,
    linkPendingToNewChat,
    handleDocumentsUploaded,
    clearPendingDocuments,
  };
};
