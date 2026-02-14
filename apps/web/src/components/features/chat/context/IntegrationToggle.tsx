import { type ReactElement } from 'react';
import { Link } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type IntegrationToggleProps = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
};

export const IntegrationToggle = ({ enabled, onChange }: IntegrationToggleProps): ReactElement => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => onChange(!enabled)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              enabled
                ? 'bg-accent text-accent-foreground'
                : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Link className={cn('w-4 h-4', enabled && 'text-primary')} />
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
