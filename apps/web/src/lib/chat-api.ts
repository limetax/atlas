import { Message, ChatStreamChunk } from '@lime-gpt/shared';

/**
 * Chat API client using Server-Sent Events (SSE)
 * More reliable than tRPC subscriptions for streaming
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function* streamChatMessage(
  message: string,
  history: Message[]
): AsyncGenerator<ChatStreamChunk, void, unknown> {
  const token = localStorage.getItem('supabase_token');

  const response = await fetch(`${API_URL}/api/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, history }),
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
