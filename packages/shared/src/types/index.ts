// Message types
export interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp?: Date | string;
}

export interface Citation {
  id: string;
  source: string;
  title: string;
  content?: string;
}

// Context types for chat
export type ResearchSource = 'handelsregister' | 'german_law' | 'law_publishers';
export type IntegrationType = 'datev';
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
export interface TaxDocument {
  id: string;
  citation: string;
  title: string;
  content: string;
  category: 'AO' | 'EStG' | 'UStG' | 'Other';
}

// API types
export interface ChatRequest {
  message: string;
  history: Message[];
  sessionId?: string;
  context?: ChatContext;
  assistantId?: string;
}

export interface ChatStreamChunk {
  type: 'text' | 'citation' | 'citations' | 'done' | 'error';
  content?: string;
  citation?: Citation;
  citations?: Citation[];
  error?: string;
}

// LLM Adapter types
export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMStreamResponse {
  content: string;
  done: boolean;
}
