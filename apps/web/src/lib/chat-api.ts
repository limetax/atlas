import { Message, ChatStreamChunk, ChatContext } from '@atlas/shared';
import { env } from '@/config/env';
import { STORAGE_KEYS, API_ENDPOINTS } from '@/constants';
import { logger } from '@/utils/logger';

/**
 * Chat API client using Server-Sent Events (SSE)
 * More reliable than tRPC subscriptions for streaming
 * Supports optional assistantId for pre-configured assistant prompts
 * Supports optional context for MCP tool selection
 * Includes 2-minute timeout to prevent hanging requests
 */

const STREAM_TIMEOUT = 120000; // 2 minutes

/**
 * Creates a combined abort signal that aborts on either user action or timeout
 */
function createCombinedAbortSignal(userSignal?: AbortSignal, timeoutMs: number = STREAM_TIMEOUT) {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

  const combinedSignal = userSignal || timeoutController.signal;

  // Link user signal to timeout controller
  if (userSignal) {
    userSignal.addEventListener('abort', () => timeoutController.abort());
  }

  return { combinedSignal, timeoutController, timeoutId };
}

/**
 * Handles HTTP error responses with user-friendly messages
 */
function handleHttpError(status: number, statusText: string): never {
  switch (status) {
    case 401:
      throw new Error('Authentifizierung erforderlich. Bitte melden Sie sich erneut an.');
    case 429:
      throw new Error('Zu viele Anfragen. Bitte versuchen Sie es in einem Moment erneut.');
    case 500:
    case 502:
    case 503:
      throw new Error('Server-Fehler. Bitte versuchen Sie es später erneut.');
    default:
      throw new Error(`API-Fehler (${status}): ${statusText}`);
  }
}

/**
 * Processes a single SSE line and parses the JSON data
 */
function* processSSELine(line: string): Generator<ChatStreamChunk, void, unknown> {
  if (!line.startsWith('data: ')) return;

  try {
    const data = JSON.parse(line.slice(6));
    yield data as ChatStreamChunk;
  } catch (error) {
    logger.error('Failed to parse SSE chunk:', error, { line });
    // Continue processing other chunks instead of crashing
  }
}

/**
 * Streams chat messages using Server-Sent Events
 */
export async function* streamChatMessage(
  message: string,
  history: Message[],
  assistantId?: string,
  context?: ChatContext,
  signal?: AbortSignal
): AsyncGenerator<ChatStreamChunk, void, unknown> {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const { combinedSignal, timeoutController, timeoutId } = createCombinedAbortSignal(signal);

  try {
    // Make the API request
    const response = await fetch(`${env.apiUrl}${API_ENDPOINTS.CHAT_STREAM}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, history, assistantId, context }),
      signal: combinedSignal,
    });

    // Handle HTTP errors
    if (!response.ok) {
      handleHttpError(response.status, response.statusText);
    }

    // Get the response body reader
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is null');
    }

    // Process the stream
    yield* processStream(reader, combinedSignal, timeoutController, signal);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Processes the SSE stream and yields parsed chunks
 */
async function* processStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  combinedSignal: AbortSignal,
  timeoutController: AbortController,
  userSignal?: AbortSignal
): AsyncGenerator<ChatStreamChunk, void, unknown> {
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      // Check if aborted (either by user or timeout)
      if (combinedSignal.aborted) {
        reader.cancel();
        const isTimeout = timeoutController.signal.aborted && !userSignal?.aborted;
        throw new Error(isTimeout ? 'Request timeout after 2 minutes' : 'Stream cancelled by user');
      }

      // Read next chunk
      const { done, value } = await reader.read();
      if (done) break;

      // Decode and split into lines
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');

      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || '';

      // Process each complete line
      for (const line of lines) {
        yield* processSSELine(line);
      }
    }
  } finally {
    reader.releaseLock();
  }
}
