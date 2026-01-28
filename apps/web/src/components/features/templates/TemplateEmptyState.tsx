/**
 * TemplateEmptyState Component
 * Main empty state UI showing templates, search, and category filters
 */

import React, { useState, useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { Search, Bot } from 'lucide-react';
import { TEMPLATES } from '@/data/templates';
import { TemplateCategory, TEMPLATE_CATEGORIES } from '@/types/template';
import { TemplateCard } from './TemplateCard';
import { CategoryChip } from './CategoryChip';
import { Input } from '@/components/ui/input';

interface TemplateEmptyStateProps {
  onInsertTemplate: (content: string) => void;
}

export const TemplateEmptyState: React.FC<TemplateEmptyStateProps> = ({ onInsertTemplate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | null>(null);

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    let filtered = TEMPLATES;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.content.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  const handleCategoryClick = (category: TemplateCategory) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 pt-40 pb-20">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Willkommen!</h1>
          <p className="text-gray-600">
            Wählen Sie eine Vorlage aus oder starten Sie eine neue Unterhaltung
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Vorlagen durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>

        {/* Category Chips */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {TEMPLATE_CATEGORIES.map((category) => (
              <CategoryChip
                key={category.id}
                category={category.id}
                isActive={selectedCategory === category.id}
                onClick={() => handleCategoryClick(category.id)}
              />
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {filteredTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} onInsert={onInsertTemplate} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">
              Keine Vorlagen gefunden. Versuchen Sie eine andere Suche oder Kategorie.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">
            Oder arbeiten Sie mit einem spezialisierten Assistenten
          </p>
          <Link
            to="/assistants"
            className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
          >
            <Bot className="w-4 h-4" />
            Assistenten anzeigen
          </Link>
        </div>
      </div>
    </div>
  );
};
