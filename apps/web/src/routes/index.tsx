import { createFileRoute, redirect } from '@tanstack/react-router';
import { HomePage } from '../pages/HomePage';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const token = localStorage.getItem('supabase_token');
    if (!token) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: HomePage,
});
