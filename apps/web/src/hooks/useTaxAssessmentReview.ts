import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';
import { streamTaxAssessmentReview } from '@/lib/tax-assessment-api';

type ReviewPhase = 'idle' | 'reviewing' | 'completed';

type UseTaxAssessmentReviewReturn = {
  startReview: (assessmentDocumentId: string) => Promise<void>;
  clearReview: () => void;
  phase: ReviewPhase;
  streamingText: string;
  completedChatId: string | undefined;
};

/**
 * Hook for starting a tax assessment review.
 *
 * Flow:
 * 1. Starts the SSE stream — phase transitions to 'reviewing'
 * 2. On chat_created: stores the chatId, keeps consuming the stream
 * 3. On text chunks: appends to streamingText (displayed live on the page)
 * 4. On done: phase transitions to 'completed', sets completedChatId
 *    (no auto-navigation — the advisor may need to act in DATEV first)
 * 5. clearReview: resets to 'idle' so the user goes back to the overview
 */
export const useTaxAssessmentReview = (sandboxMode = false): UseTaxAssessmentReviewReturn => {
  const { getToken } = useAuthContext();
  const [phase, setPhase] = useState<ReviewPhase>('idle');
  const [streamingText, setStreamingText] = useState('');
  const [completedChatId, setCompletedChatId] = useState<string | undefined>(undefined);
  const pendingChatIdRef = useRef<string | undefined>(undefined);

  const startReview = useCallback(
    async (assessmentDocumentId: string) => {
      const token = getToken() ?? '';
      setPhase('reviewing');
      setStreamingText('');
      setCompletedChatId(undefined);
      pendingChatIdRef.current = undefined;

      try {
        for await (const chunk of streamTaxAssessmentReview(
          assessmentDocumentId,
          token,
          sandboxMode
        )) {
          if (chunk.type === 'chat_created' && chunk.chatId) {
            pendingChatIdRef.current = chunk.chatId;
          } else if (chunk.type === 'text' && chunk.content) {
            setStreamingText((prev) => prev + chunk.content);
          } else if (chunk.type === 'done') {
            setCompletedChatId(pendingChatIdRef.current);
            setPhase('completed');
            break; // stop consuming — SSE connection closes after 'done'
          } else if (chunk.type === 'error') {
            toast.error(chunk.error ?? 'Fehler beim Starten der Bescheidprüfung');
            setPhase('idle');
          }
        }
      } catch {
        toast.error('Bescheidprüfung konnte nicht gestartet werden');
        setPhase('idle');
      }
    },
    [getToken, sandboxMode]
  );

  const clearReview = useCallback(() => {
    setPhase('idle');
    setStreamingText('');
    setCompletedChatId(undefined);
    pendingChatIdRef.current = undefined;
  }, []);

  return { startReview, clearReview, phase, streamingText, completedChatId };
};
