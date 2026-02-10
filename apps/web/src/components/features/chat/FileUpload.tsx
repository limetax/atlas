import React from 'react';
import { FileText, Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ChatDocument } from '@atlas/shared';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validatePdfFile(file: File): string | null {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return 'Nur PDF-Dateien sind erlaubt';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'Datei darf maximal 10 MB groß sein';
  }
  return null;
}

// ─── DropZoneOverlay ──────────────────────────────────────────────────────────

type DropZoneOverlayProps = {
  isVisible: boolean;
  onDrop: (files: File[]) => void;
};

export const DropZoneOverlay: React.FC<DropZoneOverlayProps> = ({ isVisible, onDrop }) => {
  if (!isVisible) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) => !validatePdfFile(f));
    if (droppedFiles.length > 0) {
      onDrop(droppedFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-orange-50/80 backdrop-blur-sm"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-orange-400 bg-white px-12 py-10 shadow-lg">
        <Upload className="h-10 w-10 text-orange-500" />
        <p className="text-sm font-medium text-gray-700">PDF hier ablegen</p>
        <p className="text-xs text-gray-400">Max. 10 MB pro Datei</p>
      </div>
    </div>
  );
};

// ─── PendingFileList ──────────────────────────────────────────────────────────

type PendingFileListProps = {
  pendingFiles: File[];
  documents?: ChatDocument[];
  onRemovePending: (index: number) => void;
  onRemoveDocument?: (documentId: string) => void;
};

export const PendingFileList: React.FC<PendingFileListProps> = ({
  pendingFiles,
  documents = [],
  onRemovePending,
  onRemoveDocument,
}) => {
  if (pendingFiles.length === 0 && documents.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {/* Pending files (not yet uploaded) */}
      {pendingFiles.map((file, index) => (
        <PendingFileChip
          key={`pending-${index}`}
          file={file}
          onRemove={() => onRemovePending(index)}
        />
      ))}

      {/* Already-uploaded documents */}
      {documents.map((doc) => (
        <DocumentChip
          key={doc.id}
          document={doc}
          onRemove={onRemoveDocument ? () => onRemoveDocument(doc.id) : undefined}
        />
      ))}
    </div>
  );
};

// ─── File Chips ───────────────────────────────────────────────────────────────

const PendingFileChip: React.FC<{ file: File; onRemove: () => void }> = ({ file, onRemove }) => (
  <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs">
    <FileText className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
    <span className="truncate max-w-[140px] text-gray-700">{file.name}</span>
    <span className="text-gray-400">{formatFileSize(file.size)}</span>
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-4 w-4 p-0 hover:bg-gray-200"
      onClick={onRemove}
    >
      <X className="h-3 w-3 text-gray-500" />
    </Button>
  </div>
);

const DocumentChip: React.FC<{ document: ChatDocument; onRemove?: () => void }> = ({
  document,
  onRemove,
}) => {
  const isProcessing = document.status === 'processing';
  const isError = document.status === 'error';

  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs ${
        isError
          ? 'border-red-200 bg-red-50'
          : isProcessing
            ? 'border-orange-200 bg-orange-50'
            : 'border-green-200 bg-green-50'
      }`}
    >
      {isProcessing ? (
        <Loader2 className="h-3.5 w-3.5 text-orange-500 animate-spin flex-shrink-0" />
      ) : isError ? (
        <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
      ) : (
        <FileText className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
      )}
      <span className="truncate max-w-[140px] text-gray-700">{document.fileName}</span>
      {isError && document.errorMessage && (
        <span className="text-red-500 truncate max-w-[100px]" title={document.errorMessage}>
          Fehler
        </span>
      )}
      {onRemove && !isProcessing && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-4 w-4 p-0 hover:bg-gray-200"
          onClick={onRemove}
        >
          <X className="h-3 w-3 text-gray-500" />
        </Button>
      )}
    </div>
  );
};

// ─── Utilities ────────────────────────────────────────────────────────────────

export { validatePdfFile, formatFileSize };
