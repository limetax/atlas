import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type Tool } from '@/data/tools';
import { useNavigate } from '@tanstack/react-router';

type ToolCardProps = {
  tool: Tool;
};

export const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const navigate = useNavigate();

  const handleStart = () => {
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
    <div className="relative bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col gap-4 transition-all duration-200 hover:shadow-lg hover:border-primary">
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

      {/* Action Button */}
      <Button
        variant={tool.featured ? 'default' : 'outline'}
        onClick={handleStart}
        disabled={isDisabled}
        className="w-full"
      >
        Start
      </Button>
    </div>
  );
};
