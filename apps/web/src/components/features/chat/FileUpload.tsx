import { type DragEvent } from 'react';

import { FileText, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/utils';
import { isValidPdfFile } from '@/utils/validators';

// ─── DropZoneOverlay ──────────────────────────────────────────────────────────

type DropZoneOverlayProps = {
  isVisible: boolean;
  onDrop: (files: File[]) => void;
};

export const DropZoneOverlay = ({ isVisible, onDrop }: DropZoneOverlayProps) => {
  if (!isVisible) return null;

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) => isValidPdfFile(f));
    if (droppedFiles.length > 0) {
      onDrop(droppedFiles);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-accent/80 backdrop-blur-sm"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary/60 bg-card px-12 py-10 shadow-lg">
        <Upload className="h-10 w-10 text-primary" />
        <p className="text-sm font-medium text-foreground">PDF hier ablegen</p>
        <p className="text-xs text-muted-foreground">Max. 10 MB pro Datei</p>
      </div>
    </div>
  );
};

// ─── PendingFileList ──────────────────────────────────────────────────────────

type PendingFileListProps = {
  pendingFiles: File[];
  onRemovePending: (index: number) => void;
};

export const PendingFileList = ({ pendingFiles, onRemovePending }: PendingFileListProps) => {
  if (pendingFiles.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {pendingFiles.map((file, index) => (
        <PendingFileChip
          key={`${file.name}-${file.size}-${file.lastModified}`}
          file={file}
          onRemove={() => onRemovePending(index)}
        />
      ))}
    </div>
  );
};

// ─── File Chips ───────────────────────────────────────────────────────────────

type PendingFileChipProps = {
  file: File;
  onRemove: () => void;
};

const PendingFileChip = ({ file, onRemove }: PendingFileChipProps) => (
  <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs">
    <FileText className="h-3.5 w-3.5 text-primary flex-shrink-0" />
    <span className="truncate max-w-[140px] text-foreground">{file.name}</span>
    <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-4 w-4 p-0 hover:bg-secondary"
      onClick={onRemove}
    >
      <X className="h-3 w-3 text-muted-foreground" />
    </Button>
  </div>
);
