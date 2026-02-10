import React from 'react';

import { FileText, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/utils/formatters';
import { isValidPdfFile } from '@/utils/validators';

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

    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) => isValidPdfFile(f));
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
  onRemovePending: (index: number) => void;
};

export const PendingFileList: React.FC<PendingFileListProps> = ({
  pendingFiles,
  onRemovePending,
}) => {
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
