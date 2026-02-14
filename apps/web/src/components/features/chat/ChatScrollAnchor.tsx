import React, { useEffect, useRef } from 'react';

import { ArrowDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ChatScrollAnchorProps = {
  trackVisibility?: boolean;
  scrollToBottom?: () => void;
};

export const ChatScrollAnchor = ({
  trackVisibility = false,
  scrollToBottom,
}: ChatScrollAnchorProps) => {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = React.useState(false);

  useEffect(() => {
    if (!trackVisibility || !anchorRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries[0]?.isIntersecting ?? false;
        setShowScrollButton(!isVisible);
      },
      {
        threshold: 0.5,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    observer.observe(anchorRef.current);

    return () => {
      observer.disconnect();
    };
  }, [trackVisibility]);

  return (
    <>
      <div ref={anchorRef} className="h-px w-full" />
      {trackVisibility && showScrollButton && scrollToBottom && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-10">
          <Button
            onClick={scrollToBottom}
            size="sm"
            variant="secondary"
            className={cn(
              'shadow-lg rounded-full px-3',
              'bg-card border border-border hover:bg-muted',
              'transition-all duration-200'
            )}
          >
            <ArrowDown className="w-4 h-4 mr-1" />
            Scroll to bottom
          </Button>
        </div>
      )}
    </>
  );
};
