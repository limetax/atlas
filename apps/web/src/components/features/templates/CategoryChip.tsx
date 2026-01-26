/**
 * CategoryChip Component
 * Pill-shaped filter button for template categories
 */

import React from 'react';
import { TemplateCategory, TEMPLATE_CATEGORIES } from '@/types/template';

interface CategoryChipProps {
  category: TemplateCategory;
  isActive: boolean;
  onClick: () => void;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({ category, isActive, onClick }) => {
  const categoryInfo = TEMPLATE_CATEGORIES.find((c) => c.id === category);
  const label = categoryInfo?.label || category;

  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
        ${
          isActive
            ? 'bg-orange-500 text-white shadow-sm'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
        }
      `}
    >
      {label}
    </button>
  );
};
