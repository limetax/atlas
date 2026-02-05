import React from 'react';
import { Link } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface IntegrationToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export const IntegrationToggle: React.FC<IntegrationToggleProps> = ({ enabled, onChange }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => onChange(!enabled)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors',
              enabled
                ? 'bg-orange-50 border-orange-300 text-orange-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            )}
          >
            <Link className="w-4 h-4" />
            <span>DATEV</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={5}>
          <p className="text-xs">DATEV-Integration {enabled ? 'deaktivieren' : 'aktivieren'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
