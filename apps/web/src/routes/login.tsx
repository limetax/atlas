import { createFileRoute, redirect } from '@tanstack/react-router';
import { LoginView } from '../views/LoginView';

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    // If already authenticated, redirect to home
    const token = localStorage.getItem('supabase_token');
    if (token) {
      throw redirect({ to: '/', replace: true });
    }
  },
  component: LoginView,
});
