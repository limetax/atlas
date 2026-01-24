import { Message, ChatStreamChunk } from '@atlas/shared';
import { env } from '@/config/env';
import { STORAGE_KEYS, API_ENDPOINTS } from '@/constants';

/**
 * Chat API client using Server-Sent Events (SSE)
 * More reliable than tRPC subscriptions for streaming
 * Supports optional assistantId for pre-configured assistant prompts
 */

export async function* streamChatMessage(
  message: string,
  history: Message[],
  assistantId?: string
): AsyncGenerator<ChatStreamChunk, void, unknown> {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${env.apiUrl}${API_ENDPOINTS.CHAT_STREAM}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, history, assistantId }),
  });

  if (!response.ok) {
    throw new Error('Failed to get response from API');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');

    // Keep the last incomplete line in the buffer
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        yield data as ChatStreamChunk;
      }
    }
  }
}
