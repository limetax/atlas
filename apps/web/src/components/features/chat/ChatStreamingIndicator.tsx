import React from 'react';
import { cn } from '@/lib/utils';

interface ChatStreamingIndicatorProps {
  className?: string;
}

export const ChatStreamingIndicator: React.FC<ChatStreamingIndicatorProps> = ({ className }) => {
  return (
    <div className={cn('flex gap-4 justify-start', className)}>
      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md border border-gray-100">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-lime-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 bg-lime-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 bg-lime-500 rounded-full animate-bounce" />
        </div>
      </div>
      <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-sm">
        <p className="text-sm text-gray-500">Denke nach...</p>
      </div>
    </div>
  );
};
