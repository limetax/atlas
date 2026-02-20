import { Files } from 'lucide-react';
import { type Document } from '@atlas/shared';
import { DocumentRow } from './DocumentRow';

type DocumentListProps = {
  documents: Document[];
  hasSearch: boolean;
  onDelete: (documentId: string) => void;
  isDeletingDocument: boolean;
};

export const DocumentList = ({
  documents,
  hasSearch,
  onDelete,
  isDeletingDocument,
}: DocumentListProps) => {
  if (documents.length === 0) {
    return (
      <div className="text-center py-16">
        <Files className="w-12 h-12 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-muted-foreground">
          {hasSearch ? 'Keine Dokumente gefunden' : 'Noch keine Dokumente hochgeladen'}
        </p>
        {!hasSearch && (
          <p className="text-sm text-muted-foreground mt-1">
            Laden Sie PDFs oder Bilder hoch, um sie hier zu verwalten
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <DocumentRow
          key={doc.id}
          document={doc}
          onDelete={onDelete}
          isDeleting={isDeletingDocument}
        />
      ))}
    </div>
  );
};
