import { toast } from 'sonner';

import { API_ENDPOINTS } from '@/constants';
import { useAuthContext } from '@/contexts/AuthContext';
import { env } from '@/config/env';
import { trpc } from '@/lib/trpc';

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
  const { getToken } = useAuthContext();

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
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const token = getToken();

    const response = await fetch(`${env.apiUrl}${API_ENDPOINTS.DOCUMENTS_UPLOAD}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
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
