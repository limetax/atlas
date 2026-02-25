import { type RefObject, useCallback, useEffect, useRef } from 'react';

const BOTTOM_THRESHOLD_PX = 40;

type AutoScrollReturn = {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  handleScroll: () => void;
};

/**
 * Manages auto-scroll-to-bottom for a streaming content container.
 *
 * Auto-scrolls when `trigger` changes unless the user has scrolled up.
 * Pauses when the user scrolls up (distanceFromBottom > BOTTOM_THRESHOLD_PX).
 * Resumes when the user scrolls back to the bottom.
 *
 * Uses direct scrollTop assignment — avoids scrollIntoView propagating to
 * ancestor scroll containers.
 */
export const useAutoScroll = (trigger: unknown): AutoScrollReturn => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrolledRef = useRef(false);

  useEffect(() => {
    if (isUserScrolledRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [trigger]);

  const handleScroll = useCallback((): void => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isUserScrolledRef.current = distanceFromBottom > BOTTOM_THRESHOLD_PX;
  }, []);

  return { scrollContainerRef, handleScroll };
};
