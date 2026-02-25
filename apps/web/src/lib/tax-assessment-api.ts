import { env } from '@/config/env';
import { API_ENDPOINTS } from '@/constants';
import { logger } from '@/utils/logger';
import { CHAT_STREAM_CHUNK_TYPES, type ChatStreamChunk } from '@atlas/shared';

/**
 * SSE client for tax assessment review streaming
 * Follows same pattern as chat-api.ts
 */

const STREAM_TIMEOUT = 120000; // 2 minutes

/**
 * Type guard to validate ChatStreamChunk structure
 */
function isChatStreamChunk(data: unknown): data is ChatStreamChunk {
  if (typeof data !== 'object' || data === null) return false;
  const chunk = data as Record<string, unknown>;
  return (
    typeof chunk.type === 'string' &&
    CHAT_STREAM_CHUNK_TYPES.includes(chunk.type as ChatStreamChunk['type'])
  );
}

/**
 * Processes a single SSE line and parses the JSON data
 */
function* processSSELine(line: string): Generator<ChatStreamChunk, void, unknown> {
  if (!line.startsWith('data: ')) return;

  try {
    const data = JSON.parse(line.slice(6));
    if (isChatStreamChunk(data)) {
      yield data;
    } else {
      logger.error('Invalid ChatStreamChunk structure:', { data });
    }
  } catch (error) {
    logger.error('Failed to parse SSE chunk:', error, { line });
  }
}

/**
 * Streams tax assessment review using Server-Sent Events
 *
 * @param assessmentDocumentId - The DMS document ID of the assessment
 * @param token - Auth JWT token
 * @param sandboxMode - When true, backend uses fixture PDFs instead of DMS
 * @yields ChatStreamChunk events (chat_created, text, done, error)
 */
export async function* streamTaxAssessmentReview(
  assessmentDocumentId: string,
  token: string,
  sandboxMode = false
): AsyncGenerator<ChatStreamChunk, void, unknown> {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), STREAM_TIMEOUT);

  try {
    const response = await fetch(`${env.apiUrl}${API_ENDPOINTS.TAX_ASSESSMENT_REVIEW}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ assessmentDocumentId, sandboxMode }),
      signal: timeoutController.signal,
    });

    if (!response.ok) {
      switch (response.status) {
        case 401:
          throw new Error('Authentifizierung erforderlich. Bitte melden Sie sich erneut an.');
        case 500:
        case 502:
        case 503:
          throw new Error('Server-Fehler. Bitte versuchen Sie es später erneut.');
        default:
          throw new Error(`API-Fehler (${response.status}): ${response.statusText}`);
      }
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response body is null');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        if (timeoutController.signal.aborted) {
          reader.cancel();
          throw new Error('Zeitüberschreitung nach 2 Minuten');
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          yield* processSSELine(line);
        }
      }
    } finally {
      reader.releaseLock();
    }
  } finally {
    clearTimeout(timeoutId);
  }
}
