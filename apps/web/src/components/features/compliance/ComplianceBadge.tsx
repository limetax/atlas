import React from 'react';
import { Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const ComplianceBadge: React.FC = () => {
  return (
    <Badge
      variant="outline"
      className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
    >
      <Shield className="w-4 h-4 text-green-600 mr-2" />
      🇩🇪 Hosted in Germany | DSGVO-konform
    </Badge>
  );
};
