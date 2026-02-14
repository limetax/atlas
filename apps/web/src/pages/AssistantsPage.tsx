import React from 'react';

import { Search } from 'lucide-react';

import { CategoryChip } from '@/components/features/templates/CategoryChip';
import { TemplateCard } from '@/components/features/templates/TemplateCard';
import { Input } from '@/components/ui/input';
import { TEMPLATES } from '@/data/templates';
import { TEMPLATE_CATEGORIES, TemplateCategory } from '@/types/template';
import { useNavigate } from '@tanstack/react-router';

import { useChatSessions } from './useChatSessions';

export const AssistantsPage = () => {
  const navigate = useNavigate();

  const { handleNewChat } = useChatSessions();

  const handleInsertTemplate = (templateId: string) => {
    const newSessionId = handleNewChat();
    navigate({
      to: '/chat/$chatId',
      params: { chatId: newSessionId },
      search: { templateId },
    });
  };

  return (
    <main className="flex-1 overflow-y-auto bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <PageHeader />
        <TemplatesSection onInsertTemplate={handleInsertTemplate} />
      </div>
    </main>
  );
};

const PageHeader = () => (
  <div className="mb-8">
    <h1 className="text-2xl font-bold text-foreground mb-2">Vorlagen</h1>
    <p className="text-muted-foreground">Nutzen Sie Prompt-Vorlagen für Ihre Steuerkanzlei.</p>
  </div>
);

type TemplatesSectionProps = {
  onInsertTemplate: (templateId: string) => void;
};

const TemplatesSection = ({ onInsertTemplate }: TemplatesSectionProps) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<TemplateCategory | null>(null);

  const filteredTemplates = React.useMemo(() => {
    let filtered = TEMPLATES;

    if (selectedCategory) {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

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
    <section>
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
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
        <div className="flex flex-wrap gap-2">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} onInsert={onInsertTemplate} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Keine Vorlagen gefunden. Versuchen Sie eine andere Suche oder Kategorie.
          </p>
        </div>
      )}
    </section>
  );
};
