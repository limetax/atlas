import React, { useDeferredValue } from 'react';

import { Check, ExternalLink, FileText } from 'lucide-react';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { LAW_BOOKS } from '@/constants/law-books';
import { cn } from '@/lib/utils';
import { Message } from '@atlas/shared';

import { EmailDraftCard } from './EmailDraftCard';
import { getToolLabel } from './tool-labels';

type ChatMessageProps = {
  message: Message;
};

// Helper function to generate law book URLs using configured patterns
function getLawBookUrl(citation: string): string | null {
  for (const book of Object.values(LAW_BOOKS)) {
    const match = citation.match(book.pattern);
    if (match) {
      const paragraph = match[1].toLowerCase();
      return book.urlTemplate.replace('${paragraph}', paragraph);
    }
  }
  return null;
}

// Helper function to make citations clickable in text
function enrichContentWithLinks(content: string, citations: Message['citations']): string {
  if (!citations || citations.length === 0) return content;

  let enrichedContent = content;
  const replacements = new Map<string, string>();

  // Build replacement map first to avoid repeated processing
  citations.forEach((citation) => {
    const url = getLawBookUrl(citation.source);
    if (url && !replacements.has(citation.source)) {
      replacements.set(citation.source, `[${citation.source}](${url} "${citation.title}")`);
    }
  });

  // Apply all replacements
  replacements.forEach((replacement, source) => {
    const escapedSource = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedSource})`, 'g');
    enrichedContent = enrichedContent.replace(regex, replacement);
  });

  return enrichedContent;
}

// React.memo prevents re-rendering all messages when a new one is added
export const ChatMessage = React.memo<ChatMessageProps>(({ message }) => {
  const isUser = message.role === 'user';
  const deferredContent = useDeferredValue(message.content);
  const enrichedContent = enrichContentWithLinks(deferredContent, message.citations);

  return (
    <div className={cn('flex gap-5', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <Avatar className="flex-shrink-0 w-8 h-8 rounded-sm">
          <AvatarImage src="/icon.png" alt="limetax logo" />
          <AvatarFallback className="bg-[var(--chat-avatar-bg)] text-[var(--chat-avatar-text)]">
            LI
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          'flex flex-col gap-1',
          isUser ? 'items-end max-w-[65%]' : 'items-start max-w-[85%]'
        )}
      >
        {/* Tool calls — rendered above assistant message bubble */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-col gap-1 mb-1">
            {message.toolCalls.map((tc, index) => (
              <div
                key={`${tc.name}-${index}`}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <Check className="w-3 h-3 text-primary flex-shrink-0" />
                <span>{getToolLabel(tc.name)}</span>
              </div>
            ))}
          </div>
        )}

        <Card
          className={cn(
            'rounded-2xl',
            isUser
              ? 'bg-[var(--chat-message-user-bg)] text-[var(--chat-message-user-text)] rounded-tr-sm px-6 py-4 border-0 shadow-none'
              : 'bg-[var(--chat-message-assistant-bg)] border border-[var(--chat-message-assistant-border)] text-[var(--chat-message-assistant-text)] rounded-tl-sm shadow-sm px-8 py-6'
          )}
        >
          <div className="text-[15px] leading-relaxed prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={
                {
                  a: ({ href, children, ...props }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:text-primary/80 underline font-medium"
                      {...props}
                    >
                      {children}
                      <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  ),
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className ?? '');
                    const language = match?.[1] ?? '';

                    // Render email blocks as EmailDraftCard (only for code blocks, not inline code)
                    // Inline code won't have a language class
                    if (language === 'email') {
                      return <EmailDraftCard content={String(children)} />;
                    }

                    // Default code rendering for other languages
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children, ...props }) => {
                    // Check if this pre contains an email code block
                    const hasEmailBlock = React.Children.toArray(children).some((child) => {
                      if (!React.isValidElement(child)) {
                        return false;
                      }
                      // Type guard: check if props exists and has className property
                      const childProps = child.props as { className?: string };
                      return (
                        typeof childProps.className === 'string' &&
                        childProps.className.includes('language-email')
                      );
                    });

                    if (hasEmailBlock) {
                      return <>{children}</>;
                    }

                    return <pre {...props}>{children}</pre>;
                  },
                } satisfies Components
              }
            >
              {enrichedContent}
            </ReactMarkdown>
          </div>
        </Card>

        {/* File attachments on user messages */}
        {isUser && message.attachedFiles && message.attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.attachedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded border border-[var(--chat-attachment-border)] bg-[var(--chat-attachment-bg)] px-3 py-1.5 text-xs text-[var(--chat-attachment-text)] shadow-sm"
              >
                <FileText className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span className="truncate max-w-[200px] font-medium">{file.name}</span>
              </div>
            ))}
          </div>
        )}

        <span className={cn('text-xs text-[var(--chat-timestamp-text)]', isUser && 'mr-1')}>
          {message.timestamp
            ? new Date(message.timestamp).toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : ''}
        </span>
      </div>
    </div>
  );
});
