import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { trpc, trpcClient } from '@/lib/trpc';
import { queryClient } from '@/lib/query-client';
import { router } from '@/router';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageLoader } from '@/components/ui/PageLoader';
import { initGlobalErrorHandlers } from '@/utils/error-handlers';
import '@/styles/globals.css';

// Initialize global error handlers
initGlobalErrorHandlers();

ReactDOM.createRoot(document.getElementById('root')!).render(
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
