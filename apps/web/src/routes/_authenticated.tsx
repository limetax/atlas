import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { Sidebar } from '@/components/layouts/Sidebar';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { STORAGE_KEYS, ROUTES } from '@/constants';
import { isTokenExpired } from '@/utils/validators';
import { refreshTokens } from '@/lib/trpc';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

    if (!token) {
      throw redirect({ to: ROUTES.LOGIN, replace: true });
    }

    if (isTokenExpired(token)) {
      try {
        await refreshTokens();
      } catch {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        throw redirect({ to: ROUTES.LOGIN, replace: true });
      }
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Outlet />
        </div>
      </div>
      <Toaster position="bottom-right" />
    </AuthProvider>
  );
}
