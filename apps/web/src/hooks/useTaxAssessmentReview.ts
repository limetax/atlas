import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { STORAGE_KEYS } from '@/constants';
import { streamTaxAssessmentReview } from '@/lib/tax-assessment-api';

type UseTaxAssessmentReviewReturn = {
  startReview: (assessmentDocumentId: string) => Promise<void>;
  isStarting: boolean;
  streamingText: string;
};

/**
 * Hook for starting a tax assessment review.
 *
 * Flow:
 * 1. Starts the SSE stream — shows loading on the Bescheid page
 * 2. On chat_created: stores the chatId, keeps consuming the stream
 * 3. On text chunks: appends to streamingText (displayed live on the page)
 * 4. On done: navigates to the chat with the full review already persisted
 */
export const useTaxAssessmentReview = (): UseTaxAssessmentReviewReturn => {
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const pendingChatIdRef = useRef<string | undefined>(undefined);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const startReview = useCallback(
    async (assessmentDocumentId: string) => {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ?? '';
      setIsStarting(true);
      setStreamingText('');
      pendingChatIdRef.current = undefined;

      try {
        for await (const chunk of streamTaxAssessmentReview(assessmentDocumentId, token)) {
          if (chunk.type === 'chat_created' && chunk.chatId) {
            pendingChatIdRef.current = chunk.chatId;
          } else if (chunk.type === 'text' && chunk.content) {
            setStreamingText((prev) => prev + chunk.content);
          } else if (chunk.type === 'done') {
            if (pendingChatIdRef.current && isMountedRef.current) {
              await navigate({
                to: '/chat/$chatId',
                params: { chatId: pendingChatIdRef.current },
              });
            }
          } else if (chunk.type === 'error') {
            toast.error(chunk.error ?? 'Fehler beim Starten der Bescheidprüfung');
          }
        }
      } catch {
        toast.error('Bescheidprüfung konnte nicht gestartet werden');
      } finally {
        setIsStarting(false);
        setStreamingText('');
        pendingChatIdRef.current = undefined;
      }
    },
    [navigate]
  );

  return { startReview, isStarting, streamingText };
};
