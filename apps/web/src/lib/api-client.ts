import { env } from '@/config/env';
import { STORAGE_KEYS } from '@/constants';
import { logger } from '@/utils/logger';
import { refreshTokens } from '@/lib/trpc';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    statusText: string
  ) {
    super(`API-Fehler (${status}): ${statusText}`);
    this.name = 'ApiError';
  }
}

const getAuthToken = (): string | null => localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
const authHeaders = (token: string | null): Record<string, string> =>
  token ? { Authorization: `Bearer ${token}` } : {};

const STREAM_TIMEOUT_MS = 120_000;

type CombinedAbort = {
  signal: AbortSignal;
  timeoutController: AbortController;
  timeoutId: ReturnType<typeof setTimeout>;
};

const createAbort = (userSignal?: AbortSignal, ms = STREAM_TIMEOUT_MS): CombinedAbort => {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), ms);
  if (userSignal) userSignal.addEventListener('abort', () => timeoutController.abort());
  return { signal: userSignal ?? timeoutController.signal, timeoutController, timeoutId };
};

async function* readStream<T>(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  abort: CombinedAbort,
  userSignal?: AbortSignal
): AsyncGenerator<T, void, unknown> {
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      if (abort.signal.aborted) {
        reader.cancel();
        const isTimeout = abort.timeoutController.signal.aborted && !userSignal?.aborted;
        throw new Error(isTimeout ? 'Request timeout after 2 minutes' : 'Stream cancelled by user');
      }
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          yield JSON.parse(line.slice(6)) as T;
        } catch {
          logger.error('Failed to parse SSE line:', { line });
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Wraps a fetch-based call with a single 401 → refresh → retry cycle.
 * On successful refresh, retries the original call with the updated token.
 * Propagates the error if refresh fails.
 */
const withRefreshOn401 = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      await refreshTokens(); // throws if no refresh token or Supabase rejects
      return fn(); // retry once with the new token now in localStorage
    }
    throw err;
  }
};

const post = async <T>(path: string, body: unknown): Promise<T> => {
  return withRefreshOn401(() =>
    fetch(`${env.apiUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(getAuthToken()) },
      body: JSON.stringify(body),
    }).then((res) => {
      if (!res.ok) throw new ApiError(res.status, res.statusText);
      return res.json() as Promise<T>;
    })
  );
};

const postForm = async <T>(path: string, body: FormData): Promise<T> => {
  return withRefreshOn401(() =>
    fetch(`${env.apiUrl}${path}`, {
      method: 'POST',
      headers: authHeaders(getAuthToken()), // no Content-Type — browser sets multipart boundary
      body,
    }).then((res) => {
      if (!res.ok) throw new ApiError(res.status, res.statusText);
      return res.json() as Promise<T>;
    })
  );
};

async function* stream<T>(
  path: string,
  body: unknown | FormData,
  signal?: AbortSignal
): AsyncGenerator<T, void, unknown> {
  const abort = createAbort(signal);
  try {
    const isForm = body instanceof FormData;
    const doFetch = async (): Promise<Response> => {
      const res = await fetch(`${env.apiUrl}${path}`, {
        method: 'POST',
        headers: {
          ...authHeaders(getAuthToken()),
          ...(!isForm ? { 'Content-Type': 'application/json' } : {}),
        },
        body: isForm ? body : JSON.stringify(body),
        signal: abort.signal,
      });
      if (!res.ok) throw new ApiError(res.status, res.statusText);
      return res;
    };

    const res = await withRefreshOn401(doFetch);
    const reader = res.body?.getReader();
    if (!reader) throw new Error('Response body is null');
    yield* readStream<T>(reader, abort, signal);
  } finally {
    clearTimeout(abort.timeoutId);
  }
}

export const apiClient = { post, postForm, stream };
