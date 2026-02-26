import { API_ENDPOINTS } from '@/constants';
import { logger } from '@/utils/logger';
import { type ChatStreamChunk } from '@atlas/shared';
import { apiClient, ApiError } from '@/lib/api-client';
import { isChatStreamChunk } from '@/lib/chat-api';

/**
 * Streams tax assessment review using Server-Sent Events
 *
 * @param assessmentDocumentId - The DMS document ID of the assessment
 * @param sandboxMode - When true, backend uses fixture PDFs instead of DMS
 * @yields ChatStreamChunk events (chat_created, text, done, error)
 */
export async function* streamTaxAssessmentReview(
  assessmentDocumentId: string,
  sandboxMode = false
): AsyncGenerator<ChatStreamChunk, void, unknown> {
  try {
    for await (const raw of apiClient.stream<unknown>(API_ENDPOINTS.TAX_ASSESSMENT_REVIEW, {
      assessmentDocumentId,
      sandboxMode,
    })) {
      if (isChatStreamChunk(raw)) yield raw;
      else logger.error('Invalid ChatStreamChunk:', { data: raw });
    }
  } catch (err) {
    if (err instanceof ApiError) {
      switch (err.status) {
        case 401:
          throw new Error('Authentifizierung erforderlich. Bitte melden Sie sich erneut an.');
        case 500:
        case 502:
        case 503:
          throw new Error('Server-Fehler. Bitte versuchen Sie es später erneut.');
        default:
          throw new Error(`API-Fehler (${err.status}): ${err.message}`);
      }
    }
    throw err;
  }
}
