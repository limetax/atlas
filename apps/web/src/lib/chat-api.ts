import { API_ENDPOINTS } from '@/constants';
import { logger } from '@/utils/logger';
import {
  CHAT_STREAM_CHUNK_TYPES,
  type ChatContext,
  type ChatStreamChunk,
  type Message,
} from '@atlas/shared';
import { apiClient, ApiError } from '@/lib/api-client';

/**
 * Chat API client using Server-Sent Events (SSE)
 * More reliable than tRPC subscriptions for streaming
 * Supports optional context for MCP tool selection
 * Includes 2-minute timeout to prevent hanging requests
 */

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
 * Type guard to validate ChatStreamChunk structure
 */
export function isChatStreamChunk(data: unknown): data is ChatStreamChunk {
  if (typeof data !== 'object' || data === null) return false;

  const chunk = data as Record<string, unknown>;

  return (
    typeof chunk.type === 'string' &&
    CHAT_STREAM_CHUNK_TYPES.includes(chunk.type as ChatStreamChunk['type'])
  );
}

type ChatStreamFields = {
  message: string;
  history: Message[];
  context?: ChatContext;
  chatId?: string;
  documentIds?: string[];
};

/**
 * Serializes chat fields + files into a FormData body.
 * Arrays/objects are JSON-stringified; optional fields are omitted when absent.
 * Content-Type is NOT set — the browser adds the multipart boundary automatically.
 */
function buildFormData(fields: ChatStreamFields, files: File[]): FormData {
  const formData = new FormData();
  formData.append('message', fields.message);
  formData.append('history', JSON.stringify(fields.history));
  if (fields.context) formData.append('context', JSON.stringify(fields.context));
  if (fields.chatId) formData.append('chatId', fields.chatId);
  if (fields.documentIds?.length)
    formData.append('documentIds', JSON.stringify(fields.documentIds));
  files.forEach((file) => formData.append('files', file));
  return formData;
}

/**
 * Streams chat messages using Server-Sent Events
 *
 * @param message - The user's message to send
 * @param history - Previous messages in the conversation
 * @param context - Optional MCP tool context for research sources and integrations
 * @param signal - Optional AbortSignal to cancel the request
 *
 * @yields ChatStreamChunk events (text, citation, tool_call, done, error)
 *
 * @throws {Error} If HTTP request fails or stream times out after 2 minutes
 *
 * @example
 * ```typescript
 * for await (const chunk of streamChatMessage(message, history, context)) {
 *   if (chunk.type === 'text') console.log(chunk.content);
 * }
 * ```
 *
 * @remarks
 * Breaking change in TEC-58: Removed `assistantId` parameter (was 3rd parameter).
 * Pre-configured assistants are no longer exposed in the UI, though the backend
 * still supports them via ChatSession.assistantId if needed in the future.
 *
 * TEC-32: Added `chatId` parameter for server-side message persistence.
 * When omitted, the backend creates a new chat and returns `chatId` via a
 * `chat_created` stream chunk.
 */
export async function* streamChatMessage(
  message: string,
  history: Message[],
  context?: ChatContext,
  signal?: AbortSignal,
  chatId?: string,
  files?: File[],
  documentIds?: string[]
): AsyncGenerator<ChatStreamChunk, void, unknown> {
  const fields = { message, history, context, chatId, documentIds };
  const body = files?.length ? buildFormData(fields, files) : fields;

  try {
    for await (const raw of apiClient.stream<unknown>(API_ENDPOINTS.CHAT_STREAM, body, signal)) {
      if (isChatStreamChunk(raw)) yield raw;
      else logger.error('Invalid ChatStreamChunk:', { data: raw });
    }
  } catch (err) {
    if (err instanceof ApiError) handleHttpError(err.status, err.message);
    throw err;
  }
}
