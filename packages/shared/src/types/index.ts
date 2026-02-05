// Message types
export const MESSAGE_ROLES = ['user', 'assistant'] as const;
export type MessageRole = (typeof MESSAGE_ROLES)[number];

export interface Message {
  id?: string;
  role: MessageRole;
  content: string;
  citations?: Citation[];
  toolCalls?: Array<{ name: string; status: 'started' | 'completed' }>;
  timestamp?: Date | string;
}

export interface Citation {
  id: string;
  source: string;
  title: string;
  content?: string;
}

// Context types for chat
export const RESEARCH_SOURCES = ['handelsregister', 'german_law', 'law_publishers'] as const;
export type ResearchSource = (typeof RESEARCH_SOURCES)[number];

export const INTEGRATION_TYPES = ['datev'] as const;
export type IntegrationType = (typeof INTEGRATION_TYPES)[number];

export type MandantId = string;

export interface ChatContext {
  research?: ResearchSource[];
  integration?: IntegrationType;
  mandant?: MandantId;
}

// Chat types
export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  assistantId?: string; // Optional: links chat to a specific assistant
  context?: ChatContext; // Context selections for this session (for future Langdock integration)
}

// RAG types
export const TAX_DOCUMENT_CATEGORIES = ['AO', 'EStG', 'UStG', 'Other'] as const;
export type TaxDocumentCategory = (typeof TAX_DOCUMENT_CATEGORIES)[number];

export interface TaxDocument {
  id: string;
  citation: string;
  title: string;
  content: string;
  category: TaxDocumentCategory;
}

// API types
export interface ChatRequest {
  message: string;
  history: Message[];
  sessionId?: string;
  context?: ChatContext;
  assistantId?: string;
}

export const CHAT_STREAM_CHUNK_TYPES = [
  'text',
  'citation',
  'citations',
  'done',
  'error',
  'tool_call',
] as const;
export type ChatStreamChunkType = (typeof CHAT_STREAM_CHUNK_TYPES)[number];

export interface ChatStreamChunk {
  type: ChatStreamChunkType;
  content?: string;
  citation?: Citation;
  citations?: Citation[];
  error?: string;
  toolCall?: { name: string; status: 'started' | 'completed' };
}

// LLM Adapter types
export const LLM_MESSAGE_ROLES = ['user', 'assistant', 'system'] as const;
export type LlmMessageRole = (typeof LLM_MESSAGE_ROLES)[number];

export interface LLMMessage {
  role: LlmMessageRole;
  content: string;
}

export interface LLMStreamResponse {
  content: string;
  done: boolean;
}
