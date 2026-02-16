import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { trpc, trpcClient } from '@/lib/trpc';
import { queryClient } from '@/lib/query-client';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageLoader } from '@/components/ui/PageLoader';
import { initGlobalErrorHandlers } from '@/utils/error-handlers';
import '@/styles/globals.css';

// Initialize global error handlers
initGlobalErrorHandlers();

// Import generated route tree
import { routeTree } from './routeTree.gen';

// Create router with route tree
const router = createRouter({ routeTree });

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Ensure there is a <div id="root"> in your index.html.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </trpc.Provider>
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
);
