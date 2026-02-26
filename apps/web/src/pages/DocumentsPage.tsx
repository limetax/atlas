import { useMemo, useRef, useState } from 'react';

import { Loader2, Search, Upload } from 'lucide-react';

import { DocumentList } from '@/components/features/documents/DocumentList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useDocuments } from '@/hooks/useDocuments';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

export const DocumentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    documents,
    isLoading,
    isError,
    uploadDocuments,
    isUploadingDocuments,
    deleteDocument,
    isDeletingDocument,
  } = useDocuments();

  const filteredDocuments = useMemo(() => {
    if (!searchTerm.trim()) return documents;
    const term = searchTerm.toLowerCase();
    return documents.filter((doc) => doc.name.toLowerCase().includes(term));
  }, [documents, searchTerm]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) =>
      ALLOWED_MIME_TYPES.includes(f.type)
    );
    e.target.value = '';

    if (files.length === 0) return;
    uploadDocuments(files);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-background">
      <div className="px-8 pt-10 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Dokumente</h1>
              <p className="text-muted-foreground">Zentrale Dokumentenbibliothek Ihrer Kanzlei</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf,.jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp"
              multiple
              className="hidden"
              onChange={handleFileInputChange}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingDocuments}
              className="shrink-0"
            >
              {isUploadingDocuments ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {isUploadingDocuments ? 'Wird hochgeladen…' : 'Hochladen'}
            </Button>
          </div>

          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Nach Name suchen…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <DocumentListSkeleton />
          ) : isError ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Dokumente konnten nicht geladen werden</p>
            </div>
          ) : (
            <DocumentList
              documents={filteredDocuments}
              hasSearch={searchTerm.trim().length > 0}
              onDelete={deleteDocument}
              isDeletingDocument={isDeletingDocument}
            />
          )}
        </div>
      </div>
    </main>
  );
};

const DocumentListSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    ))}
  </div>
);
