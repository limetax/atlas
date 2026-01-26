/**
 * TemplateCard Component
 * Displays a single template with title and description
 * Styled to match AssistantCard
 */

import React from 'react';
import { Template } from '@/types/template';

interface TemplateCardProps {
  template: Template;
  onInsert: (content: string) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ template, onInsert }) => {
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-orange-200 transition-all group cursor-pointer"
      onClick={() => onInsert(template.content)}
    >
      <h3 className="font-semibold text-gray-900 mb-2">{template.title}</h3>
      <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
    </div>
  );
};
