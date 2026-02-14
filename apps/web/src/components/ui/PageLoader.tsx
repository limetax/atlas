import { LoadingSpinner } from './LoadingSpinner';

export const PageLoader = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-muted-foreground">Laden...</p>
      </div>
    </div>
  );
};
