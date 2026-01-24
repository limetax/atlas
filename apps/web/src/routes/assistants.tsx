import { createFileRoute, redirect } from '@tanstack/react-router';
import { AssistantsPage } from '@/pages/AssistantsPage';
import { STORAGE_KEYS, ROUTES } from '@/constants';
import { isTokenExpired } from '@/utils/validators';

export const Route = createFileRoute('/assistants')({
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
  component: AssistantsPage,
});
