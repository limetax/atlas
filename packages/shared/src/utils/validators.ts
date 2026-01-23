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
