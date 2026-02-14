import { ChatContext } from '@atlas/shared';

import { ClientDropdown } from './ClientDropdown';
import { IntegrationToggle } from './IntegrationToggle';
import { ResearchDropdown } from './ResearchDropdown';

type ContextTogglesProps = {
  context: ChatContext;
  onContextChange: (context: ChatContext) => void;
};

export const ContextToggles = ({ context, onContextChange }: ContextTogglesProps) => {
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
      <ClientDropdown
        selected={context.mandant}
        onChange={(mandantId) => onContextChange({ ...context, mandant: mandantId })}
      />
    </div>
  );
};
