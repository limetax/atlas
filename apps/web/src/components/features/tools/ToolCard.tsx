import { Badge } from '@/components/ui/badge';
import type { Tool } from '@/data/tools';
import { ArrowRight } from 'lucide-react';
import { type JSX } from 'react';
import { useNavigate } from '@tanstack/react-router';

type ToolCardProps = {
  tool: Tool;
};

export const ToolCard = ({ tool }: ToolCardProps): JSX.Element => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (tool.status === 'active' || tool.status === 'beta') {
      // Special handling for Recherche tool - opens chat with template
      if (tool.id === 'recherche-chat') {
        navigate({
          to: tool.route,
          search: { templateId: 'steuerrechtliche-recherche' },
        });
      } else {
        navigate({ to: tool.route });
      }
    }
  };

  const isDisabled = tool.status === 'coming-soon' || tool.status === 'offline';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className="relative w-full text-left bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col gap-4 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 enabled:cursor-pointer enabled:hover:shadow-lg enabled:hover:border-primary"
    >
      {/* Status Badge */}
      {tool.badge && (
        <Badge
          variant={
            tool.status === 'offline'
              ? 'destructive'
              : tool.status === 'beta'
                ? 'default'
                : 'secondary'
          }
          className="absolute top-3 right-3"
        >
          {tool.badge}
        </Badge>
      )}
      {tool.status === 'coming-soon' && !tool.badge && (
        <Badge variant="secondary" className="absolute top-3 right-3">
          BALD
        </Badge>
      )}
      {tool.status === 'offline' && !tool.badge && (
        <Badge variant="destructive" className="absolute top-3 right-3">
          OFFLINE
        </Badge>
      )}

      {/* Icon */}
      <div className="w-12 h-12 flex items-center justify-center">
        <tool.icon className="w-10 h-10 text-primary" strokeWidth={1.75} />
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="text-base font-semibold text-foreground mb-2">{tool.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{tool.description}</p>
      </div>

      {/* Start Link */}
      <div className="flex justify-end items-center gap-2">
        <span
          className={`text-sm font-semibold transition-colors ${
            isDisabled ? 'text-muted-foreground' : 'text-primary'
          }`}
        >
          Start
        </span>
        <ArrowRight
          className={`w-4 h-4 transition-colors ${
            isDisabled ? 'text-muted-foreground' : 'text-primary'
          }`}
          strokeWidth={1.75}
        />
      </div>
    </button>
  );
};
