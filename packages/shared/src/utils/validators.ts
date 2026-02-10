import { z } from 'zod';

// Auth validators
export const LoginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen lang sein'),
});

export const MessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
  citations: z.array(z.any()).optional(),
  timestamp: z.union([z.date(), z.string()]).optional(),
});

export const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Nachricht darf nicht leer sein'),
  history: z.array(MessageSchema).default([]),
});

// Chat context stored alongside a chat session
export const ChatContextSchema = z.object({
  research: z.array(z.enum(['handelsregister', 'german_law', 'law_publishers'])).optional(),
  integration: z.enum(['datev']).optional(),
  mandant: z.string().optional(),
});

// Metadata stored alongside chat messages
// - assistant messages: toolCalls used during response
// - user messages: documents attached to the message
export const ChatMessageMetadataSchema = z.object({
  toolCalls: z
    .array(z.object({ name: z.string(), status: z.enum(['started', 'completed']) }))
    .optional(),
  documents: z
    .array(
      z.object({
        id: z.string(),
        chatId: z.string(),
        fileName: z.string(),
        fileSize: z.number(),
        status: z.enum(['processing', 'ready', 'error']),
        errorMessage: z.string().optional(),
        chunkCount: z.number(),
        createdAt: z.string(),
      })
    )
    .optional(),
});
