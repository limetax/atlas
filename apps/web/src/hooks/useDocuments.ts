import { useRef } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { STORAGE_KEYS } from '@/constants';

type UseDocumentsReturn = {
  documents: NonNullable<ReturnType<typeof trpc.document.listDocuments.useQuery>['data']>;
  isLoading: boolean;
  isError: boolean;
  uploadDocuments: (files: File[]) => Promise<void>;
  deleteDocument: (documentId: string) => void;
  isDeletingDocument: boolean;
};

export const useDocuments = (): UseDocumentsReturn => {
  const utils = trpc.useUtils();
  const uploadAbortRef = useRef<AbortController | null>(null);

  const documentsQuery = trpc.document.listDocuments.useQuery(undefined, {
    staleTime: 2 * 60 * 1000,
  });

  const deleteDocumentMutation = trpc.document.deleteDocument.useMutation({
    onSuccess: () => {
      toast.success('Dokument gelöscht');
      void utils.document.listDocuments.invalidate();
    },
    onError: () => {
      toast.error('Dokument konnte nicht gelöscht werden');
    },
  });

  const uploadDocuments = async (files: File[]): Promise<void> => {
    const abortController = new AbortController();
    uploadAbortRef.current = abortController;

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`Upload fehlgeschlagen: ${response.statusText}`);
    }

    void utils.document.listDocuments.invalidate();
  };

  return {
    documents: documentsQuery.data ?? [],
    isLoading: documentsQuery.isLoading,
    isError: documentsQuery.isError,
    uploadDocuments,
    deleteDocument: (documentId: string) => deleteDocumentMutation.mutate({ documentId }),
    isDeletingDocument: deleteDocumentMutation.isPending,
  };
};
