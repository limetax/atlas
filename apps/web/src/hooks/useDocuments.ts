import { toast } from 'sonner';

import { API_ENDPOINTS } from '@/constants';
import { apiClient } from '@/lib/api-client';
import { trpc } from '@/lib/trpc';
import { type Document } from '@atlas/shared';
import { useMutation } from '@tanstack/react-query';

type UseDocumentsReturn = {
  documents: Document[];
  isLoading: boolean;
  isError: boolean;
  uploadDocuments: (files: File[]) => void;
  isUploadingDocuments: boolean;
  deleteDocument: (documentId: string) => void;
  isDeletingDocument: boolean;
};

export const useDocuments = (): UseDocumentsReturn => {
  const utils = trpc.useUtils();

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

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      return apiClient.postForm(API_ENDPOINTS.DOCUMENTS_UPLOAD, formData);
    },
    onSuccess: (_data, files) => {
      toast.success(
        files.length === 1
          ? `„${files[0].name}" wurde hochgeladen`
          : `${files.length} Dokumente wurden hochgeladen`
      );
    },
    onError: () => {
      toast.error('Upload fehlgeschlagen');
    },
    onSettled: () => {
      void utils.document.listDocuments.invalidate();
    },
  });

  return {
    documents: documentsQuery.data ?? [],
    isLoading: documentsQuery.isLoading,
    isError: documentsQuery.isError,
    uploadDocuments: uploadMutation.mutate,
    isUploadingDocuments: uploadMutation.isPending,
    deleteDocument: (documentId: string) => deleteDocumentMutation.mutate({ documentId }),
    isDeletingDocument: deleteDocumentMutation.isPending,
  };
};
