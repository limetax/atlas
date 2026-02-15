import type { ToolCategory } from '@/data/tools';
import { ToolCard } from '@/components/features/tools/ToolCard';
import { CATEGORY_META, getToolsByCategory } from '@/data/tools';
import { type JSX } from 'react';

export const ToolsCatalogPage = (): JSX.Element => {
  return (
    <main className="flex-1 overflow-y-auto bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <PageHeader />
        <CategoriesSection />
      </div>
    </main>
  );
};

// Subcomponents colocated below

const PageHeader = (): JSX.Element => (
  <div className="mb-10">
    <h1 className="text-3xl font-bold text-foreground mb-2">KI-Toolbox</h1>
    <p className="text-muted-foreground text-base">
      Wählen Sie das passende Werkzeug für Ihre Analyse oder Bearbeitung
    </p>
  </div>
);

const CategoriesSection = (): JSX.Element => (
  <div className="space-y-12">
    {CATEGORY_META.map((categoryMeta) => (
      <CategorySection key={categoryMeta.id} category={categoryMeta.id} />
    ))}
  </div>
);

type CategorySectionProps = {
  category: ToolCategory;
};

const CategorySection = ({ category }: CategorySectionProps): JSX.Element | null => {
  const tools = getToolsByCategory(category);
  const meta = CATEGORY_META.find((c) => c.id === category);

  if (tools.length === 0) return null;

  return (
    <section>
      {/* Category Header with Orange Accent Bar */}
      <div className="flex items-start gap-3 mb-6">
        <div className="w-1 h-6 bg-primary rounded-full" />
        <div>
          <h2 className="text-xl font-bold text-foreground uppercase tracking-wide">
            {meta?.name}
          </h2>
          {meta?.description && (
            <p className="text-sm text-muted-foreground mt-1">{meta.description}</p>
          )}
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
};
