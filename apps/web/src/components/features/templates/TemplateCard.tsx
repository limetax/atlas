/**
 * TemplateCard Component
 * Displays a single template with title and description
 * Styled to match AssistantCard
 */

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Template } from '@/types/template';

type TemplateCardProps = {
  template: Template;
  onInsert: (templateId: string) => void;
};

export const TemplateCard = ({ template, onInsert }: TemplateCardProps) => {
  return (
    <Card
      className={cn(
        'p-6 hover:shadow-lg hover:border-primary/30 transition-all group cursor-pointer',
        'border-border'
      )}
      onClick={() => onInsert(template.id)}
    >
      <CardHeader className="p-0">
        <CardTitle className="text-base font-semibold text-foreground mb-1.5">
          {template.title}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground line-clamp-2">
          {template.description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};
