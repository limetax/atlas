import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '@atlas/shared';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { User, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: Message;
}

// Helper function to generate law book URLs
function getLawBookUrl(citation: string): string | null {
  // Extract paragraph number and law type
  const aoMatch = citation.match(/§\s*(\d+[a-z]?)\s*AO/i);
  const ustgMatch = citation.match(/§\s*(\d+[a-z]?)\s*UStG/i);
  const estgMatch = citation.match(/§\s*(\d+[a-z]?)\s*EStG/i);

  if (aoMatch) {
    const paragraph = aoMatch[1].toLowerCase();
    return `https://www.gesetze-im-internet.de/ao_1977/__${paragraph}.html`;
  } else if (ustgMatch) {
    const paragraph = ustgMatch[1].toLowerCase();
    return `https://www.gesetze-im-internet.de/ustg_1980/__${paragraph}.html`;
  } else if (estgMatch) {
    const paragraph = estgMatch[1].toLowerCase();
    return `https://www.gesetze-im-internet.de/estg/__${paragraph}.html`;
  }

  return null;
}

// Helper function to make citations clickable in text
function enrichContentWithLinks(content: string, citations: Message['citations']): string {
  if (!citations || citations.length === 0) return content;

  let enrichedContent = content;

  citations.forEach((citation) => {
    const url = getLawBookUrl(citation.source);
    if (url) {
      // Replace citation references in text with markdown links
      const regex = new RegExp(`(${citation.source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'g');
      enrichedContent = enrichedContent.replace(regex, `[$1](${url} "${citation.title}")`);
    }
  });

  return enrichedContent;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
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
              components={{
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
              }}
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

      {isUser && (
        <Avatar className="flex-shrink-0 border-2 border-white shadow-md bg-purple-400">
          <AvatarFallback className="bg-purple-400 text-white">
            <User className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};
