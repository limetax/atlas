import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type ChatLoadingStateProps = {
  className?: string;
  count?: number;
};

export const ChatLoadingState: React.FC<ChatLoadingStateProps> = ({ className, count = 3 }) => {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <ChatMessageSkeleton key={i} isUser={i % 2 === 0} />
      ))}
    </div>
  );
};

const ChatMessageSkeleton: React.FC<{ isUser: boolean }> = ({ isUser }) => {
  return (
    <div className={cn('flex gap-4', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />}

      <div className={cn('flex flex-col gap-2', isUser ? 'items-end' : 'items-start', 'max-w-2xl')}>
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-4 w-24" />
      </div>

      {isUser && <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />}
    </div>
  );
};
