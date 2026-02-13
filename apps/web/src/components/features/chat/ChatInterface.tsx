import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { Paperclip, Send, StopCircle } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';

import { Button } from '@/components/ui/button';
import { isValidPdfFile } from '@/utils/validators';
import { ChatContext, Message } from '@atlas/shared';

import { ChatEmptyState } from './ChatEmptyState';
import { ChatMessage } from './ChatMessage';
import { ChatScrollAnchor } from './ChatScrollAnchor';
import { ChatStreamingIndicator } from './ChatStreamingIndicator';
import { ContextToggles } from './context/ContextToggles';
import { DropZoneOverlay, PendingFileList } from './FileUpload';

export type ToolCallState = {
  name: string;
  status: 'started' | 'completed';
};

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
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
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
}) => {
  const [inputValue, setInputValue] = useState(initialContent || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((inputValue.trim() || pendingFiles.length > 0) && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if ((inputValue.trim() || pendingFiles.length > 0) && !isLoading) {
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

      <MessagesArea
        messages={messages}
        isLoading={isLoading}
        activeToolCalls={activeToolCalls}
        messagesEndRef={messagesEndRef}
      />

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
      />
    </div>
  );
};

type MessagesAreaProps = {
  messages: Message[];
  isLoading: boolean;
  activeToolCalls: ToolCallState[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
};

const MessagesArea = ({
  messages,
  isLoading,
  activeToolCalls,
  messagesEndRef,
}: MessagesAreaProps) => {
  // Show minimal empty state when no messages
  if (messages.length === 0) {
    return <ChatEmptyState />;
  }

  // Only show indicator when loading AND no assistant message is streaming yet
  const lastMessage = messages[messages.length - 1];
  const showIndicator = isLoading && lastMessage?.role !== 'assistant';

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 min-h-0">
      <div className="max-w-4xl mx-auto space-y-6">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {showIndicator && <ChatStreamingIndicator activeToolCalls={activeToolCalls} />}

        <ChatScrollAnchor trackVisibility />
        <div ref={messagesEndRef} />
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
}: InputAreaProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const validFiles = files.filter((f) => isValidPdfFile(f));
    if (validFiles.length > 0) {
      onAddFiles(validFiles);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const hasPendingContent = inputValue.trim() || pendingFiles.length > 0;

  return (
    <div className="flex-shrink-0 bg-card border-t border-border p-4">
      <form onSubmit={onSubmit} className="max-w-4xl mx-auto">
        <div className="flex gap-3 items-end">
          {/* Paperclip button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-muted-foreground hover:text-primary flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            title="PDF hochladen"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />

          <TextareaAutosize
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Geben Sie Limetax App eine Aufgabe oder stellen Sie eine Frage"
            disabled={isLoading}
            minRows={1}
            maxRows={8}
            className="flex-1 px-4 py-3 text-sm bg-background border border-input rounded-xl outline-none transition-all duration-150 resize-none focus:border-primary focus:ring-4 focus:ring-ring/10 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              lineHeight: '1.5',
              transition: 'height 0.3s ease-out',
            }}
          />
          {isLoading ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onCancelRequest}
              className="h-10 w-10 border-destructive/50 text-destructive hover:bg-error-bg hover:border-destructive flex-shrink-0"
            >
              <StopCircle className="w-5 h-5" />
            </Button>
          ) : (
            <Button type="submit" variant="default" size="default" disabled={!hasPendingContent}>
              <Send className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Pending files (not yet sent) */}
        <PendingFileList pendingFiles={pendingFiles} onRemovePending={onRemovePendingFile} />

        {/* Context toggles and hint */}
        <div className="flex items-center justify-between mt-2">
          <ContextToggles context={context} onContextChange={onContextChange} />
          {inputValue.length > 0 && (
            <span className="text-xs text-muted-foreground">Shift+Enter für neue Zeile</span>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-2 text-center">
          Limetax App kann Fehler machen. Überprüfen Sie wichtige Informationen.
        </p>
      </form>
    </div>
  );
};
