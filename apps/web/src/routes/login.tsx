import { createFileRoute, redirect } from '@tanstack/react-router';
import { LoginView } from '@/components/features/auth/LoginView';
import { STORAGE_KEYS, ROUTES } from '@/constants';

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    // If already authenticated, redirect to home
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      throw redirect({ to: ROUTES.HOME, replace: true });
    }
  },
  component: LoginView,
});
