import React from 'react';
import { Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const ComplianceBadge: React.FC = () => {
  return (
    <Badge
      variant="outline"
      className="border-success/30 bg-success-bg text-success-text hover:bg-success-bg/80"
    >
      <Shield className="w-4 h-4 text-success mr-2" />
      🇩🇪 Hosted in Germany | DSGVO-konform
    </Badge>
  );
};
