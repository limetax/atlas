import React from 'react';
import { Link } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type IntegrationToggleProps = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
};

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
                ? 'bg-accent border-accent-foreground/20 text-accent-foreground'
                : 'bg-card border-input text-foreground hover:bg-muted'
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
