import { Check, Loader2 } from 'lucide-react';

import type { ToolCallState } from '@/hooks/useChatStream';
import { cn } from '@/lib/utils';

import { getToolLabel } from './tool-labels';

type ChatStreamingIndicatorProps = {
  className?: string;
  activeToolCalls?: ToolCallState[];
  streamingStatus?: string | null;
};

export const ChatStreamingIndicator = ({
  className,
  activeToolCalls = [],
  streamingStatus,
}: ChatStreamingIndicatorProps) => {
  const hasStatus = Boolean(streamingStatus);
  const hasToolCalls = activeToolCalls.length > 0;

  // Nothing to show
  if (!hasStatus && !hasToolCalls) {
    return (
      <div className={cn('flex justify-start', className)}>
        <div className="flex items-center gap-2 px-4 py-3">
          <Loader2 className="w-4 h-4 text-muted-foreground animate-spin flex-shrink-0" />
          <span className="text-sm text-muted-foreground">Verarbeitet...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex justify-start', className)}>
      <div className="flex flex-col gap-1.5 px-4 py-3">
        {/* Status phase label */}
        {hasStatus && (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin flex-shrink-0" />
            <span className="text-sm text-muted-foreground">{streamingStatus}</span>
          </div>
        )}

        {/* Tool call list */}
        {activeToolCalls.map((tc, index) => (
          <div key={`${tc.name}-${index}`} className="flex items-center gap-2">
            {tc.status === 'started' ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-primary flex-shrink-0" />
            )}
            <span
              className={cn(
                'text-sm',
                tc.status === 'completed' ? 'text-muted-foreground' : 'text-foreground'
              )}
            >
              {getToolLabel(tc.name)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
