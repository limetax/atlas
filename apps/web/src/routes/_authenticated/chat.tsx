import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { ChatPage } from '@/pages/ChatPage';

const chatSearchSchema = z.object({
  templateId: z.string().optional(),
  mandantId: z.string().optional(),
});

export const Route = createFileRoute('/_authenticated/chat')({
  validateSearch: chatSearchSchema,
  component: ChatPage,
});
