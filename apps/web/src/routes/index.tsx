import { createFileRoute, redirect } from '@tanstack/react-router';
import { HomePage } from '../pages/HomePage';

// Helper to check if JWT is expired
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= exp;
  } catch {
    return true; // If we can't parse it, consider it invalid
  }
}

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const token = localStorage.getItem('supabase_token');

    // No token at all - redirect to login
    if (!token) {
      throw redirect({ to: '/login', replace: true });
    }

    // Token exists but is expired - clear it and redirect
    if (isTokenExpired(token)) {
      localStorage.removeItem('supabase_token');
      throw redirect({ to: '/login', replace: true });
    }

    // Token exists and is not expired - allow access
  },
  component: HomePage,
});
