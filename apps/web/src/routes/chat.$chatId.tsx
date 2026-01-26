import { createFileRoute, redirect } from '@tanstack/react-router';
import { ChatPage } from '@/pages/ChatPage';
import { STORAGE_KEYS, ROUTES } from '@/constants';
import { isTokenExpired } from '@/utils/validators';

export interface ChatRouteSearch {
  templateId?: string;
}

export const Route = createFileRoute('/chat/$chatId')({
  validateSearch: (search: Record<string, unknown>): ChatRouteSearch => {
    return {
      templateId: typeof search.templateId === 'string' ? search.templateId : undefined,
    };
  },
  beforeLoad: () => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

    if (!token) {
      throw redirect({ to: ROUTES.LOGIN, replace: true });
    }

    if (isTokenExpired(token)) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      throw redirect({ to: ROUTES.LOGIN, replace: true });
    }
  },
  component: ChatPage,
});
