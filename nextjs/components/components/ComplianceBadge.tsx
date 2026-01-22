import React from 'react';
import { Shield } from 'lucide-react';

export const ComplianceBadge: React.FC = () => {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
      <Shield className="w-4 h-4 text-green-600" />
      <span className="text-xs font-medium text-green-700">
        🇩🇪 Hosted in Germany | DSGVO-konform
      </span>
    </div>
  );
};

