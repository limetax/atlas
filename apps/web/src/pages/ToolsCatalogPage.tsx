import { useMemo, useState } from 'react';

import { Search } from 'lucide-react';

import { ToolCard } from '@/components/features/tools/ToolCard';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { Tool, ToolCategory } from '@/data/tools';
import { CATEGORY_META, TOOLS } from '@/data/tools';
import { cn } from '@/lib/utils';

export const ToolsCatalogPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | null>(null);

  const filteredTools = useMemo(() => {
    let filtered = TOOLS;

    if (selectedCategory) {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) => t.name.toLowerCase().includes(query) || t.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  const handleCategoryClick = (category: ToolCategory) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  const toolsByCategory = useMemo(() => {
    const grouped = new Map<ToolCategory, Tool[]>();
    for (const tool of filteredTools) {
      const existing = grouped.get(tool.category) ?? [];
      existing.push(tool);
      grouped.set(tool.category, existing);
    }
    return grouped;
  }, [filteredTools]);

  return (
    <main className="flex-1 overflow-y-auto bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <PageHeader />

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Tools durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>

        {/* Category Chips */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {CATEGORY_META.map((category) => (
              <CategoryChip
                key={category.id}
                label={category.name}
                isActive={selectedCategory === category.id}
                onClick={() => handleCategoryClick(category.id)}
              />
            ))}
          </div>
        </div>

        {/* Tools by Category */}
        {filteredTools.length > 0 ? (
          <div className="space-y-12">
            {CATEGORY_META.map((categoryMeta) => {
              const tools = toolsByCategory.get(categoryMeta.id);
              if (!tools || tools.length === 0) return null;

              return (
                <CategorySection
                  key={categoryMeta.id}
                  name={categoryMeta.name}
                  description={categoryMeta.description}
                  tools={tools}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Keine Tools gefunden. Versuchen Sie eine andere Suche oder Kategorie.
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

// Subcomponents colocated below

const PageHeader = () => (
  <div className="mb-8">
    <h1 className="text-3xl font-bold text-foreground mb-2">KI-Toolbox</h1>
    <p className="text-muted-foreground text-base">
      Wählen Sie das passende Werkzeug für Ihre Analyse oder Bearbeitung
    </p>
  </div>
);

type CategoryChipProps = {
  label: string;
  isActive: boolean;
  onClick: () => void;
};

const CategoryChip = ({ label, isActive, onClick }: CategoryChipProps) => (
  <Badge
    className={cn(
      'cursor-pointer select-none px-3 py-1.5 text-sm font-medium transition-all',
      isActive
        ? 'bg-primary/90 text-primary-foreground shadow-sm hover:bg-primary'
        : 'bg-secondary/80 text-secondary-foreground hover:bg-secondary'
    )}
    onClick={onClick}
  >
    {label}
  </Badge>
);

type CategorySectionProps = {
  name: string;
  description?: string;
  tools: Tool[];
};

const CategorySection = ({ name, description, tools }: CategorySectionProps) => (
  <section>
    {/* Category Header with Orange Accent Bar */}
    <div className="flex items-start gap-3 mb-6">
      <div className="w-1 h-6 bg-primary rounded-full" />
      <div>
        <h2 className="text-xl font-bold text-foreground uppercase tracking-wide">{name}</h2>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
    </div>

    {/* Tools Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  </section>
);
