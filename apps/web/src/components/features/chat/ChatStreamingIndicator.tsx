import React from 'react';
import { Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getToolLabel } from './tool-labels';
import type { ToolCallState } from './ChatInterface';

type ChatStreamingIndicatorProps = {
  className?: string;
  activeToolCalls?: ToolCallState[];
};

export const ChatStreamingIndicator: React.FC<ChatStreamingIndicatorProps> = ({
  className,
  activeToolCalls = [],
}) => {
  return (
    <div className={cn('flex gap-4 justify-start', className)}>
      {/* Bouncing dots avatar */}
      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md border border-gray-100 flex-shrink-0">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-lime-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 bg-lime-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 bg-lime-500 rounded-full animate-bounce" />
        </div>
      </div>

      {/* Content bubble — only show when tool calls exist */}
      {activeToolCalls.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-sm">
          <div className="flex flex-col gap-1.5">
            {activeToolCalls.map((tc, index) => (
              <div key={`${tc.name}-${index}`} className="flex items-center gap-2">
                {tc.status === 'started' ? (
                  <Loader2 className="w-4 h-4 text-lime-500 animate-spin flex-shrink-0" />
                ) : (
                  <Check className="w-4 h-4 text-lime-600 flex-shrink-0" />
                )}
                <span
                  className={cn(
                    'text-sm',
                    tc.status === 'completed' ? 'text-gray-400' : 'text-gray-600'
                  )}
                >
                  {getToolLabel(tc.name)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
