// Message types
export const MESSAGE_ROLES = ['user', 'assistant'] as const;
export type MessageRole = (typeof MESSAGE_ROLES)[number];

export type Message = {
  id?: string;
  role: MessageRole;
  content: string;
  citations?: Citation[];
  toolCalls?: Array<{ name: string; status: 'started' | 'completed' }>;
  attachedFiles?: Array<{ name: string; size: number }>;
  timestamp?: Date | string;
};

export type Citation = {
  id: string;
  source: string;
  title: string;
  content?: string;
};

// Context types for chat
export const RESEARCH_SOURCES = ['handelsregister', 'german_law', 'law_publishers'] as const;
export type ResearchSource = (typeof RESEARCH_SOURCES)[number];

export const INTEGRATION_TYPES = ['datev'] as const;
export type IntegrationType = (typeof INTEGRATION_TYPES)[number];

export type MandantId = string;

export type ChatContext = {
  research?: ResearchSource[];
  integration?: IntegrationType;
  mandant?: MandantId;
};

// Chat types
export type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  assistantId?: string;
  context?: ChatContext;
};

// RAG types
export const TAX_DOCUMENT_CATEGORIES = ['AO', 'EStG', 'UStG', 'Other'] as const;
export type TaxDocumentCategory = (typeof TAX_DOCUMENT_CATEGORIES)[number];

export type TaxDocument = {
  id: string;
  citation: string;
  title: string;
  content: string;
  category: TaxDocumentCategory;
};

// API types
export type ChatRequest = {
  message: string;
  history: Message[];
  sessionId?: string;
  context?: ChatContext;
  assistantId?: string;
};

export const CHAT_STREAM_CHUNK_TYPES = [
  'text',
  'citation',
  'citations',
  'files_processed',
  'done',
  'error',
  'tool_call',
  'chat_created',
] as const;
export type ChatStreamChunkType = (typeof CHAT_STREAM_CHUNK_TYPES)[number];

export type ChatStreamChunk = {
  type: ChatStreamChunkType;
  content?: string;
  citation?: Citation;
  citations?: Citation[];
  error?: string;
  toolCall?: { name: string; status: 'started' | 'completed' };
  chatId?: string;
  documents?: ChatDocument[];
};

// Metadata stored alongside chat messages
// - assistant messages: toolCalls used during response
// - user messages: documents attached to the message
export type ChatMessageMetadata = {
  toolCalls?: Array<{ name: string; status: 'started' | 'completed' }>;
  documents?: ChatDocument[];
};

// Persisted message (DB representation)
export type PersistedMessage = {
  id: string;
  chatId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  metadata?: ChatMessageMetadata;
};

// Document upload types
export const DOCUMENT_STATUSES = ['processing', 'ready', 'error'] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export type ChatDocument = {
  id: string;
  chatId: string;
  fileName: string;
  fileSize: number;
  status: DocumentStatus;
  errorMessage?: string;
  chunkCount: number;
  createdAt: string;
};

// LLM Adapter types
export const LLM_MESSAGE_ROLES = ['user', 'assistant', 'system'] as const;
export type LlmMessageRole = (typeof LLM_MESSAGE_ROLES)[number];

export type LLMMessage = {
  role: LlmMessageRole;
  content: string;
};

export type LLMStreamResponse = {
  content: string;
  isDone: boolean;
};
