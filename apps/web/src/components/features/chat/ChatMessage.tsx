import React from 'react';

import { Check, ExternalLink } from 'lucide-react';
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
  const enrichedContent = enrichContentWithLinks(message.content, message.citations);

  return (
    <div className={cn('flex gap-4', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <Avatar className="flex-shrink-0 border-2 border-white shadow-md">
          <AvatarImage src="/icon.png" alt="limetax logo" />
          <AvatarFallback className="bg-lime-50 text-lime-600">LI</AvatarFallback>
        </Avatar>
      )}

      <div className={cn('flex flex-col gap-2 max-w-[75%]', isUser ? 'items-end' : 'items-start')}>
        {/* Tool calls — rendered above assistant message bubble */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-col gap-1 mb-1">
            {message.toolCalls.map((tc, index) => (
              <div
                key={`${tc.name}-${index}`}
                className="flex items-center gap-2 text-xs text-gray-500"
              >
                <Check className="w-3 h-3 text-lime-600 flex-shrink-0" />
                <span>{getToolLabel(tc.name)}</span>
              </div>
            ))}
          </div>
        )}

        <Card
          className={cn(
            'px-4 py-3 rounded-2xl border',
            isUser
              ? 'bg-blue-200 text-gray-900 rounded-tr-sm shadow-md border-blue-300'
              : 'bg-gray-50 border-gray-200 rounded-tl-sm shadow-sm'
          )}
        >
          <div
            className={cn(
              'text-sm leading-relaxed prose prose-sm max-w-none',
              isUser && 'prose-invert'
            )}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={
                {
                  a: ({ href, children, ...props }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-lime-600 hover:text-lime-700 underline font-medium"
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

        <span className="text-xs text-gray-400">
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
