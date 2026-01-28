/**
 * CategoryChip Component
 * Pill-shaped filter button for template categories
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TemplateCategory, TEMPLATE_CATEGORIES } from '@/types/template';
import { cn } from '@/lib/utils';

interface CategoryChipProps {
  category: TemplateCategory;
  isActive: boolean;
  onClick: () => void;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({ category, isActive, onClick }) => {
  const categoryInfo = TEMPLATE_CATEGORIES.find((c) => c.id === category);
  const label = categoryInfo?.label || category;

  return (
    <Badge
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer',
        isActive
          ? 'bg-orange-500 text-white shadow-sm hover:bg-orange-600'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
      )}
    >
      {label}
    </Badge>
  );
};
