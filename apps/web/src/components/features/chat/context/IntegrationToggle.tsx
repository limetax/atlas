import React from 'react';
import { Link } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

interface IntegrationToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

export const IntegrationToggle: React.FC<IntegrationToggleProps> = ({ enabled, onChange }) => {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
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
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg z-50"
            sideOffset={5}
          >
            DATEV-Integration {enabled ? 'deaktivieren' : 'aktivieren'}
            <Tooltip.Arrow className="fill-gray-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};
