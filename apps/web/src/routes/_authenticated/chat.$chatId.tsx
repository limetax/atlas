import { createFileRoute } from '@tanstack/react-router';
import { ChatPage } from '@/pages/ChatPage';

export type ChatRouteSearch = {
  templateId?: string;
};

export const Route = createFileRoute('/_authenticated/chat/$chatId')({
  validateSearch: (search: Record<string, unknown>): ChatRouteSearch => {
    return {
      templateId: typeof search.templateId === 'string' ? search.templateId : undefined,
    };
  },
  component: ChatPage,
});
