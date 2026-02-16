import '@/styles/globals.css';

import React, { Suspense } from 'react';

import ReactDOM from 'react-dom/client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageLoader } from '@/components/ui/PageLoader';
import { queryClient } from '@/lib/query-client';
import { trpc, trpcClient } from '@/lib/trpc';
import { router } from '@/router';
import { initGlobalErrorHandlers } from '@/utils/error-handlers';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider } from '@tanstack/react-router';

// Initialize global error handlers
initGlobalErrorHandlers();

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
