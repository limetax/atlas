/**
 * CategoryChip Component
 * Pill-shaped filter button for template categories
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TEMPLATE_CATEGORIES, TemplateCategory } from '@/types/template';

type CategoryChipProps = {
  category: TemplateCategory;
  isActive: boolean;
  onClick: () => void;
};

export const CategoryChip = ({ category, isActive, onClick }: CategoryChipProps) => {
  const categoryInfo = TEMPLATE_CATEGORIES.find((c) => c.id === category);
  const label = categoryInfo?.label || category;

  return (
    <Badge
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer',
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
      )}
    >
      {label}
    </Badge>
  );
};
