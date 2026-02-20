import { useState } from 'react';
import { Download, FileImage, FileText, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { type Document } from '@atlas/shared';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { formatFileSize } from '@/lib/utils';

type DocumentRowProps = {
  document: Document;
  onDelete: (documentId: string) => void;
  isDeleting: boolean;
};

export const DocumentRow = ({ document, onDelete, isDeleting }: DocumentRowProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const utils = trpc.useUtils();

  const isImage = document.mimeType.startsWith('image/');
  const FileIcon = isImage ? FileImage : FileText;

  const formattedSize = formatFileSize(document.sizeBytes);
  const formattedDate = new Date(document.createdAt).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const result = await utils.document.getDownloadUrl.fetch({ documentId: document.id });
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Download-Link konnte nicht erstellt werden');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors group">
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted shrink-0">
        <FileIcon className="w-5 h-5 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{document.name}</p>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
          <span>{formattedSize}</span>
          <span>{formattedDate}</span>
          {document.status === 'processing' && (
            <span className="flex items-center gap-1 text-amber-600">
              <Loader2 className="w-3 h-3 animate-spin" />
              Wird verarbeitet…
            </span>
          )}
          {document.status === 'error' && (
            <span className="text-destructive">Verarbeitungsfehler</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={handleDownload}
          disabled={isDownloading || document.status !== 'ready'}
          title="Herunterladen"
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(document.id)}
          disabled={isDeleting}
          title="Löschen"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
