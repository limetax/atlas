import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export const PageLoader: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-gray-600">Laden...</p>
      </div>
    </div>
  );
};
