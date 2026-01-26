import { createFileRoute, redirect } from '@tanstack/react-router';
import { ChatPage } from '@/pages/ChatPage';
import { STORAGE_KEYS, ROUTES } from '@/constants';
import { isTokenExpired } from '@/utils/validators';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

    // No token at all - redirect to login
    if (!token) {
      throw redirect({ to: ROUTES.LOGIN, replace: true });
    }

    // Token exists but is expired - clear it and redirect
    if (isTokenExpired(token)) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      throw redirect({ to: ROUTES.LOGIN, replace: true });
    }

    // Token exists and is not expired - allow access
  },
  component: ChatPage,
});
