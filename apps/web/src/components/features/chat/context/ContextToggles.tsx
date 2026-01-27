import React from 'react';
import { ChatContext } from '@atlas/shared';
import { ResearchDropdown } from './ResearchDropdown';
import { IntegrationToggle } from './IntegrationToggle';
import { MandantenDropdown } from './MandantenDropdown';

interface ContextTogglesProps {
  context: ChatContext;
  onContextChange: (context: ChatContext) => void;
}

export const ContextToggles: React.FC<ContextTogglesProps> = ({ context, onContextChange }) => {
  return (
    <div className="flex gap-2 items-center flex-wrap">
      <ResearchDropdown
        selected={context.research ?? []}
        onChange={(sources) => onContextChange({ ...context, research: sources })}
      />
      <IntegrationToggle
        enabled={context.integration === 'datev'}
        onChange={(enabled) =>
          onContextChange({
            ...context,
            integration: enabled ? 'datev' : undefined,
          })
        }
      />
      <MandantenDropdown
        selected={context.mandant}
        onChange={(mandantId) => onContextChange({ ...context, mandant: mandantId })}
      />
    </div>
  );
};
