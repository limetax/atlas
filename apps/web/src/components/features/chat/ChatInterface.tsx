import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { FileImage, FileText, Library, Paperclip, StopCircle } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';

import { Button } from '@/components/ui/button';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { type ToolCallState } from '@/hooks/useChatStream';
import { isValidPdfFile } from '@/utils/validators';
import { ChatContext, type Document, Message } from '@atlas/shared';

import { ChatEmptyState } from './ChatEmptyState';
import { ChatMessage } from './ChatMessage';
import { ChatStreamingIndicator } from './ChatStreamingIndicator';
import { ContextToggles } from './context/ContextToggles';
import { DeepThinkingToggle } from './context/DeepThinkingToggle';
import { DocumentPickerModal } from './DocumentPickerModal';
import { DropZoneOverlay, PendingFileList } from './FileUpload';

type ChatInterfaceProps = {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onCancelRequest?: () => void;
  isLoading?: boolean;
  activeToolCalls?: ToolCallState[];
  initialContent?: string;
  context: ChatContext;
  onContextChange: (context: ChatContext) => void;
  pendingFiles: File[];
  onAddFiles: (files: File[]) => void;
  onRemovePendingFile: (index: number) => void;
  linkedDocuments?: Document[];
  pendingDocuments?: Document[];
  onDocumentSelect?: (docs: Document[]) => void;
};

export const ChatInterface = ({
  messages,
  onSendMessage,
  onCancelRequest,
  isLoading = false,
  activeToolCalls = [],
  initialContent,
  context,
  onContextChange,
  pendingFiles,
  onAddFiles,
  onRemovePendingFile,
  linkedDocuments = [],
  pendingDocuments = [],
  onDocumentSelect,
}: ChatInterfaceProps) => {
  const [inputValue, setInputValue] = useState(initialContent || '');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  // Update input when initialContent changes (template insertion from navigation)
  useLayoutEffect(() => {
    if (initialContent && inputRef.current) {
      setInputValue(initialContent);
      inputRef.current.focus();
    }
  }, [initialContent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && !isLoading) {
        onSendMessage(inputValue.trim());
        setInputValue('');
      }
    }
  };

  // ─── Drag-and-drop handlers (on outer container) ──────────────────────────

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (files: File[]) => {
      setIsDragOver(false);
      dragCounterRef.current = 0;
      onAddFiles(files);
    },
    [onAddFiles]
  );

  return (
    <div
      className="relative flex flex-col h-full bg-background overflow-hidden"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
    >
      <DropZoneOverlay isVisible={isDragOver} onDrop={handleDrop} />

      <MessagesArea messages={messages} isLoading={isLoading} activeToolCalls={activeToolCalls} />

      <InputArea
        inputValue={inputValue}
        setInputValue={setInputValue}
        inputRef={inputRef}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        onCancelRequest={onCancelRequest}
        context={context}
        onContextChange={onContextChange}
        pendingFiles={pendingFiles}
        onAddFiles={onAddFiles}
        onRemovePendingFile={onRemovePendingFile}
        linkedDocuments={linkedDocuments}
        pendingDocuments={pendingDocuments}
        onDocumentSelect={onDocumentSelect}
      />
    </div>
  );
};

type MessagesAreaProps = {
  messages: Message[];
  isLoading: boolean;
  activeToolCalls: ToolCallState[];
};

const MessagesArea = ({ messages, isLoading, activeToolCalls }: MessagesAreaProps) => {
  const { scrollContainerRef, handleScroll } = useAutoScroll(messages);

  // Show minimal empty state when no messages
  if (messages.length === 0) {
    return <ChatEmptyState />;
  }

  // Only show indicator when loading AND no assistant message is streaming yet
  const lastMessage = messages[messages.length - 1];
  const showIndicator = isLoading && lastMessage?.role !== 'assistant';

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto [overflow-anchor:none] [overscroll-behavior-y:contain] px-4 py-6 min-h-0"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {showIndicator && <ChatStreamingIndicator activeToolCalls={activeToolCalls} />}
      </div>
    </div>
  );
};

type InputAreaProps = {
  inputValue: string;
  setInputValue: (value: string) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onCancelRequest?: () => void;
  context: ChatContext;
  onContextChange: (context: ChatContext) => void;
  pendingFiles: File[];
  onAddFiles: (files: File[]) => void;
  onRemovePendingFile: (index: number) => void;
  linkedDocuments: Document[];
  pendingDocuments: Document[];
  onDocumentSelect?: (docs: Document[]) => void;
};

const InputArea = ({
  inputValue,
  setInputValue,
  inputRef,
  isLoading,
  onSubmit,
  onKeyDown,
  onCancelRequest,
  context,
  onContextChange,
  pendingFiles,
  onAddFiles,
  onRemovePendingFile,
  linkedDocuments,
  pendingDocuments,
  onDocumentSelect,
}: InputAreaProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeepThinking, setIsDeepThinking] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const validFiles = files.filter((f) => isValidPdfFile(f));
    if (validFiles.length > 0) {
      onAddFiles(validFiles);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const hasPendingContent = Boolean(inputValue.trim());

  const excludedIds = new Set([
    ...linkedDocuments.map((d) => d.id),
    ...pendingDocuments.map((d) => d.id),
  ]);

  const hasLinkedDocs = linkedDocuments.length > 0 || pendingDocuments.length > 0;

  return (
    <div className="flex-shrink-0 bg-background/80 backdrop-blur-sm pb-10 pt-4 px-6">
      <form onSubmit={onSubmit} className="max-w-4xl mx-auto">
        {/* Main input card */}
        <div className="relative bg-card rounded-xl shadow-lg border border-border focus-within:ring-2 focus-within:ring-ring/20 focus-within:border-ring transition-all flex flex-col min-h-[120px]">
          {/* Textarea section */}
          <div className="px-4 pt-4 pb-2 flex-1">
            <TextareaAutosize
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Geben Sie Limetax eine Aufgabe oder stellen Sie eine Frage"
              disabled={isLoading}
              minRows={2}
              maxRows={8}
              className="w-full bg-transparent border-none text-foreground placeholder:text-muted-foreground focus:ring-0 focus:outline-none resize-none text-base leading-relaxed p-0 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Pending files (not yet sent) */}
          {pendingFiles.length > 0 && (
            <div className="px-4 pb-2">
              <PendingFileList pendingFiles={pendingFiles} onRemovePending={onRemovePendingFile} />
            </div>
          )}

          {/* Linked/pending documents strip */}
          {hasLinkedDocs && (
            <div className="px-4 pb-2">
              <LinkedDocumentsStrip
                linkedDocuments={linkedDocuments}
                pendingDocuments={pendingDocuments}
              />
            </div>
          )}

          {/* Bottom controls section */}
          <div className="flex items-center justify-between px-3 pb-3 mt-2 gap-3 flex-wrap">
            {/* Left: Context controls */}
            <div className="flex items-center gap-3 flex-wrap">
              <DeepThinkingToggle enabled={isDeepThinking} onChange={setIsDeepThinking} />
              <div className="h-4 w-px bg-border" />
              <ContextToggles context={context} onContextChange={onContextChange} />
            </div>

            {/* Right: Action buttons */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf,.jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                title="Datei hochladen"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                onClick={() => setIsPickerOpen(true)}
                disabled={isLoading}
                title="Dokument aus Bibliothek anhängen"
              >
                <Library className="h-5 w-5" />
              </Button>
              <DocumentPickerModal
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                onSelect={(docs) => {
                  onDocumentSelect?.(docs);
                  setIsPickerOpen(false);
                }}
                excludedIds={excludedIds}
              />
              {isLoading ? (
                <Button
                  type="button"
                  variant="default"
                  size="default"
                  onClick={onCancelRequest}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  <span>Stoppen</span>
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="default"
                  size="default"
                  disabled={!hasPendingContent}
                  className="bg-foreground text-background hover:bg-foreground/90"
                >
                  <span>Fragen</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Disclaimer text */}
        <p className="text-[11px] text-muted-foreground font-medium mt-4 text-center">
          Limetax App kann Fehler machen. Überprüfen Sie wichtige Informationen.
        </p>
      </form>
    </div>
  );
};

type LinkedDocumentsStripProps = {
  linkedDocuments: Document[];
  pendingDocuments: Document[];
  onRemovePending?: (documentId: string) => void;
};

const LinkedDocumentsStrip = ({ linkedDocuments, pendingDocuments }: LinkedDocumentsStripProps) => (
  <div className="flex flex-wrap gap-1.5">
    {linkedDocuments.map((doc) => (
      <DocumentChip key={doc.id} doc={doc} />
    ))}
    {pendingDocuments.map((doc) => (
      <DocumentChip key={doc.id} doc={doc} />
    ))}
  </div>
);

type DocumentChipProps = {
  doc: Document;
};

const DocumentChip = ({ doc }: DocumentChipProps) => {
  const isImage = doc.mimeType.startsWith('image/');
  const FileIcon = isImage ? FileImage : FileText;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs">
      <FileIcon className="w-3.5 h-3.5 shrink-0" />
      <span className="max-w-[140px] truncate">{doc.name}</span>
    </div>
  );
};
